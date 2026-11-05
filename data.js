// All medicines, documents and questions in this file are MADE UP for this prototype.
// They do not describe any real medicine and must not be used as medical advice.

const PRODUCTS = [
  { id: "NAZASKI", name: "Nazaski", aliases: ["nazaski"], use: "period pain", form: "250 mg tablets" },
  { id: "MARICINTA", name: "Maricinta", aliases: ["maricinta"], use: "everyday pain relief", form: "500 mg tablets" },
  { id: "DELINERA", name: "Delinera", aliases: ["delinera"], use: "chlamydia treatment", form: "single dose tablets" }
];

// Approved documents. Each section has an ID, version and date,
// so every sentence in a draft can be traced back to where it came from.
const DOCUMENTS = [
  // ---------- Nazaski (period pain) ----------
  { id: "NZK-PI", product: "NAZASKI", title: "Nazaski Approved Product Information", version: "v2.1", approved: "2026-05-12", sections: [
    { sec: "1", heading: "What Nazaski is used for", keywords: "used for what is treat period pain cramps menstrual", text: "Nazaski 250 mg tablets are used to relieve period pain and cramps in women aged 16 and over." },
    { sec: "2", heading: "How to take Nazaski", keywords: "dose dosage how often tablets day times food start", text: "Take one tablet up to three times a day, with or after food. You can start taking it as soon as your period pain begins. Do not take more than three tablets in 24 hours." },
    { sec: "3", heading: "If Nazaski is not helping", keywords: "not helping not working still pain worse heavy bleeding better days", text: "If your period pain does not get better after three days, or your periods are very heavy or painful every month, please speak to your doctor or nurse, as they may want to check for other causes." },
    { sec: "4", heading: "Storage", keywords: "store storage keep temperature hot heat expiry bathroom", text: "Store Nazaski below 25°C in the original packet. Do not use it after the expiry date on the box." },
    { sec: "5", heading: "Possible side effects", keywords: "side effects common stomach upset heartburn nausea", text: "Common side effects (may affect up to 1 in 10 people) include an upset stomach, heartburn and feeling sick. Taking Nazaski with food can help reduce these." },
    { sec: "6", heading: "Taking other medicines", keywords: "other medicines together ibuprofen aspirin painkiller blood thinner alcohol drink", text: "Do not take Nazaski with other anti-inflammatory painkillers such as ibuprofen or aspirin. Tell your pharmacist if you take blood thinners. Alcohol may make stomach side effects worse." },
    { sec: "7", heading: "Ingredients", keywords: "ingredients contain lactose gluten vegan gelatin allergy allergen", text: "Each tablet contains lactose. Nazaski does not contain gluten or gelatin, and it is suitable for vegans." }
  ]},
  // ---------- Maricinta (everyday painkiller) ----------
  { id: "MRC-PI", product: "MARICINTA", title: "Maricinta Approved Product Information", version: "v4.0", approved: "2026-02-03", sections: [
    { sec: "1", heading: "What Maricinta is used for", keywords: "used for what is treat headache toothache period pain fever temperature", text: "Maricinta 500 mg tablets are used for mild to moderate pain, such as headaches, toothache and period pain, and to lower a high temperature, in adults aged 16 and over." },
    { sec: "2", heading: "How to take Maricinta", keywords: "dose dosage how often tablets day maximum hours", text: "Take one or two tablets every 4 to 6 hours if needed. Do not take more than 8 tablets in 24 hours." },
    { sec: "3", heading: "Other medicines with the same ingredient", keywords: "cold flu remedies other medicines same ingredient together", text: "Do not take Maricinta with other medicines that contain the same active ingredient, including some cold and flu remedies. Check the label or ask your pharmacist." },
    { sec: "4", heading: "Storage", keywords: "store storage keep temperature hot heat handbag", text: "Store below 25°C, in a dry place, in the original packet." },
    { sec: "5", heading: "Possible side effects", keywords: "side effects common rare", text: "Side effects are rare when Maricinta is taken at the right dose. Stop taking it and speak to a doctor if you get a rash or swelling." },
    { sec: "6", heading: "Maricinta and alcohol", keywords: "alcohol drink drinking night out", text: "Avoid drinking a lot of alcohol while taking Maricinta, as this can increase the risk of liver damage." }
  ]},
  // ---------- Delinera (chlamydia treatment) ----------
  { id: "DLN-PI", product: "DELINERA", title: "Delinera Approved Product Information", version: "v1.3", approved: "2026-07-01", sections: [
    { sec: "1", heading: "What Delinera is used for", keywords: "used for what is treat chlamydia infection sti", text: "Delinera is used to treat chlamydia infection in adults aged 16 and over, after a positive test." },
    { sec: "2", heading: "How to take Delinera", keywords: "dose dosage how take tablets once single food", text: "Delinera is one single dose. Take both tablets together, at the same time, with or without food." },
    { sec: "3", heading: "Sex after treatment", keywords: "sex wait before after days oral", text: "Do not have sex, including oral sex, for 7 days after taking Delinera, and until your partner or partners have also finished their treatment." },
    { sec: "4", heading: "Partners", keywords: "partner partners boyfriend girlfriend tested treated tell", text: "Your current partner, and anyone you have had sex with in the last 6 months, should be tested and treated too. Your clinic can help you tell them, without giving your name if you prefer." },
    { sec: "5", heading: "Possible side effects", keywords: "side effects common diarrhoea stomach nausea", text: "Common side effects (may affect up to 1 in 10 people) include feeling sick, diarrhoea and stomach pain." },
    { sec: "6", heading: "Contraception", keywords: "pill contraception contraceptive stop working", text: "Delinera is not expected to stop hormonal contraception, like the pill, from working. If you are sick within 3 hours of taking Delinera, contact your clinic, as you may need another dose and extra contraception." },
    { sec: "7", heading: "Do I need another test?", keywords: "another test retest check worked again", text: "You do not usually need another test to check the treatment worked, unless you are pregnant, you had sex in the 7 days after treatment, or you still have symptoms." }
  ]},
  // ---------- Standard replies (not about one medicine) ----------
  { id: "SRD-AE", product: "ALL", title: "Standard Reply: Reporting a side effect", version: "v1.1", approved: "2026-01-10", sections: [
    { sec: "1", heading: "How to report a side effect", keywords: "report side effect reaction yellow card", text: "Thank you for telling us about this. We have to record every possible side effect, and someone from our safety team will contact you within one working day. You can also report side effects through the Yellow Card scheme. If you feel very unwell, please contact your doctor, call NHS 111, or call 999 in an emergency." }
  ]},
  { id: "SRD-OD", product: "ALL", title: "Standard Reply: Taking too much", version: "v1.0", approved: "2026-01-10", sections: [
    { sec: "1", heading: "If someone has taken too much", keywords: "overdose too many too much extra double", text: "If you or someone else has taken more than the recommended dose, please contact your doctor or call NHS 111 straight away, even if you feel well. In an emergency, call 999 or go to A&E and take the medicine packet with you." }
  ]},
  { id: "SRD-REF", product: "ALL", title: "Standard Reply: Passed to a medical expert", version: "v1.0", approved: "2026-01-10", sections: [
    { sec: "1", heading: "Questions that need an expert", keywords: "pregnant pregnancy breastfeeding child off label expert", text: "Thank you for your question. Because it needs an expert's advice, we have passed it to one of our medical information experts, who will reply to you directly. In the meantime, please speak to your doctor, nurse or pharmacist before making any changes to your treatment." }
  ]}
];

