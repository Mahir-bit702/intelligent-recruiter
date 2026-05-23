import { useState, useRef, useCallback } from "react";

// ─── SUPPORTED FORMATS ────────────────────────────────────────
const SUPPORTED_ACCEPT = ".pdf,.txt,.docx,.doc,.rtf,.md,.csv,.json";

function getFileType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf"))              return "pdf";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "docx";
  if (name.endsWith(".rtf"))              return "rtf";
  if (name.endsWith(".md"))               return "md";
  if (name.endsWith(".csv"))              return "csv";
  if (name.endsWith(".json"))             return "json";
  return "txt";
}

const FILE_ICON = { pdf:"📄", docx:"📝", doc:"📝", rtf:"📋", md:"📑", csv:"📊", json:"🗂️", txt:"📃" };
const FILE_COLOR = { pdf:"#f87171", docx:"#60a5fa", doc:"#60a5fa", rtf:"#a78bfa", md:"#34d399", csv:"#fbbf24", json:"#fb923c", txt:"#94a3b8" };

// ─── PDF.js ───────────────────────────────────────────────────
const loadPdfJs = () => new Promise((resolve) => {
  if (window.pdfjsLib) return resolve(window.pdfjsLib);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(window.pdfjsLib); };
  document.head.appendChild(s);
});

// ─── Mammoth (DOCX) ───────────────────────────────────────────
const loadMammoth = () => new Promise((resolve) => {
  if (window.mammoth) return resolve(window.mammoth);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
  s.onload = () => resolve(window.mammoth);
  document.head.appendChild(s);
});

// ─── EXTRACTORS ───────────────────────────────────────────────
async function extractText(file) {
  const type = getFileType(file);

  if (type === "pdf") {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  }

  if (type === "docx") {
    const mammoth = await loadMammoth();
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }

  if (type === "rtf") {
    const raw = await file.text();
    return raw.replace(/\{[^{}]*\}/g,"").replace(/\\[a-z]+\d* ?/gi,"").replace(/[{}\\]/g,"").replace(/\s+/g," ").trim();
  }

  if (type === "csv") {
    const raw = await file.text();
    const lines = raw.split("\n").filter(Boolean);
    const headers = lines[0]?.split(",").map(h => h.trim().replace(/"/g,"")) || [];
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g,""));
      return headers.map((h,i) => `${h}: ${vals[i]||""}`).join(" | ");
    }).join("\n");
  }

  if (type === "json") {
    const raw = await file.text();
    try {
      const obj = JSON.parse(raw);
      const flatten = (o, p="") => Object.entries(o).map(([k,v]) =>
        typeof v === "object" && v !== null ? flatten(v, p?`${p}.${k}`:k) : `${p?p+".":""}${k}: ${v}`
      ).flat();
      return flatten(obj).join("\n");
    } catch { return raw; }
  }

  // txt, md, and everything else
  return file.text();
}

