import { useState, useEffect, useRef } from "react";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const STEP_PROMPTS = {
  jdParser: (jd) => ({
    system: `You are a Job Description Parser Agent. Extract structured requirements from a job description.
Respond ONLY with valid JSON, no markdown, no preamble:
{
  "title": "Job title",
  "mustHave": ["skill1","skill2"],
  "niceToHave": ["skill1","skill2"],
  "experienceYears": 3,
  "domain": "e.g. fintech, healthcare",
  "keyResponsibilities": ["resp1","resp2","resp3"]
}`,
    user: `Parse this job description:\n${jd}`,
  }),

  candidateAnalyzer: (requirements, candidates) => ({
    system: `You are a Candidate Analyzer Agent. Score each candidate against structured job requirements.
Respond ONLY with valid JSON:
{
  "analyses": [
    {
      "name": "string",
      "mustHaveMatch": 85,
      "niceToHaveMatch": 60,
      "experienceScore": 80,
      "domainRelevance": 70,
      "overallScore": 78,
      "matchedSkills": ["skill1","skill2"],
      "missingSkills": ["skill1"],
      "standout": "One thing that makes this candidate unique"
    }
  ]
}`,
    user: `Requirements: ${JSON.stringify(requirements)}\n\nCandidates:\n${candidates.map((c, i) => `${i + 1}. ${c.name}: ${c.bio}`).join("\n\n")}`,
  }),

  biasChecker: (candidates, analyses) => ({
    system: `You are a Hiring Bias Detection Agent. Analyze candidate evaluations for potential bias.
Check for: gender bias, name-based bias, cultural/origin bias, age indicators, school prestige bias.
Respond ONLY with valid JSON:
{
  "overallBiasRisk": "LOW|MEDIUM|HIGH",
  "flags": [
    {
      "candidate": "Name",
      "type": "bias type",
      "description": "what was flagged",
      "severity": "LOW|MEDIUM|HIGH"
    }
  ],
  "recommendations": ["rec1","rec2"],
  "fairnessScore": 85
}`,
    user: `Candidate profiles: ${JSON.stringify(candidates)}\nAnalyses: ${JSON.stringify(analyses)}`,
  }),

  ranker: (requirements, analyses, biasReport) => ({
    system: `You are the Final Ranking Agent. Produce the definitive hiring recommendation.
Respond ONLY with valid JSON:
{
  "rankings": [
    {
      "rank": 1,
      "name": "string",
      "finalScore": 87,
      "verdict": "STRONG YES|YES|MAYBE|NO",
      "topStrengths": ["s1","s2","s3"],
      "topGaps": ["g1","g2"],
      "hiringPitch": "One compelling sentence why to hire this person",
      "biasAdjusted": false
    }
  ],
  "topPick": "Name",
  "poolInsight": "Key insight about the overall candidate pool",
  "recommendation": "Final recommendation paragraph for the hiring manager"
}`,
    user: `Job requirements: ${JSON.stringify(requirements)}\nAnalyses: ${JSON.stringify(analyses)}\nBias report: ${JSON.stringify(biasReport)}`,
  }),
};

// ─── API HELPER ───────────────────────────────────────────────────────────────

async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const VERDICT_STYLE = {
  "STRONG YES": { bg: "#052e16", border: "#16a34a", text: "#4ade80" },
  YES: { bg: "#0c1a2e", border: "#3b82f6", text: "#60a5fa" },
  MAYBE: { bg: "#1c1408", border: "#d97706", text: "#fbbf24" },
  NO: { bg: "#1c0a0a", border: "#dc2626", text: "#f87171" },
};

const STEPS = [
  { id: "jd", label: "JD Parser", icon: "📋", desc: "Extracting requirements" },
  { id: "analyze", label: "Candidate Analyzer", icon: "🔍", desc: "Scoring candidates" },
  { id: "bias", label: "Bias Checker", icon: "⚖️", desc: "Fairness audit" },
  { id: "rank", label: "Ranking Agent", icon: "🏆", desc: "Final recommendations" },
];

