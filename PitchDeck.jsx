import { useState } from "react";

const TEAM = [
  { role: "Lead Developer", tasks: "Agent pipeline, Core prototype" },
  { role: "Backend Developer", tasks: "GitHub, PDF upload, deployment" },
  { role: "Designer", tasks: "UI/UX, pitch deck, video demo" },
  { role: "Research & Pitch", tasks: "Problem research, presentation" },
];

const SLIDES = [
  // 1 - Title
  {
    id: "title",
    render: () => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#6366f1", textTransform: "uppercase", marginBottom: 16 }}>AI Marathon 2026 · APU AIC · LLM Everywhere</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#f1f5f9", letterSpacing: -2, lineHeight: 1.1, marginBottom: 8 }}>
          Intelligent<br /><span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Recruiter</span>
        </div>
        <div style={{ fontSize: 16, color: "#475569", maxWidth: 500, lineHeight: 1.6, marginBottom: 40 }}>
          A 4-agent AI pipeline that replaces static job boards with intelligent, bias-aware candidate matching
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["🤖 Agentic AI", "⚖️ Bias Detection", "📊 Smart Ranking"].map(tag => (
            <span key={tag} style={{ background: "#1e1b4b", border: "1px solid #4338ca", color: "#a5b4fc", borderRadius: 20, padding: "6px 16px", fontSize: 12 }}>{tag}</span>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 32, display: "flex", gap: 8, alignItems: "center" }}>
          {TEAM.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${i*80+200},50%,25%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {t.role[0]}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#334155", marginLeft: 4 }}>Team of 4</div>
        </div>
      </div>
    ),
  },

  // 2 - Problem
  {
    id: "problem",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#f87171", textTransform: "uppercase", marginBottom: 8 }}>The Problem</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 32 }}>Hiring is broken.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { stat: "75%", desc: "of qualified candidates are rejected by keyword-matching ATS systems before a human reads their resume" },
            { stat: "23hrs", desc: "average time a recruiter spends manually screening candidates per open role" },
            { stat: "39%", desc: "of hiring decisions show unconscious bias based on name, gender, or university prestige" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#f87171", marginBottom: 8 }}>{s.stat}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1c0a0a", border: "1px solid #dc262630", borderRadius: 10, padding: 16, fontSize: 14, color: "#fca5a5", lineHeight: 1.6 }}>
          💡 Traditional job boards are <strong style={{ color: "#f87171" }}>static</strong> — they match keywords, not potential. They miss great candidates and surface biased results.
        </div>
      </div>
    ),
  },

  // 3 - Solution
  {
    id: "solution",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>Our Solution</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 8 }}>Meet the Intelligent Recruiter</div>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 28 }}>An agentic AI system that thinks like a senior recruiter — at scale, without bias.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { icon: "📋", title: "Understands Context", desc: "Parses any job description into structured requirements — not just keywords" },
            { icon: "🔍", title: "Evaluates Holistically", desc: "Scores candidates across experience, skills, domain fit — not just resume keywords" },
            { icon: "⚖️", title: "Checks for Bias", desc: "Unique bias detection agent flags unfair evaluations before final ranking" },
            { icon: "🏆", title: "Ranks with Reasoning", desc: "Produces ranked results with explanations a hiring manager can actually use" },
          ].map((f, i) => (
            <div key={i} style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 18, display: "flex", gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 4 - Agent Architecture
  {
    id: "architecture",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>Agent Framework Diagram</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 24 }}>4-Agent Pipeline Architecture</div>
        {/* Pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { agent: "JD Parser Agent", input: "Raw Job Description", output: "Structured Requirements (skills, years, domain)", color: "#6366f1", icon: "📋" },
            { agent: "Candidate Analyzer Agent", input: "Profiles + Requirements", output: "Scored analyses per candidate (4 dimensions)", color: "#0ea5e9", icon: "🔍" },
            { agent: "Bias Checker Agent", input: "Scores + Profiles", output: "Fairness flags, bias type, severity", color: "#f59e0b", icon: "⚖️" },
            { agent: "Ranking Agent", input: "All outputs above", output: "Final ranked list + hiring manager report", color: "#10b981", icon: "🏆" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: i < 3 ? 0 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                <div style={{ width: 2, background: i === 0 ? "transparent" : "#1e293b", flex: 1, minHeight: 8 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                <div style={{ width: 2, background: i === 3 ? "transparent" : "#1e293b", flex: 1, minHeight: 8 }} />
              </div>
              <div style={{ flex: 1, padding: "8px 0 8px 14px" }}>
                <div style={{ background: "#0a0a14", border: `1px solid ${row.color}40`, borderLeft: `3px solid ${row.color}`, borderRadius: "0 10px 10px 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>{row.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: row.color, marginBottom: 2 }}>{row.agent}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>IN: {row.input}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#334155", maxWidth: 200, textAlign: "right" }}>OUT: {row.output}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 16px", fontSize: 11, color: "#64748b" }}>
          🔗 Each agent is a <span style={{ color: "#a5b4fc" }}>specialized Claude LLM call</span> with a single responsibility — enabling explainable, auditable reasoning at every step.
        </div>
      </div>
    ),
  },

  // 5 - How It Works
  {
    id: "how",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>How It Works</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 24 }}>From JD to Hire — in 4 steps</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { step: "01", title: "Paste Job Description", desc: "Any raw JD — the parser extracts must-have skills, nice-to-haves, experience level, and domain context automatically.", color: "#6366f1" },
            { step: "02", title: "Add Candidate Profiles", desc: "Paste resume text or profile summaries for each candidate. No structured format needed — the agent handles it.", color: "#0ea5e9" },
            { step: "03", title: "Pipeline Runs Automatically", desc: "Watch 4 agents work in sequence — each one builds on the previous output. Full reasoning chain is visible.", color: "#f59e0b" },
            { step: "04", title: "Get Actionable Results", desc: "Ranked candidates with score breakdowns, strengths, gaps, bias flags, and a hiring recommendation paragraph.", color: "#10b981" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 18, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, fontSize: 60, fontWeight: 900, color: `${s.color}08`, lineHeight: 1 }}>{s.step}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>STEP {s.step}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 6 - Bias Checker (Unique Feature)
  {
    id: "bias",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", textTransform: "uppercase", marginBottom: 8 }}>Unique Feature</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 8 }}>The Bias Checker Agent</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>No other recruitment tool actively audits its own AI recommendations for bias.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#0a0a14", border: "1px solid #f59e0b30", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>What it detects:</div>
            {["Gender bias in skill weighting", "Name-based cultural assumptions", "University prestige bias", "Age indicator bias", "Domain overweighting"].map((item, i) => (
              <div key={i} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5, paddingLeft: 10, borderLeft: "2px solid #d97706" }}>⚠ {item}</div>
            ))}
          </div>
          <div style={{ background: "#0a0a14", border: "1px solid #4ade8030", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>What it outputs:</div>
            {[
              { label: "Fairness Score", val: "0–100" },
              { label: "Risk Level", val: "LOW / MEDIUM / HIGH" },
              { label: "Per-candidate flags", val: "with severity" },
              { label: "Recommendations", val: "actionable fixes" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 8, paddingBottom: 8, borderBottom: i < 3 ? "1px solid #1e293b" : "none" }}>
                <span>{item.label}</span>
                <span style={{ color: "#4ade80" }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#1c1408", border: "1px solid #d9770630", borderRadius: 10, padding: 14, fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
          🏆 <strong>Why this matters for judges:</strong> This directly addresses CATEGORY B — Originality of Idea (20pts). Ethical AI hiring is a real, unsolved industry problem worth billions.
        </div>
      </div>
    ),
  },

  // 7 - Live Demo
  {
    id: "demo",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>Live Demo</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 24 }}>See It In Action</div>
        <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          {/* Mock UI screenshot */}
          <div style={{ background: "#0d0d1f", borderBottom: "1px solid #0f172a", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
            <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, padding: "3px 10px", fontSize: 9, color: "#475569", marginLeft: 8 }}>intelligent-recruiter.vercel.app</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {["📋 JD Parser ✅", "🔍 Analyzer ✅", "⚖️ Bias Check ✅", "🏆 Ranking ✅"].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "#052e16", border: "1px solid #16a34a", borderRadius: 6, padding: "6px 10px", fontSize: 9, color: "#4ade80", textAlign: "center" }}>{s}</div>
              ))}
            </div>
            {[
              { name: "Alice Tan", score: 87, verdict: "STRONG YES", color: "#4ade80" },
              { name: "David Chen", score: 74, verdict: "YES", color: "#60a5fa" },
              { name: "Bob Lim", score: 61, verdict: "MAYBE", color: "#fbbf24" },
              { name: "Carla Ng", score: 55, verdict: "MAYBE", color: "#fbbf24" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid #1e293b" : "none" }}>
                <div style={{ fontSize: 11, color: "#475569", width: 16 }}>#{i + 1}</div>
                <div style={{ flex: 1, fontSize: 12, color: "#f1f5f9" }}>{c.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.score}</div>
                <div style={{ fontSize: 9, color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}40`, borderRadius: 4, padding: "2px 8px" }}>{c.verdict}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>
          Full working demo available at: <span style={{ color: "#6366f1" }}>github.com/your-team/intelligent-recruiter</span>
        </div>
      </div>
    ),
  },

  // 8 - Business Impact
  {
    id: "impact",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#10b981", textTransform: "uppercase", marginBottom: 8 }}>Impact & Scalability</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 24 }}>Real Impact, Ready to Scale</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          {[
            { icon: "⚡", title: "10x Faster", desc: "Screens 100 candidates in minutes vs. hours of manual review" },
            { icon: "🎯", title: "Better Matches", desc: "Context-aware scoring vs keyword matching — finds hidden gems" },
            { icon: "⚖️", title: "Fairer Hiring", desc: "Active bias detection builds diverse, equitable teams" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Future Roadmap</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["PDF Resume Upload", "ATS Integration", "Interview Question Generator", "Candidate Feedback Reports", "HR Dashboard", "API for job platforms"].map((item, i) => (
              <span key={i} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 20, padding: "4px 12px", fontSize: 10 }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 9 - Tech Stack
  {
    id: "tech",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>Technical Implementation</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 24 }}>Built with Modern AI Stack</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Tech Stack</div>
            {[
              { layer: "AI Engine", tech: "Claude claude-sonnet-4-20250514 (Anthropic)", color: "#6366f1" },
              { layer: "Orchestration", tech: "Custom multi-agent pipeline (4 LLM calls)", color: "#0ea5e9" },
              { layer: "Frontend", tech: "React + custom design system", color: "#10b981" },
              { layer: "Deployment", tech: "Vercel / GitHub Pages", color: "#f59e0b" },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 3, background: t.color, borderRadius: 2, alignSelf: "stretch", flexShrink: 0, minHeight: 36 }} />
                <div>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>{t.layer}</div>
                  <div style={{ fontSize: 12, color: "#f1f5f9" }}>{t.tech}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Why This Stack</div>
            {[
              "No backend server needed — runs entirely client-side",
              "Claude API handles all NLP — no ML training required",
              "Each agent is independently testable and replaceable",
              "Scales to any number of candidates without code changes",
              "Open source — easy to deploy and contribute",
            ].map((point, i) => (
              <div key={i} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #4338ca", lineHeight: 1.5 }}>
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 10 - Team
  {
    id: "team",
    render: () => (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>The Team</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: -1, marginBottom: 32 }}>Built by 4, Powered by AI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {TEAM.map((t, i) => (
            <div key={i} style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, hsl(${i*80+200},60%,25%), hsl(${i*80+240},60%,20%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px", border: "2px solid #1e293b" }}>
                {["💻", "⚙️", "🎨", "📢"][i]}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{t.role}</div>
              <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>{t.tasks}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #0f0a1e)", border: "1px solid #4338ca", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, color: "#a5b4fc", fontWeight: 700, marginBottom: 6 }}>AI Marathon 2026 · APU AIC</div>
          <div style={{ fontSize: 12, color: "#475569" }}>Submission Deadline: 26th May 2026 · Track: The Intelligent Recruiter</div>
        </div>
      </div>
    ),
  },
];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(total - 1, c + 1));

  const SLIDE_LABELS = ["Title", "Problem", "Solution", "Architecture", "How It Works", "Bias Checker", "Live Demo", "Impact", "Tech Stack", "Team"];

  return (
    <div style={{
      minHeight: "100vh", background: "#07070f",
      fontFamily: "'IBM Plex Mono','Courier New',monospace",
      color: "#cbd5e1", display: "flex", flexDirection: "column",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Top nav */}
      <div style={{ background: "#0d0d1f", borderBottom: "1px solid #0f172a", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤝</div>
          <span style={{ fontSize: 12, color: "#475569" }}>Intelligent Recruiter — Pitch Deck</span>
        </div>
        <div style={{ fontSize: 11, color: "#334155" }}>{current + 1} / {total}</div>
      </div>

      {/* Slide dots */}
      <div style={{ background: "#0a0a14", borderBottom: "1px solid #0f172a", padding: "8px 24px", display: "flex", gap: 6, alignItems: "center", overflowX: "auto" }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0,
          }}>
            <div style={{ width: i === current ? 24 : 8, height: 4, borderRadius: 2, background: i === current ? "#6366f1" : "#1e293b", transition: "all 0.3s" }} />
            <span style={{ fontSize: 8, color: i === current ? "#a5b4fc" : "#334155", letterSpacing: 0.5 }}>{SLIDE_LABELS[i]}</span>
          </button>
        ))}
      </div>

      {/* Slide area */}
      <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
        <div key={current} style={{ flex: 1, padding: "32px 48px", position: "relative", animation: "fadeSlide 0.3s ease", minHeight: 480 }}>
          {SLIDES[current].render()}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: "#0a0a14", borderTop: "1px solid #0f172a", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={prev} disabled={current === 0} style={{
          background: current === 0 ? "none" : "#1e293b", border: "1px solid #1e293b",
          borderRadius: 8, padding: "8px 20px", color: current === 0 ? "#1e293b" : "#94a3b8",
          cursor: current === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
        }}>← PREV</button>

        <div style={{ display: "flex", gap: 4 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: 6, height: 6, borderRadius: "50%", cursor: "pointer",
              background: i === current ? "#6366f1" : "#1e293b", transition: "background 0.2s",
            }} />
          ))}
        </div>

        <button onClick={next} disabled={current === total - 1} style={{
          background: current === total - 1 ? "none" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
          border: "none", borderRadius: 8, padding: "8px 20px",
          color: current === total - 1 ? "#1e293b" : "#fff",
          cursor: current === total - 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 1, fontWeight: 700,
        }}>NEXT →</button>
      </div>
    </div>
  );
}
