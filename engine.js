// AskMeMed engine: privacy masking, triage, source search and draft building.
// It runs in the browser, and can also be loaded in Node for automated testing.
// No data leaves the browser and no external AI service is called.

const STOPWORDS = new Set(("a an the and or of to in on at is are am be been it its this that these those i me my we you your " +
  "can could should would will do does did what how when which who why where if with for from about any there have has had " +
  "please hi hello thanks thank use using take taking get much many").split(" "));

function stem(word) {
  if (word.length > 4) {
    for (const suffix of ["ing", "ed", "es", "s"]) {
      if (word.endsWith(suffix)) return word.slice(0, -suffix.length);
    }
  }
  return word;
}

function tokens(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w && !STOPWORDS.has(w)).map(stem);
}

// ---------- 1. Privacy: mask personal details before anything else happens ----------
function redact(text) {
  const found = [];
  let out = text;
  const rules = [
    { label: "email address", re: /[\w.+-]+@[\w-]+\.[\w.]+/g, tag: "[EMAIL]" },
    { label: "phone number", re: /(\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b/g, tag: "[PHONE]" },
    { label: "NHS number", re: /\b\d{3}\s?\d{3}\s?\d{4}\b/g, tag: "[NHS-NUMBER]" },
    { label: "postcode", re: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi, tag: "[POSTCODE]" },
    { label: "name", re: /\b([Mm]y name is|[Ii] am called|[Ii]'m called)\s+([A-Z][a-z]+(\s[A-Z][a-z]+)?)/g, tag: "$1 [NAME]" },
    { label: "date of birth", re: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g, tag: "[DATE]" }
  ];
  for (const r of rules) {
    const matches = out.match(r.re);
    if (matches) {
      found.push(`${matches.length} ${r.label}${matches.length > 1 ? "s" : ""}`);
      out = out.replace(r.re, r.tag);
    }
  }
  return { text: out, found };
}

// ---------- 2. Which product is the enquiry about? ----------
function detectProduct(text) {
  const lower = text.toLowerCase();
  return PRODUCTS.find(p => p.aliases.some(a => lower.includes(a))) || null;
}

// ---------- 3. Triage rules: decide if a human expert or safety team must handle it ----------
const RULES = {
  urgent: {
    label: "Possible overdose",
    tests: [/overdose/i, /\b(took|taken|swallowed|injected|used)\b.{0,30}\b(too many|too much|extra|double|two doses|three|four|five|several|whole (box|pack))\b/i]
  },
  safety: {
    label: "Someone may have had a side effect (the safety team must record it within 1 working day)",
    // needs BOTH a personal experience phrase AND a symptom word
    experience: /\b(since (taking|using|starting|i started)|after (taking|using|injecting|i took)|i('ve| have)? (had|got|developed|noticed|been getting)|made me|gave me|i feel|i felt|i('m| am) getting)\b/i,
    symptom: /\b(rash|swell|swelling|itch|itchy|pain|sick|vomit|dizzy|dizziness|headache|reaction|side effect|bleed|bleeding|breathless|hospital|faint|fainted|thrush|sore|palpitations|blurred)\b/i
  },
  expert: [
    { label: "Question about pregnancy or breastfeeding", re: /pregnan|breastfeed|breast-feed|trying for a baby|conceive/i },
    { label: "Question about a child", re: /\b([1-9]|1[0-5])[ -]?(year|yr)s?[ -]?old\b|\b(baby|toddler|son|daughter|kid|kids|teenager)\b|\bchild(ren)?\b/i },
    { label: "Asks about using the medicine for something it is not approved for", re: /\b(use|take|give)\b.{0,25}\bfor\b.{0,40}\binstead\b|\boff[- ]label\b|\bunlicensed\b|\binstead of\b/i },
    { label: "Compares with other products (needs a compliance check)", re: /\bbetter than\b|\bworse than\b|\bcompared (to|with)\b|\bversus\b|\bvs\b|\bswitch (to|from)\b/i }
  ]
};

function triage(text) {
  const reasons = [];
  if (RULES.urgent.tests.some(re => re.test(text))) return { route: "urgent", reasons: [RULES.urgent.label] };
  if (RULES.safety.experience.test(text) && RULES.safety.symptom.test(text)) return { route: "safety", reasons: [RULES.safety.label] };
  for (const rule of RULES.expert) if (rule.re.test(text)) reasons.push(rule.label);
  if (reasons.length) return { route: "expert", reasons };
  return { route: "draft", reasons: [] };
}

// ---------- 4. Search approved documents ----------
function searchSections(query, product) {
  const productWords = new Set(PRODUCTS.flatMap(p => p.aliases.map(stem)));
  const q = tokens(query).filter(t => !productWords.has(t));
  const docs = DOCUMENTS.filter(d => d.product === product.id);
  const results = [];
  for (const doc of docs) {
    for (const s of doc.sections) {
      const kw = new Set(tokens(s.keywords + " " + s.heading));
      const body = new Set(tokens(s.text));
      let keywordHits = 0, bodyHits = 0;
      const matched = [];
      for (const t of new Set(q)) {
        if (kw.has(t)) { keywordHits++; matched.push(t); }
        else if (body.has(t)) { bodyHits++; matched.push(t); }
      }
      const score = keywordHits + 0.25 * bodyHits;
      if (score > 0) results.push({ doc, section: s, score, keywordHits, matched });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

function cite(doc, s) { return `${doc.id} §${s.sec}, ${doc.version}`; }

function standardSection(docId) {
  const doc = DOCUMENTS.find(d => d.id === docId);
  return { doc, section: doc.sections[0], score: null, keywordHits: null, matched: [] };
}

// ---------- 5. Build a draft using ONLY approved text ----------
// The draft is put together from approved sentences, word for word, each with a citation.
// Nothing is made up, so every sentence can be checked against its source.
function buildDraft(productName, picked, intro) {
  const lines = ["Dear enquirer,", "", intro || `Thank you for your enquiry about ${productName}.`, ""];
  for (const p of picked) { lines.push(`${p.section.text} [${cite(p.doc, p.section)}]`, ""); }
  lines.push("Please speak to your doctor or pharmacist if you have any further questions about your treatment.", "",
    "Kind regards,", "Medical Information Team");
  return lines.join("\n");
}

const MIN_SCORE = 1; // at least one curated keyword must match, otherwise we do not draft

function analyse(rawText) {
  const privacy = redact(rawText);
  const text = privacy.text;
  const product = detectProduct(text);
  const t = triage(text);
  const result = { input: rawText, redacted: text, piiFound: privacy.found, product: product ? product.name : null,
    route: t.route, reasons: t.reasons.slice(), sources: [], draft: "", confidence: "" };

  const name = product ? product.name : "our product";

  if (t.route === "urgent") {
    result.sources = [standardSection("SRD-OD")];
    result.draft = buildDraft(name, result.sources, "Thank you for contacting us. Your safety is our priority.");
    result.confidence = "Standard urgent response. A medical expert must call back today.";
    return result;
  }
  if (t.route === "safety") {
    result.sources = [standardSection("SRD-AE")];
    result.draft = buildDraft(name, result.sources);
    result.confidence = "Standard acknowledgement only. Side effect details go to the safety team.";
    return result;
  }
  if (t.route === "expert") {
    result.sources = [standardSection("SRD-REF")];
    result.draft = buildDraft(name, result.sources);
    result.confidence = "Holding reply only. The full answer must come from a medical expert.";
    return result;
  }
  if (!product) {
    result.route = "nosource";
    result.reasons.push("No medicine named, so the tool cannot pick the right document");
    result.confidence = "No draft. Ask which medicine they mean, or pass to an expert.";
    return result;
  }
  const hits = searchSections(text, product);
  if (!hits.length || hits[0].score < MIN_SCORE) {
    result.route = "nosource";
    result.reasons.push("None of the approved documents answer this question");
    result.sources = hits.slice(0, 2);
    result.confidence = "No draft. The tool will not guess. Pass to an expert.";
    return result;
  }
  const top = hits[0];
  const picked = [top];
  const second = hits[1];
  if (second && second.keywordHits >= 1 && second.score >= 0.75 * top.score && second.doc.id === top.doc.id) picked.push(second);
  result.sources = picked;
  result.draft = buildDraft(product.name, picked);
  result.confidence = top.keywordHits >= 2 ? "Confidence high: good match to an approved section" : "Confidence medium: check the match carefully";
  return result;
}

if (typeof module !== "undefined") module.exports = { analyse, redact, triage, cite };