// ─── PROMPTS ──────────────────────────────────────────────────
const STEP_PROMPTS = {
  jdParser: (jd) => ({
    system: `You are a Job Description Parser Agent. Extract structured requirements from a job description.
Respond ONLY with valid JSON, no markdown, no extra text:
{"title":"Job title","mustHave":["skill1"],"niceToHave":["skill1"],"experienceYears":3,"domain":"fintech","keyResponsibilities":["resp1"]}`,
    user: `Parse this job description:\n${jd}`,
  }),
  candidateAnalyzer: (requirements, candidates) => ({
    system: `You are a Candidate Analyzer Agent. Score each candidate against structured job requirements.
Respond ONLY with valid JSON:
{"analyses":[{"name":"string","mustHaveMatch":85,"niceToHaveMatch":60,"experienceScore":80,"domainRelevance":70,"overallScore":78,"matchedSkills":["skill1"],"missingSkills":["skill1"],"standout":"unique thing"}]}`,
    user: `Requirements: ${JSON.stringify(requirements)}\n\nCandidates:\n${candidates.map((c,i)=>`${i+1}. ${c.name}:\n${c.bio.slice(0,2000)}`).join("\n\n---\n\n")}`,
  }),
  biasChecker: (candidates, analyses) => ({
    system: `You are a Hiring Bias Detection Agent. Analyze candidate evaluations for potential bias.
Check for: gender bias, name-based bias, cultural/origin bias, age indicators, school prestige bias.
Respond ONLY with valid JSON:
{"overallBiasRisk":"LOW","flags":[{"candidate":"Name","type":"bias type","description":"what was flagged","severity":"LOW"}],"recommendations":["rec1"],"fairnessScore":85}`,
    user: `Profiles: ${JSON.stringify(candidates.map(c=>({name:c.name,bio:c.bio.slice(0,500)})))}\nAnalyses: ${JSON.stringify(analyses)}`,
  }),
  ranker: (requirements, analyses, biasReport) => ({
    system: `You are the Final Ranking Agent. Produce the definitive hiring recommendation.
Respond ONLY with valid JSON:
{"rankings":[{"rank":1,"name":"string","finalScore":87,"verdict":"STRONG YES","topStrengths":["s1","s2","s3"],"topGaps":["g1","g2"],"hiringPitch":"One sentence why hire","biasAdjusted":false}],"topPick":"Name","poolInsight":"Key insight","recommendation":"Final paragraph for hiring manager"}`,
    user: `Requirements: ${JSON.stringify(requirements)}\nAnalyses: ${JSON.stringify(analyses)}\nBias: ${JSON.stringify(biasReport)}`,
  }),
};

