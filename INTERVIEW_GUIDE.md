# TalentSync — Interview Preparation Guide

> Read this twice before the interview. Speak in your own words — don't memorize.

---

## 1. The 30-Second Elevator Pitch (start with this)

> "TalentSync is a full-stack job platform I built where **only government-verified companies can hire students**. The core problem it solves is **fake job postings and biased hiring**. Students upload a resume, my AI engine parses it, extracts their skills, and ranks every job with a match percentage. Companies get an AI-scored candidate pipeline. Under the hood there's a fraud-detection layer that blocks scam postings and a bias-removal step that strips name, gender, and age before any AI scoring happens."

If they say "tell me more" — go layer by layer (Section 3).

---

## 2. Tech Stack (say it in this order)

| Layer | Tech | One-liner to say |
|---|---|---|
| Frontend | React 19 + Vite, React Router, Framer Motion | "SPA with role-based dashboards" |
| Backend | Node.js + Express 5 | "29 REST endpoints, JWT auth, role-based access control" |
| Database | MongoDB + Mongoose | "7 collections — Users, Students, Companies, Jobs, Applications..." |
| AI/ML | Built-in TF-IDF engine (Node) + Python FastAPI microservice | "Matching runs natively in Node; Python service for Gemini-based fraud detection" |
| External AI | Google Gemini 2.5 Flash, Affinda resume parser | "Both have local fallbacks — the app never breaks if an API is down" |

---

## 3. The Five Features You Must Be Able to Explain

### Feature 1: AI Resume Parsing
**What it does:** Student uploads PDF → skills, experience, education, certifications are auto-extracted.

**How it works (say this):**
> "I try the Affinda commercial parser API first. If it's unavailable, I fall back to my own parser: `pdf-parse` extracts raw text, then I match against a dictionary of **86 skill keywords**, detect education level by degree keywords, estimate experience from year ranges in the text, and infer the candidate's role — e.g. if they have TensorFlow + PyTorch, they're tagged ML Engineer."

**File:** `backend/services/affindaService.js`

### Feature 2: AI Job Matching Engine (THE core feature — know this cold)
**What it does:** Every job gets a match % computed against the student's parsed resume.

**How it works (say this):**
> "It's a weighted hybrid score:
> - **45% skill overlap** — candidate skills vs. job's required skills
> - **35% semantic similarity** — TF-IDF vectors of the resume text vs. job description, compared with cosine similarity
> - **20% experience fit** — candidate years vs. required years
>
> I wrote it in pure Node using the `natural` NLP library, so matching doesn't depend on the Python service. I also wrote a **benchmark with 5 candidate personas** — it shows **100% of expected jobs land in the top 5**, and ranking takes about **1.6 milliseconds** per candidate."

**Files:** `backend/services/matchingService.js`, `backend/benchmark/matchingBenchmark.js`

**If asked "why TF-IDF and not embeddings/BERT?":**
> "Deliberate trade-off. TF-IDF runs in ~2ms with zero API cost and no GPU, and for keyword-dense documents like resumes and job descriptions it performs very well — my benchmark proves it. The architecture is pluggable; swapping in sentence embeddings is a one-function change, and the Python service already supports Gemini embeddings."

### Feature 3: Bias Removal (great talking point — interviewers love this)
**What it does:** Before any AI scoring, the resume text is anonymized.

**How it works (say this):**
> "A regex pipeline strips **6 categories of PII**: emails, phone numbers, URLs, graduation years (which reveal age), gender pronouns and honorifics, and religion indicators. The matching engine only ever sees the anonymized text — so candidates are scored purely on skills. The student even sees a 'bias report' showing how many fields were stripped."

**File:** `backend/services/biasRemoval.js`

### Feature 4: Fraud Detection
**What it does:** When a company posts a job, the description is scanned; scam posts are blocked with reasons.

**How it works (say this):**
> "Two layers. The primary is a Gemini-based analyzer in the Python microservice. If that's down, my built-in rule engine takes over — **11 weighted scam patterns**: demands for registration fees, Telegram-only contact, 'earn $500/day' promises, requests for Aadhaar/bank details, urgency tactics. Each match adds to a risk score; above 70 the posting is **blocked with the exact reasons shown to the company**."

**File:** `backend/services/fraudDetectionService.js`
**Demo:** post a job saying "Pay Rs 2000 registration fee, contact on Telegram" → blocked with 6 reasons listed.

### Feature 5: Government Company Verification (your differentiator)
**What it does:** Companies must pass government-ID validation before they can post jobs.

**How it works (say this):**
> "At registration, companies submit a **CIN** and a **GSTIN**. I validate the CIN against the real MCA 21-character structure — listing status, NIC industry code, state code, incorporation year, ownership type. For the GSTIN, I implemented the **official GSTN check-digit algorithm** — a Luhn mod-36 checksum over the first 14 characters. Change one character and registration is rejected with the specific reason.
>
> The real GSTN registry API is only available through paid GSP providers, so live lookup is a pluggable config — the offline checksum is the same math the government portal runs.
>
> Rejected companies can **upload verification documents** (real file upload via multer), which moves them to a **pending queue** that an admin approves or rejects. Until verified, posting a job returns 403."

**Files:** `backend/services/govVerificationService.js`, `backend/controllers/companyController.js`

---

## 4. Architecture Story (if asked "walk me through the design")