// Test questions used WHILE building the tool, with the answer I expected.
// route: "draft" = normal draft for a person to check, "expert" = medical expert,
//        "safety" = side effect report, "urgent" = possible overdose,
//        "nosource" = no approved answer, so the tool must not write a reply.
const TEST_CASES = [
  { q: "How should I store Nazaski?", route: "draft", source: "NZK-PI §4" },
  { q: "How many Maricinta tablets can I take in a day?", route: "draft", source: "MRC-PI §2" },
  { q: "Can I take Nazaski with ibuprofen?", route: "draft", source: "NZK-PI §6" },
  { q: "How long do I need to wait before having sex after taking Delinera?", route: "draft", source: "DLN-PI §3" },
  { q: "Does my partner need to be treated too if I take Delinera?", route: "draft", source: "DLN-PI §4" },
  { q: "What are the common side effects of Delinera?", route: "draft", source: "DLN-PI §5" },
  { q: "Does Nazaski contain lactose?", route: "draft", source: "NZK-PI §7" },
  { q: "What should I do if Nazaski is not helping my period pain?", route: "draft", source: "NZK-PI §3" },
  { q: "Since taking Nazaski I have had really bad stomach pain.", route: "safety", source: "SRD-AE §1" },
  { q: "I accidentally took too many Maricinta tablets yesterday.", route: "urgent", source: "SRD-OD §1" },
  { q: "I am pregnant, can I take Nazaski for my cramps?", route: "expert", source: "SRD-REF §1" },
  { q: "Can my 13 year old daughter take Nazaski for her period pain?", route: "expert", source: "SRD-REF §1" },
  { q: "Can I use Delinera for gonorrhoea instead?", route: "expert", source: "SRD-REF §1" },
  { q: "Is Maricinta better than Nazaski for period pain?", route: "expert", source: "SRD-REF §1" },
  { q: "What is the price of Delinera?", route: "nosource", source: "" },
  { q: "Can I take this tablet with food?", route: "nosource", source: "" }
];

// A second set of questions written AFTER the tool was built, and never used to change it.
// This gives a fairer idea of how the tool would do on new questions.
const UNSEEN_CASES = [
  { q: "Is it ok to keep Maricinta in my handbag when it's really hot?", route: "draft", source: "MRC-PI §4" },
  { q: "Can I drink alcohol on a night out if I've taken Maricinta?", route: "draft", source: "MRC-PI §6" },
  { q: "My periods are really heavy and Nazaski is not making the pain better.", route: "draft", source: "NZK-PI §3" },
  { q: "I've had diarrhoea since I took Delinera, is that normal?", route: "safety", source: "SRD-AE §1" },
  { q: "Do I need another test after Delinera to check it worked?", route: "draft", source: "DLN-PI §7" },
  { q: "I'm breastfeeding, is Maricinta safe for me?", route: "expert", source: "SRD-REF §1" },
  { q: "My boyfriend and I both took Delinera, when can we have sex again?", route: "draft", source: "DLN-PI §3" },
  { q: "I took double the dose of Nazaski this morning.", route: "urgent", source: "SRD-OD §1" },
  { q: "Will Delinera stop my pill from working?", route: "draft", source: "DLN-PI §6" },
  { q: "Is Nazaski vegan?", route: "draft", source: "NZK-PI §7" },
  { q: "Can I give Maricinta to my cat?", route: "expert", source: "SRD-REF §1" },
  { q: "My period cramps are so bad, can Nazaski cause bleeding in my stomach?", route: "draft", source: "NZK-PI §5" }
];