const SAMPLE_JD = `Senior Full-Stack Developer — FinTech Startup

We're hiring a senior engineer (5+ years) to build our core payment infrastructure.

Requirements:
• Python (FastAPI/Django) and React/TypeScript — mandatory
• REST APIs and microservices architecture
• AWS cloud infrastructure
• PostgreSQL and database design
• Bonus: ML/AI experience, fintech or payments domain`;

const SAMPLE_CANDIDATES = [
  { name: "Alice Tan", bio: "5 years Python (FastAPI), React, TypeScript. Built 3 SaaS products from scratch. AWS certified solutions architect. PostgreSQL expert. Led payment integration at e-commerce startup processing RM2M/month." },
  { name: "Bob Lim", bio: "8 years Java Spring + Angular. Very strong backend architecture. Recently learning React (6 months). Deep on-prem experience, minimal AWS. Worked at Maybank for 4 years in payments." },
  { name: "Carla Ng", bio: "3 years Python Flask, React. Currently completing ML specialization on Coursera. GCP user, no AWS experience. Postgres proficient. Built a P2P lending app as a side project — 200 active users." },
  { name: "David Chen", bio: "6 years full-stack. Node.js + Vue primarily, knows Python basics. AWS certified. Strong system design skills. No fintech experience but built high-traffic e-commerce (1M daily users). Open to learning FastAPI." },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function PipelineStep({ step, status, index }) {
  const colors = {
    idle: { border: "#1e293b", bg: "#0a0a14", icon: "#334155", label: "#475569" },
    active: { border: "#6366f1", bg: "#0f0f20", icon: "#818cf8", label: "#a5b4fc" },
    done: { border: "#16a34a", bg: "#052e16", icon: "#4ade80", label: "#86efac" },
    error: { border: "#dc2626", bg: "#1c0a0a", icon: "#f87171", label: "#fca5a5" },
  };
  const c = colors[status] || colors.idle;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 10,
      border: `1px solid ${c.border}`, background: c.bg,
      transition: "all 0.4s ease", flex: 1,
      position: "relative", overflow: "hidden",
    }}>
      {status === "active" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, #6366f115, transparent)",
          animation: "shimmer 1.5s infinite",
        }} />
      )}
      <div style={{ fontSize: 18, position: "relative" }}>{status === "done" ? "✅" : status === "active" ? "⏳" : step.icon}</div>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.label, letterSpacing: 0.5 }}>{step.label}</div>
        <div style={{ fontSize: 10, color: "#334155" }}>{status === "active" ? step.desc + "..." : status === "done" ? "Complete" : "Waiting"}</div>
      </div>
    </div>
  );
}

