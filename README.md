# 🤝 Intelligent Recruiter — AI Marathon 2026

> **Track:** The Intelligent Recruiter  
> **Event:** AI Marathon 2026 @ APU AIC  
> **Theme:** LLM Everywhere

An agentic AI system that bridges the gap between diverse talent and hiring managers — replacing static, keyword-based job boards with an intelligent 4-step reasoning pipeline.

---

## 🧠 Agent Architecture

```
Job Description ──► [JD Parser Agent]        → Structured requirements
Candidate Profiles ► [Candidate Analyzer]    → Per-candidate scoring
All Data ──────────► [Bias Checker Agent]    → Fairness audit & flags  
Final Data ────────► [Ranking Agent]         → Ranked list + hiring report
```

Each agent is a specialized LLM call with a focused system prompt — enabling multi-step reasoning that no single prompt could achieve.

---

## ✨ Features

- **4-Step Agentic Pipeline** — visible, explainable reasoning chain
- **JD Parser** — extracts must-have skills, experience, domain from any job description
- **Candidate Analyzer** — scores each candidate across 4 dimensions
- **Bias Checker** — flags potential gender, name, or cultural bias in evaluations
- **Ranking Agent** — produces final ranked list with hiring manager recommendations
- **Interactive UI** — expandable candidate cards, score breakdowns, bias report

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (JSX) |
| AI Engine | Claude claude-sonnet-4-20250514 via Anthropic API |
| Hosting | Claude.ai Artifacts / Any static host |
| Language | JavaScript (no backend required) |

---

## 🚀 How to Run

### Option 1: Claude.ai (Easiest)
1. Copy the contents of `IntelligentRecruiter.jsx`
2. Open [claude.ai](https://claude.ai)
3. Paste the code and ask Claude to render it as an artifact

### Option 2: Local Development
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/intelligent-recruiter
cd intelligent-recruiter

# Install dependencies
npm install

# Add your Anthropic API key
cp .env.example .env
# Edit .env and add: VITE_ANTHROPIC_API_KEY=your_key_here

# Run
npm run dev
```

### Option 3: Deploy to Vercel/Netlify
1. Fork this repo
2. Connect to Vercel
3. Add `ANTHROPIC_API_KEY` as environment variable
4. Deploy

---

## 📋 System Requirements

- Node.js 18+
- npm or yarn
- Anthropic API key ([get one here](https://console.anthropic.com))

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Lead Developer | Core prototype, agent pipeline |
| Backend Dev | GitHub setup, PDF upload feature |
| Designer | Pitch deck, architecture diagram, video demo |
| Research & Pitch | Problem research, presentation |

---

## 📊 Judging Criteria Alignment

| Criteria | How We Address It |
|---------|------------------|
| Track Understanding (20pts) | Full pipeline covering JD analysis → candidate scoring → bias check → ranking |
| Solution Effectiveness (15pts) | 4 specialized agents each with focused reasoning |
| Scalability (10pts) | Stateless architecture — scales to any number of candidates/JDs |
| Originality (20pts) | Bias Checker agent is unique differentiator — addresses ethical hiring |
| Tool Use & AI Orchestration (10pts) | Multi-agent orchestration with Claude API |
| Architecture & Design (15pts) | Clear pipeline diagram, each agent has single responsibility |
| Prototype Functionality (10pts) | Fully working demo with real LLM calls |

---

## 📝 License

MIT — Built for AI Marathon 2026 @ APU AIC