// ─── API ──────────────────────────────────────────────────────
async function callClaude(system, user) {
  const res = await fetch("/api/claude", {
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
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── CONSTANTS ────────────────────────────────────────────────
const VS = {
  "STRONG YES": { bg:"#052e16", border:"#16a34a", text:"#4ade80" },
  YES:          { bg:"#0c1a2e", border:"#3b82f6", text:"#60a5fa" },
  MAYBE:        { bg:"#1c1408", border:"#d97706", text:"#fbbf24" },
  NO:           { bg:"#1c0a0a", border:"#dc2626", text:"#f87171" },
};
const STEPS = [
  { id:"jd",      label:"JD Parser",    icon:"📋", desc:"Extracting requirements" },
  { id:"analyze", label:"Analyzer",     icon:"🔍", desc:"Scoring candidates" },
  { id:"bias",    label:"Bias Checker", icon:"⚖️", desc:"Fairness audit" },
  { id:"rank",    label:"Ranker",       icon:"🏆", desc:"Final recommendations" },
];
const SAMPLE_JD = `Senior Full-Stack Developer — FinTech Startup

We're hiring a senior engineer (5+ years) to build our core payment infrastructure.

Requirements:
• Python (FastAPI/Django) and React/TypeScript — mandatory
• REST APIs and microservices architecture
• AWS cloud infrastructure & PostgreSQL
• Bonus: ML/AI experience, fintech domain`;

const SAMPLE_CANDIDATES = [
  { name:"Alice Tan",   bio:"5 years Python (FastAPI), React, TypeScript. AWS certified. Built 3 SaaS products. Led payment integration at e-commerce startup processing RM2M/month. PostgreSQL expert.", source:"sample", fileType:"sample" },
  { name:"Bob Lim",     bio:"8 years Java Spring + Angular. Deep backend skills. Learning React (6 months). Worked at Maybank 4 years in payments. Minimal cloud experience.", source:"sample", fileType:"sample" },
  { name:"Carla Ng",    bio:"3 years Python Flask, React. ML specialization (Coursera). GCP user. Built P2P lending app with 200 users. Strong database skills.", source:"sample", fileType:"sample" },
  { name:"David Chen",  bio:"6 years full-stack Node.js + Vue. AWS certified. Built e-commerce platform 1M daily users. No fintech background but eager to learn.", source:"sample", fileType:"sample" },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────
function ScoreBar({ value, color }) {
  return (
    <div style={{ background:"#1e293b", borderRadius:4, height:5, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:4, transition:"width 1.2s ease" }} />
    </div>
  );
}

function StepBadge({ step, status }) {
  const c = { idle:{border:"#1e293b",bg:"#0a0a14",text:"#475569"}, active:{border:"#6366f1",bg:"#0f0f20",text:"#a5b4fc"}, done:{border:"#16a34a",bg:"#052e16",text:"#4ade80"}, error:{border:"#dc2626",bg:"#1c0a0a",text:"#f87171"} }[status] || {border:"#1e293b",bg:"#0a0a14",text:"#475569"};
  return (
    <div style={{ flex:1, border:`1px solid ${c.border}`, background:c.bg, borderRadius:10, padding:"10px 12px", position:"relative", overflow:"hidden", transition:"all 0.4s" }}>
      {status==="active" && <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,#6366f118,transparent)", animation:"shimmer 1.5s infinite" }} />}
      <div style={{ fontSize:16, marginBottom:2 }}>{status==="done"?"✅":status==="active"?"⏳":step.icon}</div>
      <div style={{ fontSize:10, fontWeight:700, color:c.text, letterSpacing:0.5 }}>{step.label}</div>
      <div style={{ fontSize:9, color:"#334155" }}>{status==="active"?step.desc+"…":status==="done"?"Done":"Waiting"}</div>
    </div>
  );
}

// ─── UNIVERSAL DROP ZONE ──────────────────────────────────────
function DropZone({ onFilesAdded, label = "Drop resumes here", sublabel = "PDF · DOCX · TXT · RTF · MD · CSV · JSON · DOC", multiple = true }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef();

  const handleFiles = useCallback(async (files) => {
    setProcessing(true);
    const results = [];
    for (const file of files) {
      const type = getFileType(file);
      const validTypes = ["pdf","docx","doc","rtf","md","csv","json","txt"];
      if (!validTypes.includes(type)) continue;
      try {
        const text = await extractText(file);
        if (!text.trim()) continue;
        const name = file.name
          .replace(/\.(pdf|docx?|rtf|md|csv|json|txt)$/i,"")
          .replace(/[-_]/g," ")
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
        results.push({ name, bio: text, source:"file", fileType: type, fileName: file.name });
      } catch(e) { console.error("Failed:", file.name, e); }
    }
    setProcessing(false);
    if (results.length > 0) onFilesAdded(results);
  }, [onFilesAdded]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
      onClick={() => inputRef.current?.click()}
      style={{ border:`2px dashed ${dragging?"#6366f1":"#1e293b"}`, background:dragging?"#0f0f20":"#0a0a0a", borderRadius:10, padding:"18px 16px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", marginBottom:10 }}
    >
      <input ref={inputRef} type="file" multiple={multiple} accept={SUPPORTED_ACCEPT} style={{ display:"none" }}
        onChange={(e) => handleFiles(Array.from(e.target.files))} />
      <div style={{ fontSize:22, marginBottom:4 }}>{processing?"⏳":"📎"}</div>
      <div style={{ fontSize:11, color:dragging?"#a5b4fc":"#64748b", fontWeight:600 }}>
        {processing ? "Reading files…" : dragging ? "Drop now!" : label}
      </div>
      <div style={{ fontSize:9, color:"#334155", marginTop:3 }}>{sublabel}</div>
      {/* Format badges */}
      <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:8, flexWrap:"wrap" }}>
        {[["pdf","#f87171"],["docx","#60a5fa"],["txt","#94a3b8"],["rtf","#a78bfa"],["md","#34d399"],["csv","#fbbf24"],["json","#fb923c"]].map(([fmt,color]) => (
          <span key={fmt} style={{ fontSize:8, background:`${color}15`, border:`1px solid ${color}40`, color, borderRadius:3, padding:"1px 5px", letterSpacing:0.5 }}>{fmt.toUpperCase()}</span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function IntelligentRecruiter() {
  const [jd, setJd]                   = useState(SAMPLE_JD);
  const [candidates, setCandidates]   = useState(SAMPLE_CANDIDATES);
  const [newName, setNewName]         = useState("");
  const [newBio, setNewBio]           = useState("");
  const [view, setView]               = useState("input");
  const [stepStatus, setStepStatus]   = useState({ jd:"idle", analyze:"idle", bias:"idle", rank:"idle" });
  const [results, setResults]         = useState(null);
  const [error, setError]             = useState(null);
  const [activeResult, setActiveResult] = useState(0);
  const [jdLoading, setJdLoading]     = useState(false);

  const setStep = (id, status) => setStepStatus(s => ({ ...s, [id]: status }));

  const handleCandidateFiles = useCallback((newCands) => {
    setCandidates(prev => {
      const names = new Set(prev.map(c => c.name));
      return [...prev, ...newCands.filter(c => !names.has(c.name))];
    });
  }, []);

  const handleJdFile = useCallback(async (files) => {
    const file = files[0]; if (!file) return;
    setJdLoading(true);
    try { setJd(await extractText(file)); } catch(e) { console.error(e); }
    setJdLoading(false);
  }, []);

  const runPipeline = async () => {
    if (!jd.trim() || candidates.length === 0) return;
    setView("running"); setError(null); setResults(null);
    setStepStatus({ jd:"idle", analyze:"idle", bias:"idle", rank:"idle" });
    try {
      setStep("jd","active");
      const p1 = STEP_PROMPTS.jdParser(jd);
      const requirements = await callClaude(p1.system, p1.user);
      setStep("jd","done");

      setStep("analyze","active");
      const p2 = STEP_PROMPTS.candidateAnalyzer(requirements, candidates);
      const { analyses } = await callClaude(p2.system, p2.user);
      setStep("analyze","done");

      setStep("bias","active");
      const p3 = STEP_PROMPTS.biasChecker(candidates, analyses);
      const biasReport = await callClaude(p3.system, p3.user);
      setStep("bias","done");

      setStep("rank","active");
      const p4 = STEP_PROMPTS.ranker(requirements, analyses, biasReport);
      const ranking = await callClaude(p4.system, p4.user);
      setStep("rank","done");

      setResults({ requirements, analyses, biasReport, ranking });
      setTimeout(() => setView("results"), 700);
    } catch(e) {
      setError("Pipeline error: " + e.message);
      setStepStatus(s => { const u={...s}; Object.keys(u).forEach(k=>{ if(u[k]==="active") u[k]="error"; }); return u; });
    }
  };

  const reset = () => { setView("input"); setResults(null); setError(null); setStepStatus({jd:"idle",analyze:"idle",bias:"idle",rank:"idle"}); };

  return (
    <div style={{ minHeight:"100vh", background:"#07070f", fontFamily:"'IBM Plex Mono','Courier New',monospace", color:"#cbd5e1" }}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing:border-box; }
        textarea,input { transition:border-color 0.2s; }
        textarea:focus,input:focus { border-color:#6366f1!important; outline:none; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0f1117} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,#0d0d1f,#07070f)", borderBottom:"1px solid #0f172a", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 0 20px #6366f140" }}>🤝</div>
          <div>
            <div style={{ fontSize:9, letterSpacing:3, color:"#6366f1", textTransform:"uppercase" }}>AI Marathon 2026 · APU AIC</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9", letterSpacing:-0.5 }}>Intelligent Recruiter</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["input","results"].map(v => (
            <button key={v} onClick={() => { if(v==="input"||(v==="results"&&results)) setView(v); }}
              style={{ background:view===v?"#1e1b4b":"none", border:`1px solid ${view===v?"#4338ca":"#1e293b"}`, color:view===v?"#a5b4fc":"#475569", borderRadius:6, padding:"5px 14px", fontSize:9, cursor:"pointer", fontFamily:"inherit", letterSpacing:1, textTransform:"uppercase" }}>
              {v==="input"?"⚙ Setup":`📊 Results${results?` (${results.ranking?.rankings?.length})`:""}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"24px 20px" }}>

        {/* INPUT */}
        {view==="input" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

              {/* LEFT — JD */}
              <div>
                <div style={{ fontSize:9, letterSpacing:2, color:"#6366f1", marginBottom:8, textTransform:"uppercase" }}>📋 Job Description</div>
                <DropZone
                  onFilesAdded={(files) => handleJdFile(files.map(f => ({ ...f, _file: f })))}
                  label={jdLoading ? "Reading file…" : "Upload JD file — or paste below"}
                  sublabel="PDF · DOCX · TXT · MD · RTF supported"
                  multiple={false}
                />
                <textarea value={jd} onChange={e=>setJd(e.target.value)} rows={13}
                  placeholder="Paste job description here..."
                  style={{ width:"100%", background:"#0a0a14", border:"1px solid #1e293b", borderRadius:8, padding:"12px 14px", color:"#e2e8f0", fontSize:11, fontFamily:"inherit", resize:"none", lineHeight:1.7 }} />
              </div>

              {/* RIGHT — Candidates */}
              <div>
                <div style={{ fontSize:9, letterSpacing:2, color:"#6366f1", marginBottom:8, textTransform:"uppercase" }}>
                  👥 Candidates ({candidates.length})
                </div>
                <DropZone onFilesAdded={handleCandidateFiles} label="Drop resume files here (multiple)" sublabel="PDF · DOCX · TXT · RTF · MD · CSV · JSON" />

                {/* List */}
                <div style={{ maxHeight:240, overflowY:"auto", display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                  {candidates.map((c,i) => {
                    const type = c.fileType || "sample";
                    const icon = FILE_ICON[type] || "👤";
                    const color = FILE_COLOR[type] || "#64748b";
                    return (
                      <div key={i} style={{ background:"#0a0a14", border:`1px solid ${c.source==="file"?"#1e3a5f":"#1e293b"}`, borderRadius:8, padding:"8px 12px", display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:`hsl(${i*80+200},45%,20%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{c.name[0]}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:600, color:"#f1f5f9" }}>{c.name}</span>
                            {c.source==="file" && (
                              <span style={{ fontSize:8, background:`${color}20`, border:`1px solid ${color}50`, color, borderRadius:3, padding:"1px 5px" }}>
                                {icon} {(c.fileType||"file").toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:10, color:"#475569", lineHeight:1.4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.bio.slice(0,85)}…</div>
                        </div>
                        <button onClick={() => setCandidates(candidates.filter((_,j)=>j!==i))}
                          style={{ background:"none", border:"none", color:"#374151", cursor:"pointer", fontSize:16, padding:0, flexShrink:0 }}>×</button>
                      </div>
                    );
                  })}
                </div>

                {/* Manual add */}
                <div style={{ background:"#0a0a0a", border:"1px dashed #1e293b", borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:9, color:"#334155", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>+ Add manually</div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Candidate name"
                    style={{ width:"100%", marginBottom:6, background:"#0f1117", border:"1px solid #1e293b", borderRadius:6, padding:"7px 10px", color:"#e2e8f0", fontSize:10, fontFamily:"inherit" }} />
                  <textarea value={newBio} onChange={e=>setNewBio(e.target.value)} placeholder="Paste resume text or profile summary…" rows={2}
                    style={{ width:"100%", marginBottom:6, background:"#0f1117", border:"1px solid #1e293b", borderRadius:6, padding:"7px 10px", color:"#e2e8f0", fontSize:10, fontFamily:"inherit", resize:"none" }} />
                  <button onClick={() => { if(newName.trim()&&newBio.trim()){ setCandidates([...candidates,{name:newName.trim(),bio:newBio.trim(),source:"manual",fileType:"txt"}]); setNewName(""); setNewBio(""); }}}
                    style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:5, padding:"5px 14px", color:"#94a3b8", cursor:"pointer", fontFamily:"inherit", fontSize:9, letterSpacing:1, textTransform:"uppercase" }}>Add</button>
                </div>
              </div>
            </div>

            {/* Launch */}
            <button onClick={runPipeline} disabled={!jd.trim()||candidates.length===0}
              style={{ marginTop:20, width:"100%", padding:"16px", borderRadius:10, border:"none", background:(!jd.trim()||candidates.length===0)?"#1e293b":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontSize:13, fontWeight:700, cursor:(!jd.trim()||candidates.length===0)?"not-allowed":"pointer", fontFamily:"inherit", letterSpacing:1, textTransform:"uppercase", boxShadow:"0 0 30px #6366f130", transition:"all 0.2s" }}>
              ▶ Launch 4-Step Agent Pipeline — {candidates.length} candidate{candidates.length!==1?"s":""}
            </button>
          </div>
        )}

        {/* RUNNING */}
        {view==="running" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ textAlign:"center", marginBottom:32, paddingTop:20 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🤖</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>Agent Pipeline Running…</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>4 specialized agents analyzing {candidates.length} candidates</div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:24 }}>
              {STEPS.map((step,i) => (
                <div key={step.id} style={{ display:"flex", alignItems:"center", gap:6, flex:1 }}>
                  <StepBadge step={step} status={stepStatus[step.id]} />
                  {i<STEPS.length-1 && <div style={{ color:"#1e293b", fontSize:16, flexShrink:0 }}>→</div>}
                </div>
              ))}
            </div>
            <div style={{ background:"#0a0a14", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:9, color:"#6366f1", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Agent Flow</div>
              {[
                { from:"Job Description",      to:"JD Parser Agent",      out:"Structured requirements",  color:"#6366f1", sid:"jd" },
                { from:"Profiles+Requirements",to:"Candidate Analyzer",   out:"Per-candidate scores",     color:"#0ea5e9", sid:"analyze" },
                { from:"Scores + Profiles",    to:"Bias Checker Agent",   out:"Fairness flags + score",   color:"#f59e0b", sid:"bias" },
                { from:"All data",             to:"Ranking Agent",        out:"Final ranked list",        color:"#10b981", sid:"rank" },
              ].map((row,i) => {
                const st = stepStatus[row.sid];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<3?10:0 }}>
                    <div style={{ fontSize:10, color:"#475569", width:140, textAlign:"right", flexShrink:0 }}>{row.from}</div>
                    <div style={{ color:"#1e293b" }}>→</div>
                    <div style={{ background:st==="done"?"#052e16":st==="active"?`${row.color}20`:"#0f1117", border:`1px solid ${st==="done"?"#16a34a":st==="active"?row.color:"#1e293b"}`, borderRadius:6, padding:"5px 12px", fontSize:10, color:st==="done"?"#4ade80":st==="active"?row.color:"#475569", fontWeight:700, flexShrink:0, transition:"all 0.4s" }}>{row.to}</div>
                    <div style={{ color:"#1e293b" }}>→</div>
                    <div style={{ fontSize:10, color:"#475569", flex:1 }}>{row.out}</div>
                  </div>
                );
              })}
            </div>
            {error && (
              <div style={{ marginTop:16, background:"#1c0a0a", border:"1px solid #dc2626", borderRadius:8, padding:14, color:"#f87171", fontSize:11, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>⚠ {error}</span>
                <button onClick={reset} style={{ background:"none", border:"1px solid #dc2626", borderRadius:4, padding:"4px 12px", color:"#f87171", cursor:"pointer", fontFamily:"inherit", fontSize:10 }}>Retry</button>
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {view==="results" && results && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { label:"Top Pick",      value:results.ranking.topPick,                    icon:"🏆", color:"#fbbf24" },
                { label:"Candidates",    value:results.ranking.rankings?.length,            icon:"👥", color:"#a5b4fc" },
                { label:"Fairness",      value:`${results.biasReport.fairnessScore}/100`,   icon:"⚖️", color:results.biasReport.fairnessScore>80?"#4ade80":"#fbbf24" },
                { label:"Bias Risk",     value:results.biasReport.overallBiasRisk,          icon:"🔍", color:results.biasReport.overallBiasRisk==="LOW"?"#4ade80":results.biasReport.overallBiasRisk==="MEDIUM"?"#fbbf24":"#f87171" },
              ].map((s,i) => (
                <div key={i} style={{ background:"#0a0a14", border:"1px solid #1e293b", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:9, color:"#475569", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background:"#0a0a14", border:"1px solid #312e81", borderRadius:10, padding:"12px 16px", marginBottom:14, display:"flex", gap:10 }}>
              <span style={{ fontSize:16 }}>💡</span>
              <div>
                <div style={{ fontSize:9, color:"#6366f1", letterSpacing:1, marginBottom:3, textTransform:"uppercase" }}>Agent Insight</div>
                <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.6 }}>{results.ranking.poolInsight}</div>
              </div>
            </div>

            <div style={{ background:"#0a0a14", border:"1px solid #1e293b", borderRadius:10, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:9, color:"#6366f1", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>📋 Parsed — {results.requirements.title}</div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:9, color:"#475569", marginBottom:5 }}>MUST HAVE</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {results.requirements.mustHave?.map((s,i) => <span key={i} style={{ background:"#052e16", border:"1px solid #16a34a", color:"#4ade80", borderRadius:4, padding:"2px 8px", fontSize:9 }}>{s}</span>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:"#475569", marginBottom:5 }}>NICE TO HAVE</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {results.requirements.niceToHave?.map((s,i) => <span key={i} style={{ background:"#0c1a2e", border:"1px solid #3b82f6", color:"#60a5fa", borderRadius:4, padding:"2px 8px", fontSize:9 }}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
              {results.ranking.rankings?.map((r,i) => {
                const vs = VS[r.verdict]||VS["MAYBE"];
                const analysis = results.analyses?.find(a=>a.name===r.name);
                const isOpen = activeResult===i;
                const cand = candidates.find(c=>c.name===r.name);
                const ftype = cand?.fileType||"sample";
                return (
                  <div key={i} onClick={() => setActiveResult(isOpen?-1:i)}
                    style={{ background:r.rank===1?"#0d0b1e":"#0a0a14", border:`1px solid ${r.rank===1?"#4338ca":"#1e293b"}`, borderRadius:12, cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s", position:"relative" }}>
                    {r.rank===1 && <div style={{ position:"absolute", top:0, right:0, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize:8, color:"#fff", padding:"3px 10px", borderBottomLeftRadius:6, letterSpacing:1 }}>TOP PICK ✦</div>}
                    <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:30, height:30, borderRadius:7, background:"#1e293b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#64748b", fontWeight:700, flexShrink:0 }}>#{r.rank}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{r.name}</span>
                          {ftype!=="sample" && (
                            <span style={{ fontSize:8, background:`${FILE_COLOR[ftype]||"#64748b"}20`, border:`1px solid ${FILE_COLOR[ftype]||"#64748b"}50`, color:FILE_COLOR[ftype]||"#64748b", borderRadius:3, padding:"1px 5px" }}>
                              {FILE_ICON[ftype]||"📄"} {ftype.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:10, color:"#475569", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.hiringPitch}</div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:r.finalScore>=75?"#4ade80":r.finalScore>=50?"#fbbf24":"#f87171" }}>{r.finalScore}</div>
                        <div style={{ background:vs.bg, border:`1px solid ${vs.border}`, color:vs.text, borderRadius:5, padding:"3px 8px", fontSize:9, fontWeight:700, letterSpacing:1 }}>{r.verdict}</div>
                        <div style={{ color:"#334155", fontSize:12 }}>{isOpen?"▲":"▼"}</div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop:"1px solid #1e293b", padding:"12px 16px", animation:"fadeUp 0.2s ease" }}>
                        {analysis && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ fontSize:9, color:"#475569", letterSpacing:1, marginBottom:8, textTransform:"uppercase" }}>Score Breakdown</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                              {[["Must-Have Match",analysis.mustHaveMatch,"#4ade80"],["Nice-to-Have",analysis.niceToHaveMatch,"#60a5fa"],["Experience",analysis.experienceScore,"#a78bfa"],["Domain Fit",analysis.domainRelevance,"#fbbf24"]].map(([label,val,color]) => (
                                <div key={label}>
                                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                    <span style={{ fontSize:9, color:"#64748b" }}>{label}</span>
                                    <span style={{ fontSize:9, color }}>{val}%</span>
                                  </div>
                                  <ScoreBar value={val} color={color} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                          <div>
                            <div style={{ fontSize:9, color:"#4ade80", letterSpacing:1, marginBottom:5, textTransform:"uppercase" }}>✓ Strengths</div>
                            {r.topStrengths?.map((s,j) => <div key={j} style={{ fontSize:10, color:"#86efac", paddingLeft:8, borderLeft:"2px solid #16a34a", marginBottom:3 }}>{s}</div>)}
                          </div>
                          <div>
                            <div style={{ fontSize:9, color:"#f87171", letterSpacing:1, marginBottom:5, textTransform:"uppercase" }}>✗ Gaps</div>
                            {r.topGaps?.map((g,j) => <div key={j} style={{ fontSize:10, color:"#fca5a5", paddingLeft:8, borderLeft:"2px solid #dc2626", marginBottom:3 }}>{g}</div>)}
                          </div>
                        </div>
                        {analysis?.standout && (
                          <div style={{ marginTop:10, background:"#0f0f20", border:"1px solid #312e81", borderRadius:6, padding:"8px 12px", fontSize:10, color:"#a5b4fc" }}>
                            ⭐ <strong>Standout:</strong> {analysis.standout}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {results.biasReport.flags?.length > 0 && (
              <div style={{ background:"#0a0a14", border:"1px solid #d9770620", borderRadius:10, padding:14, marginBottom:14 }}>
                <div style={{ fontSize:9, color:"#d97706", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>⚖️ Bias Flags</div>
                {results.biasReport.flags.map((f,i) => (
                  <div key={i} style={{ fontSize:10, color:"#94a3b8", marginBottom:5, paddingLeft:8, borderLeft:"2px solid #d97706" }}>
                    <span style={{ color:"#fbbf24", fontWeight:700 }}>{f.candidate}</span> — {f.type}: {f.description}
                  </div>
                ))}
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:9, color:"#475569", marginBottom:5, textTransform:"uppercase", letterSpacing:1 }}>Recommendations</div>
                  {results.biasReport.recommendations?.map((r,i) => (
                    <div key={i} style={{ fontSize:10, color:"#94a3b8", paddingLeft:8, borderLeft:"2px solid #475569", marginBottom:3 }}>{r}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background:"#0a0a14", border:"1px solid #1e293b", borderRadius:10, padding:14, marginBottom:18 }}>
              <div style={{ fontSize:9, color:"#6366f1", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>💼 Hiring Manager Recommendation</div>
              <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7 }}>{results.ranking.recommendation}</div>
            </div>

            <button onClick={reset} style={{ width:"100%", padding:"11px", borderRadius:8, border:"1px solid #1e293b", background:"none", color:"#475569", cursor:"pointer", fontFamily:"inherit", fontSize:10, letterSpacing:1, textTransform:"uppercase" }}>← New Analysis</button>
          </div>
        )}
      </div>
    </div>
  );
}
