# 🤝 Intelligent Recruiter — AI Marathon 2026

> **Track:** The Intelligent Recruiter  
> **Event:** AI Marathon 2026 @ APU AIC  
> **Theme:** LLM Everywhere  
> **Live Demo:** https://intelligent-recruiter.vercel.app

An agentic AI system that bridges the gap between diverse talent and hiring managers — replacing static, keyword-based job boards with an intelligent 4-agent pipeline.

---

## 🧠 Agent Architecture

```
Job Description ──► [JD Parser Agent]          → Structured requirements
Candidate Profiles ► [Candidate Analyzer]      → Per-candidate scoring
All Data ──────────► [Bias Checker Agent]      → Fairness audit & flags  
Final Data ────────► [Ranking Agent]           → Ranked list + hiring report
```

---

## ✨ Features

- **4-Step Agentic Pipeline** — explainable reasoning chain
- **JD Parser** — extracts must-have skills, experience, domain from any job description
- **Candidate Analyzer** — scores each candidate across 4 dimensions
- **Bias Checker** — flags potential gender, name, or cultural bias
- **Ranking Agent** — produces final ranked list with hiring manager recommendations
- **Multi-format Upload** — supports PDF, DOCX, TXT, RTF, MD, CSV, JSON resumes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (JSX) |
| AI Engine | LLM via Chutes API |
| Backend | Vercel Serverless Functions |
| Deployment | Vercel |

---

## 🔑 Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `CHUTES_API_KEY` | Chutes AI API key for LLM access | https://chutes.ai/app/api |

**Note:** Never commit your actual API keys. Use the `.env.example` as a template.

For Vercel deployment, add the environment variable in:
**Vercel Dashboard → Project → Settings → Environment Variables**

---

## 🚀 How to Run

### Option 1: Live Demo
Visit: **https://intelligent-recruiter.vercel.app**

### Option 2: Local Development
```bash
# Clone the repo
git clone https://github.com/Mahir-bit702/intelligent-recruiter
cd intelligent-recruiter

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your CHUTES_API_KEY

# Run locally
npm run dev
```

Open `http://localhost:5173` in your browser.

### Option 3: Deploy to Vercel
1. Fork this repo
2. Connect to Vercel
3. Add `CHUTES_API_KEY` as environment variable
4. Deploy

---

## 📋 System Requirements

- Node.js 18+
- npm or yarn
- Chutes AI API key (get one at chutes.ai)

---

## 👥 Team

| Name | Student ID | Role |
|------|-----------|------|
| Mahir Faisal | TP087132 | Lead Developer — Agent pipeline, core prototype |
| Yousef Haroon | TP085323 | Backend Developer — GitHub, deployment, documentation |
| Sai Nyi | TP087643 | Designer — UI/UX, pitch deck, video demo |
| Sams Sahil | TP088179 | Research & Pitch — Problem research, presentation |

---

## 📊 Judging Criteria Alignment

| Criteria | How We Address It |
|---------|------------------|
| Track Understanding (20pts) | Full pipeline covering JD parsing → scoring → bias check → ranking |
| Solution Effectiveness (15pts) | Single optimized LLM call with focused agentic reasoning |
| Scalability (10pts) | Stateless architecture — scales to any number of candidates |
| Originality (20pts) | Bias Checker agent is unique differentiator |
| Tool Use & AI Orchestration (10pts) | Custom 4-agent pipeline via Chutes API |
| Architecture & Design (15pts) | Clear pipeline diagram, each agent has single responsibility |
| Prototype Functionality (10pts) | Fully working live demo at intelligent-recruiter.vercel.app |

---

## 📝 License

MIT — Built for AI Marathon 2026 @ APU AIC