function ScoreBar({ value, color = "#6366f1" }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function IntelligentRecruiter() {
  const [jd, setJd] = useState(SAMPLE_JD);
  const [candidates, setCandidates] = useState(SAMPLE_CANDIDATES);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [view, setView] = useState("input"); // input | running | results
  const [stepStatus, setStepStatus] = useState({ jd: "idle", analyze: "idle", bias: "idle", rank: "idle" });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeResult, setActiveResult] = useState(0);

  const setStep = (id, status) => setStepStatus(s => ({ ...s, [id]: status }));

  const runPipeline = async () => {
    setView("running");
    setError(null);
    setResults(null);
    setStepStatus({ jd: "idle", analyze: "idle", bias: "idle", rank: "idle" });

    try {
      // Step 1
      setStep("jd", "active");
      const p1 = STEP_PROMPTS.jdParser(jd);
      const requirements = await callClaude(p1.system, p1.user);
      setStep("jd", "done");

      // Step 2
      setStep("analyze", "active");
      const p2 = STEP_PROMPTS.candidateAnalyzer(requirements, candidates);
      const { analyses } = await callClaude(p2.system, p2.user);
      setStep("analyze", "done");

      // Step 3
      setStep("bias", "active");
      const p3 = STEP_PROMPTS.biasChecker(candidates, analyses);
      const biasReport = await callClaude(p3.system, p3.user);
      setStep("bias", "done");

      // Step 4
      setStep("rank", "active");
      const p4 = STEP_PROMPTS.ranker(requirements, analyses, biasReport);
      const ranking = await callClaude(p4.system, p4.user);
      setStep("rank", "done");

      setResults({ requirements, analyses, biasReport, ranking });
      setTimeout(() => setView("results"), 600);
    } catch (e) {
      setError("Pipeline failed: " + e.message);
      setStepStatus(s => {
        const updated = { ...s };
        Object.keys(updated).forEach(k => { if (updated[k] === "active") updated[k] = "error"; });
        return updated;
      });
    }
  };

  const reset = () => {
    setView("input");
    setResults(null);
    setError(null);
    setStepStatus({ jd: "idle", analyze: "idle", bias: "idle", rank: "idle" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#07070f",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#cbd5e1",
    }}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        textarea, input { transition: border-color 0.2s; }
        textarea:focus, input:focus { border-color: #6366f1 !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(180deg, #0d0d1f 0%, #07070f 100%)",
        borderBottom: "1px solid #0f172a", padding: "20px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            boxShadow: "0 0 20px #6366f140",
          }}>🤝</div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 2 }}>AI Marathon 2026 · APU AIC</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Intelligent Recruiter</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["input", "pipeline", "results"].map(v => (
            <button key={v} onClick={() => { if (v === "input" || (v === "results" && results)) setView(v); }}
              style={{
                background: view === v ? "#1e1b4b" : "none",
                border: `1px solid ${view === v ? "#4338ca" : "#1e293b"}`,
                color: view === v ? "#a5b4fc" : "#475569",
                borderRadius: 6, padding: "5px 14px", fontSize: 10,
                cursor: "pointer", fontFamily: "inherit",
                letterSpacing: 1, textTransform: "uppercase",
              }}>
              {v === "pipeline" ? "⚙ Pipeline" : v === "input" ? "📝 Input" : `📊 Results`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── INPUT VIEW ── */}
        {view === "input" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* JD */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6366f1", marginBottom: 8, textTransform: "uppercase" }}>
                  📋 Job Description
                </div>
                <textarea value={jd} onChange={e => setJd(e.target.value)} rows={14}
                  style={{
                    width: "100%", background: "#0a0a14", border: "1px solid #1e293b",
                    borderRadius: 8, padding: "12px 14px", color: "#e2e8f0",
                    fontSize: 12, fontFamily: "inherit", resize: "none", lineHeight: 1.7,
                  }} />
              </div>

              {/* Candidates */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6366f1", marginBottom: 8, textTransform: "uppercase" }}>
                  👥 Candidates ({candidates.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", marginBottom: 10 }}>
                  {candidates.map((c, i) => (
                    <div key={i} style={{
                      background: "#0a0a14", border: "1px solid #1e293b",
                      borderRadius: 8, padding: "10px 12px",
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: `hsl(${i * 80 + 200},50%,20%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff", fontWeight: 700,
                      }}>{c.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{c.bio.slice(0, 90)}...</div>
                      </div>
                      <button onClick={() => setCandidates(candidates.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
                {/* Add candidate */}
                <div style={{ background: "#0a0a0a", border: "1px dashed #1e293b", borderRadius: 8, padding: 12 }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Candidate name"
                    style={{
                      width: "100%", marginBottom: 6, background: "#0f1117",
                      border: "1px solid #1e293b", borderRadius: 6, padding: "7px 10px",
                      color: "#e2e8f0", fontSize: 11, fontFamily: "inherit",
                    }} />
                  <textarea value={newBio} onChange={e => setNewBio(e.target.value)}
                    placeholder="Paste resume or profile summary..." rows={2}
                    style={{
                      width: "100%", marginBottom: 6, background: "#0f1117",
                      border: "1px solid #1e293b", borderRadius: 6, padding: "7px 10px",
                      color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", resize: "none",
                    }} />
                  <button onClick={() => { if (newName && newBio) { setCandidates([...candidates, { name: newName, bio: newBio }]); setNewName(""); setNewBio(""); } }}
                    style={{
                      background: "#1e293b", border: "1px solid #334155", borderRadius: 5,
                      padding: "5px 14px", color: "#94a3b8", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 10, letterSpacing: 1, textTransform: "uppercase",
                    }}>+ Add</button>
                </div>
              </div>
            </div>

            <button onClick={runPipeline} disabled={!jd.trim() || candidates.length === 0}
              style={{
                width: "100%", padding: "16px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase",
                boxShadow: "0 0 30px #6366f130",
              }}>
              ▶ Launch 4-Step Agent Pipeline
            </button>
          </div>
        )}

        {/* ── RUNNING / PIPELINE VIEW ── */}
        {(view === "running" || (view === "pipeline")) && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                {view === "running" ? "Agent Pipeline Running..." : "Agent Architecture"}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                {view === "running" ? "4 specialized agents analyzing your candidates" : "How the Intelligent Recruiter works"}
              </div>
            </div>

            {/* Pipeline steps */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {STEPS.map((step, i) => (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160 }}>
                  <PipelineStep step={step} status={stepStatus[step.id]} index={i} />
                  {i < STEPS.length - 1 && (
                    <div style={{ color: "#1e293b", fontSize: 18, flexShrink: 0 }}>→</div>
                  )}
                </div>
              ))}
            </div>

            {/* Architecture diagram */}
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Agent Flow Diagram</div>
              {[
                { from: "Job Description", to: "JD Parser Agent", out: "Structured Requirements (skills, years, domain)", color: "#6366f1" },
                { from: "Candidate Profiles", to: "Candidate Analyzer Agent", out: "Per-candidate scores (must-have, experience, domain)", color: "#0ea5e9" },
                { from: "Scores + Profiles", to: "Bias Checker Agent", out: "Fairness flags + adjusted scores", color: "#f59e0b" },
                { from: "All Data", to: "Ranking Agent", out: "Final ranked list + hiring recommendations", color: "#10b981" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                  <div style={{ fontSize: 11, color: "#475569", width: 140, textAlign: "right", flexShrink: 0 }}>{row.from}</div>
                  <div style={{ color: "#1e293b" }}>→</div>
                  <div style={{
                    background: `${row.color}15`, border: `1px solid ${row.color}40`,
                    borderRadius: 6, padding: "6px 12px", fontSize: 11, color: row.color,
                    fontWeight: 700, flexShrink: 0,
                  }}>{row.to}</div>
                  <div style={{ color: "#1e293b" }}>→</div>
                  <div style={{ fontSize: 11, color: "#475569", flex: 1 }}>{row.out}</div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginTop: 16, background: "#1c0a0a", border: "1px solid #dc2626", borderRadius: 8, padding: 14, color: "#f87171", fontSize: 12 }}>
                ⚠ {error}
                <button onClick={reset} style={{ marginLeft: 12, background: "none", border: "1px solid #dc2626", borderRadius: 4, padding: "3px 10px", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>Retry</button>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS VIEW ── */}
        {view === "results" && results && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Top bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Top Pick", value: results.ranking.topPick, icon: "🏆", color: "#fbbf24" },
                { label: "Fairness Score", value: `${results.biasReport.fairnessScore}/100`, icon: "⚖️", color: results.biasReport.fairnessScore > 80 ? "#4ade80" : "#fbbf24" },
                { label: "Bias Risk", value: results.biasReport.overallBiasRisk, icon: "🔍", color: results.biasReport.overallBiasRisk === "LOW" ? "#4ade80" : results.biasReport.overallBiasRisk === "MEDIUM" ? "#fbbf24" : "#f87171" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{stat.icon} {stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Requirements parsed */}
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>📋 Parsed Requirements — {results.requirements.title}</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>MUST HAVE</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {results.requirements.mustHave?.map((s, i) => (
                      <span key={i} style={{ background: "#052e16", border: "1px solid #16a34a", color: "#4ade80", borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>NICE TO HAVE</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {results.requirements.niceToHave?.map((s, i) => (
                      <span key={i} style={{ background: "#0c1a2e", border: "1px solid #3b82f6", color: "#60a5fa", borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rankings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {results.ranking.rankings?.map((r, i) => {
                const vs = VERDICT_STYLE[r.verdict] || VERDICT_STYLE["MAYBE"];
                const analysis = results.analyses?.find(a => a.name === r.name);
                const isOpen = activeResult === i;
                return (
                  <div key={i} onClick={() => setActiveResult(isOpen ? -1 : i)} style={{
                    background: r.rank === 1 ? "#0d0b1e" : "#0a0a14",
                    border: `1px solid ${r.rank === 1 ? "#4338ca" : "#1e293b"}`,
                    borderRadius: 12, cursor: "pointer", overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}>
                    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: "#1e293b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, color: "#64748b", fontWeight: 700, flexShrink: 0,
                      }}>#{r.rank}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{r.hiringPitch}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: r.finalScore >= 75 ? "#4ade80" : r.finalScore >= 50 ? "#fbbf24" : "#f87171" }}>
                          {r.finalScore}
                        </div>
                        <div style={{ background: vs.bg, border: `1px solid ${vs.border}`, color: vs.text, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
                          {r.verdict}
                        </div>
                        <div style={{ color: "#334155", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: "1px solid #1e293b", padding: "14px 18px", animation: "fadeUp 0.2s ease" }}>
                        {/* Score breakdown */}
                        {analysis && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>SCORE BREAKDOWN</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {[
                                ["Must-Have Match", analysis.mustHaveMatch, "#4ade80"],
                                ["Nice-to-Have", analysis.niceToHaveMatch, "#60a5fa"],
                                ["Experience", analysis.experienceScore, "#a78bfa"],
                                ["Domain Relevance", analysis.domainRelevance, "#fbbf24"],
                              ].map(([label, val, color]) => (
                                <div key={label}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: "#64748b" }}>{label}</span>
                                    <span style={{ fontSize: 10, color }}>{val}%</span>
                                  </div>
                                  <ScoreBar value={val} color={color} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 1, marginBottom: 6 }}>✓ STRENGTHS</div>
                            {r.topStrengths?.map((s, j) => (
                              <div key={j} style={{ fontSize: 11, color: "#86efac", paddingLeft: 8, borderLeft: "2px solid #16a34a", marginBottom: 4 }}>{s}</div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 1, marginBottom: 6 }}>✗ GAPS</div>
                            {r.topGaps?.map((g, j) => (
                              <div key={j} style={{ fontSize: 11, color: "#fca5a5", paddingLeft: 8, borderLeft: "2px solid #dc2626", marginBottom: 4 }}>{g}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bias report */}
            {results.biasReport.flags?.length > 0 && (
              <div style={{ background: "#0a0a14", border: "1px solid #d9770620", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#d97706", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>⚖️ Bias Flags Detected</div>
                {results.biasReport.flags.map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, paddingLeft: 10, borderLeft: "2px solid #d97706" }}>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>{f.candidate}</span> — {f.type}: {f.description}
                  </div>
                ))}
              </div>
            )}

            {/* Hiring manager recommendation */}
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>💼 Recommendation for Hiring Manager</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{results.ranking.recommendation}</div>
            </div>

            <button onClick={reset} style={{
              width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #1e293b",
              background: "none", color: "#475569", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
            }}>← New Analysis</button>
          </div>
        )}
      </div>
    </div>
  );
}
