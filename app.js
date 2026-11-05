// User interface for AskMeMed. Logic lives in engine.js.

const $ = id => document.getElementById(id);
const ROUTE_TEXT = {
  draft: "Draft ready for a person to check",
  expert: "Send to a medical expert",
  safety: "Side effect: send to safety team",
  urgent: "URGENT: possible overdose",
  nosource: "No approved answer: a person must reply"
};
let current = null;
let originalDraft = "";

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// ---------- Tabs ----------
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === btn.dataset.tab));
  if (btn.dataset.tab === "log") renderLog();
}));

// ---------- Samples ----------
[...TEST_CASES, ...UNSEEN_CASES].forEach((c, i) => {
  const o = document.createElement("option");
  o.value = i; o.textContent = c.q;
  $("sample").appendChild(o);
});
$("sample").addEventListener("change", e => {
  if (e.target.value === "") return;
  $("q").value = [...TEST_CASES, ...UNSEEN_CASES][e.target.value].q;
  run();
});
$("analyse").addEventListener("click", run);

// ---------- Analyse ----------
function run() {
  const text = $("q").value.trim();
  if (!text) { $("q").focus(); return; }
  current = analyse(text);
  current.id = "ENQ-" + Date.now().toString().slice(-6);
  $("result").hidden = false;
  $("actionmsg").hidden = true;
  ["c1", "c2"].forEach(id => $(id).checked = false);

  $("privacy").innerHTML = current.piiFound.length
    ? `<p class="warn">Hidden: ${esc(current.piiFound.join(", "))}</p><p><strong>Version used from now on:</strong><br>${esc(current.redacted)}</p>`
    : `<p class="ok">No personal details found.</p>`;

  const reasons = current.reasons.length ? `<ul class="plain">${current.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : "<p class='muted'>Not risky.</p>";
  $("triage").innerHTML = `<span class="badge route-${current.route}">${ROUTE_TEXT[current.route]}</span>
    <p><strong>Product:</strong> ${esc(current.product || "Not named")}</p>${reasons}`;

  $("sources").innerHTML = current.sources.length
    ? current.sources.map(s => `<div class="source"><div class="meta">${esc(cite(s.doc, s.section))} · approved ${esc(s.doc.approved)} · ${esc(s.doc.title)}${s.score !== null ? ` · match score ${s.score}` : ""}</div>
        <strong>${esc(s.section.heading)}</strong><div>${esc(s.section.text)}</div></div>`).join("")
    : `<p class="muted">No approved section matched this question.</p>`;

  $("confidence").textContent = current.confidence;
  originalDraft = current.draft;
  $("draft").value = current.draft || "No draft was made. A person needs to reply to this question.";
  $("draft").disabled = !current.draft;
  $("editwarn").hidden = true;
  updateButtons();
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Review controls ----------
function canApprove() {
  if (!current) return false;
  if (current.route === "expert" || current.route === "nosource") return false; // only an expert can answer these
  return $("reviewer").value.trim() && $("c1").checked && $("c2").checked;
}
function updateButtons() {
  const blocked = current && (current.route === "expert" || current.route === "nosource");
  $("approve").disabled = !canApprove();
  $("approve").textContent = current && current.route === "safety" ? "Send acknowledgement and open safety case"
    : current && current.route === "urgent" ? "Send urgent advice and alert expert" : "Approve and send";
  $("approve").title = blocked ? "This enquiry must be answered by a medical expert" : "";
  $("c2").parentElement.style.display = current && current.route === "draft" ? "flex" : "none";
  if (current && current.route !== "draft") $("c2").checked = true;
}
["reviewer", "c1", "c2"].forEach(id => $(id).addEventListener("input", updateButtons));
$("draft").addEventListener("input", () => { $("editwarn").hidden = $("draft").value === originalDraft; });

$("approve").addEventListener("click", () => {
  if (!canApprove()) return;
  const action = current.route === "safety" ? "Acknowledged + safety case opened" : current.route === "urgent" ? "Urgent advice sent + expert alerted" : "Approved and sent";
  record(action);
  $("actionmsg").textContent = `${action}. Logged as ${current.id}. (Demo only: nothing was actually sent.)`;
  $("actionmsg").hidden = false;
});
$("escalate").addEventListener("click", () => {
  if (!current) return;
  record("Sent to medical expert");
  $("actionmsg").textContent = `Sent to the medical expert queue. Logged as ${current.id}. (Demo only.)`;
  $("actionmsg").hidden = false;
});

// ---------- Audit log (stored in this browser only) ----------
const LOG_KEY = "askmemed-log";
function loadLog() { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch (e) { return memoryLog; } }
let memoryLog = [];
function saveLog(log) { memoryLog = log; try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) { /* storage blocked: keep in memory */ } }
function record(action) {
  const log = loadLog();
  log.unshift({
    time: new Date().toLocaleString("en-GB"), id: current.id, enquiry: current.redacted, route: current.route,
    sources: current.sources.map(s => cite(s.doc, s.section)).join("; "), action,
    reviewer: $("reviewer").value.trim() || "(not given)", edited: $("draft").value !== originalDraft ? "Yes" : "No"
  });
  saveLog(log);
}
function renderLog() {
  const log = loadLog();
  $("emptylog").hidden = log.length > 0;
  $("logtable").querySelector("tbody").innerHTML = log.map(r => `<tr><td>${esc(r.time)}<br><span class="muted">${esc(r.id)}</span></td>
    <td>${esc(r.enquiry)}</td><td><span class="badge route-${r.route}">${esc(r.route)}</span></td><td>${esc(r.sources || "None")}</td>
    <td>${esc(r.action)}</td><td>${esc(r.reviewer)}</td><td>${esc(r.edited)}</td></tr>`).join("");
}
$("clearlog").addEventListener("click", () => { saveLog([]); renderLog(); });
$("exportcsv").addEventListener("click", () => {
  const log = loadLog();
  const cols = ["time", "id", "enquiry", "route", "sources", "action", "reviewer", "edited"];
  const csv = [cols.join(","), ...log.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "askmemed-log.csv";
  a.click();
});

// ---------- Tests ----------
function check(c) {
  const r = analyse(c.q);
  const got = r.sources[0] ? `${r.sources[0].doc.id} §${r.sources[0].section.sec}` : "";
  const ok = r.route === c.route && (c.route === "nosource" ? !r.draft : got === c.source);
  return { r, got, ok };
}
$("runtests").addEventListener("click", () => {
  const sets = [["Building", TEST_CASES], ["New", UNSEEN_CASES]];
  const rows = [], score = {};
  for (const [name, cases] of sets) {
    score[name] = { pass: 0, total: cases.length };
    for (const c of cases) {
      const { r, got, ok } = check(c);
      if (ok) score[name].pass++;
      rows.push(`<tr><td>${name}</td><td>${esc(c.q)}</td><td>${esc(c.route)}${c.source ? "<br><span class='muted'>" + esc(c.source) + "</span>" : ""}</td>
        <td>${esc(r.route)}${got ? "<br><span class='muted'>" + esc(got) + "</span>" : ""}</td><td class="${ok ? "pass" : "fail"}">${ok ? "Pass" : "Fail"}</td></tr>`);
    }
  }
  $("testtable").querySelector("tbody").innerHTML = rows.join("");
  $("testsummary").innerHTML = `<div class="summary">${Object.entries(score).map(([n, s]) =>
    `<div class="stat"><b>${s.pass} / ${s.total}</b>${n} set</div>`).join("")}</div>`;
});

// ---------- Documents ----------
$("doclist").innerHTML = DOCUMENTS.map(d => `<h3>${esc(d.title)} <span class="muted">(${esc(d.id)}, ${esc(d.version)}, approved ${esc(d.approved)})</span></h3>
  ${d.sections.map(s => `<div class="source"><div class="meta">§${esc(s.sec)}</div><strong>${esc(s.heading)}</strong><div>${esc(s.text)}</div></div>`).join("")}`).join("");