> "Three services. The React SPA talks to the Express API over REST with JWT bearer tokens. Express has middleware for auth (`protect`) and role checks (`authorize('student')` etc.) — students, companies, and admins each get their own route groups. MongoDB stores everything; Applications have a compound unique index on student+job so you can't apply twice.
>
> The Python FastAPI microservice handles Gemini-based fraud detection. The key design decision: **every external dependency has a local fallback** — Affinda falls back to my parser, Gemini skill-gap falls back to local logic, the ML service falls back to my rule engine. The platform degrades gracefully instead of breaking."

**The full hiring loop (demo this if you can):**
1. Company posts job → fraud check → live
2. Student uploads resume → parsed → jobs ranked by match %
3. Student applies → application stored with a computed match score
4. Company opens Candidates → sees students with match % → shortlists one (this **counts as a real profile view** for the student)
5. Student's dashboard instantly shows "Shortlisted" + profile view count went up

---

## 5. Your Numbers (all real and measured — quote confidently)

| Metric | Value | How you measured it |
|---|---|---|
| Top-5 match relevance | **100%** (13/13, 5 personas) | `node benchmark/matchingBenchmark.js` |
| Ranking speed | **~1.6 ms** per candidate | same benchmark, 100 runs |
| API response (recommendations) | **10–55 ms** end-to-end | X-Response-Time header |
| REST endpoints | **29** | counted across route files |
| Skill keywords | **86** | parser dictionary |
| Fraud rules | **11** weighted patterns | rule engine |
| PII categories stripped | **6** | bias-removal pipeline |
| Scoring weights | **45/35/20** | matchingService.js |

> If asked about the 100%: "It's measured on my 12-job seeded corpus with 5 personas — small but real, and I wrote the benchmark myself so I can show exactly how it's computed."

---

## 6. Questions They WILL Ask — Prepared Answers

**Q: Is the data real or hardcoded?**
> "Everything on screen is computed or user-generated. The only seeded things are 6 demo companies and 12 jobs so the marketplace isn't empty on first run — and even their GSTINs pass real checksum validation. Want me to post a new job and show it ranked live?"

**Q: Why MongoDB and not SQL?**
> "The data is document-shaped — a student's parsed resume has nested arrays of skills, education, experience that vary per resume. Mongoose gives me schema validation where I need it, and the compound unique index handles the one-application-per-job constraint. For heavy relational reporting I'd consider Postgres."

**Q: How do you handle security?**
> "Passwords are bcrypt-hashed with salt, JWT with 30-day expiry, role-based middleware on every protected route, ownership checks (a company can only edit its own jobs / its own applicants), file-type and size validation on uploads, and API keys live in .env — never in code."

**Q: What was the hardest part?**
> "Making the matching engine both fast and explainable. Early versions gave one opaque number; I redesigned it to return the skill score, semantic score, and experience score separately, plus matched and missing skills — so the UI can show *why* a job is 78%. Explainability also made debugging the weights much easier."

**Q: What would you improve with more time?**
> "Three things: swap TF-IDF for sentence embeddings and A/B test against my benchmark; real-time notifications with WebSockets when application status changes; and wire up the admin dashboard UI — the backend endpoints already exist."

**Q: Why is matching in Node when you have a Python service?**
> "Originally matching lived in Python, but that made every recommendation request a network hop and a deployment dependency. I ported the TF-IDF logic to Node — same algorithm, ~2ms latency, one less point of failure. Python now only handles what genuinely needs it: Gemini-based analysis."

**Q: How does the Gemini integration work?**
> "For skill-gap analysis I send the candidate profile and job description to Gemini 2.5 Flash with a prompt that forces a strict JSON response — missing skills, matching skills, a suitability score, and tailored resume tips. I parse the JSON out, and if the call fails or no key is configured, a local comparison takes over so the feature never 404s."

---

## 7. Five-Minute Demo Script (in order)

1. **Register a company** with Reg ID `U72200KA2015PTC081234` + GST `29AAACD0451T1Z9` → auto-verified ✅. Then mention: "change one GSTIN character and it's rejected by checksum."
2. **Post a scam job** ("Pay Rs 2000 fee, Telegram only, earn $500/day...") → **blocked with reasons on screen**. Then post a real job.
3. **Register a student → upload resume PDF** → show extracted skills, detected role, bias report.
4. **AI Job Matches** → jobs ranked by %, your new job near the top. Open one → match-score breakdown → **Apply**.
5. **Back as company → Candidates** → real applicant with match % → **Shortlist** → log back in as student → dashboard shows "Shortlisted" + profile views went up.
6. (Optional, terminal): `node benchmark/matchingBenchmark.js` → 100% relevance, 1.6ms.

---

## 8. Honest Limitations (say these BEFORE they find them — it builds trust)

- "Company verification simulates the registry — the checksum math is real, but live GSTN lookup needs a paid GSP subscription, so it's a config-pluggable provider."
- "The DB runs in-memory for the demo, so data resets on restart — one env-var change points it at Atlas."
- "Admin backend APIs exist but the admin UI isn't routed yet."
- "The benchmark corpus is small (12 jobs, 5 personas) — I'd grow it with real data before claiming production accuracy."

Saying limitations unprompted is a senior-engineer signal. Use it.

---

## 9. One-Line Summary to End the Interview

> "The thing I'm most proud of is that nothing is faked — every match score, every fraud rejection, every verification verdict is computed by an algorithm I can open and explain, and I wrote a benchmark to prove the numbers I claim."
