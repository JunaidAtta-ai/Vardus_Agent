<div align="center">

<img src="ui/public/logo.png" alt="VARDUS" width="120" />

# VARDUS AGENT

**Autonomous AI trading agent for Solana memecoins**

[![Live](https://img.shields.io/badge/Live%20Dashboard-online-00ff94?style=for-the-badge&logo=vercel&logoColor=white)](https://ui-zeta-roan.vercel.app)
[![Railway](https://img.shields.io/badge/Backend-Railway-6c42df?style=for-the-badge&logo=railway&logoColor=white)](https://actavis-agent-production.up.railway.app/health)
[![Model](https://img.shields.io/badge/AI-GPT--4o-74aa9c?style=for-the-badge&logo=openai&logoColor=white)](#)
[![Chain](https://img.shields.io/badge/Chain-Solana-9945ff?style=for-the-badge&logo=solana&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

> VARDUS runs 24/7 — scanning DexScreener & Pump.fun every 10 minutes,  
> reasoning through market data with GPT-4o, and executing trades autonomously on Solana.

<br/>

[**→ Open Live Dashboard**](https://ui-zeta-roan.vercel.app) &nbsp;·&nbsp; [**→ Health Check**](https://actavis-agent-production.up.railway.app/health)

</div>

---

## What It Does

```
Every 10 minutes:

  📡 Scan  ──▶  DexScreener top boosts  +  Pump.fun trending
     │
  🧠 Think ──▶  GPT-4o analyzes price action, volume, liquidity, age
     │
  💰 Act   ──▶  BUY (Jupiter swap)  /  SELL  /  HOLD
     │
  📊 Log   ──▶  Event log  →  Live UI via SSE stream
```

No human needed. Fully autonomous.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Brain | GPT-4o via Vercel AI SDK |
| Blockchain | Solana — Jupiter aggregator swaps |
| Scanner | DexScreener API + Pump.fun |
| Backend | Node 22 + TypeScript + Hono |
| Frontend | React 18 + Vite 5 + Framer Motion |
| Deploy | Railway (backend) + Vercel (frontend) |
| Realtime | Server-Sent Events (SSE) |

---

## Architecture

```mermaid
flowchart TD
    A[🌐 Web UI\nVercel] -->|SSE stream| B[Hono Server\nRailway :3002]
    B --> C[Trading Loop\n10 min cycle]
    C --> D[Memecoin Scanner]
    D -->|tokens| E[GPT-4o Brain]
    E -->|BUY / SELL / HOLD| F[Jupiter Swap\nSolana]
    F -->|tx signature| G[Event Log\nJSONL]
    G -->|push| B
    D --> D1[DexScreener\nTop Boosts]
    D --> D2[Pump.fun\nTrending]
    B --> H[Chat Interface\nAsk the agent anything]
```

---

## AI Brain

VARDUS uses GPT-4o with a structured tool loop:

- **`scan_tokens`** — pulls trending memecoins from DexScreener + Pump.fun
- **`get_positions`** — checks current open positions & unrealized PnL
- **`buy_token`** — executes a Jupiter swap (SOL → token)
- **`sell_token`** — exits a position (token → SOL)
- **`recall_memory`** — reads persistent notes from previous cycles

Each cycle the agent reasons step-by-step: *"Should I enter this? What's the risk? Do I hold or exit?"*

---

## Trading Engine

| Parameter | Value |
|---|---|
| Cycle interval | 10 minutes |
| Scanner sources | DexScreener top boosts + Pump.fun |
| Swap router | Jupiter Aggregator |
| Network | Solana Mainnet |
| Auto-trading | ✅ enabled by default |
| Guard checks | Position size + liquidity + cooldown |

---

## Live Dashboard

The UI streams live data from the agent in real-time via SSE:

| Tab | What you see |
|---|---|
| Overview | Wallet balance, PnL, agent status |
| Positions | Open trades with unrealized PnL |
| Scanner | Tokens currently being analyzed |
| Brain | GPT-4o reasoning log |
| Event Log | Full event stream |
| Config | Agent parameters |

**[→ Open Dashboard](https://ui-zeta-roan.vercel.app)**

---

## Quick Start

<details>
<summary><b>🏃 Run locally</b></summary>

```bash
# Prerequisites: Node.js 22+
git clone https://github.com/JunaidAtta-ai/Vardus_Agent
cd Vardus_Agent
npm install
```

Create a `.env` file:

```env
OPENAI_API_KEY=sk-...
SOLANA_PRIVATE_KEY=your_base58_private_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_AUTO_TRADING=true
AI_MODEL=gpt-4o
PORT=3002
```

```bash
# Start backend
npx tsx src/main.ts

# Start frontend (separate terminal)
cd ui && npm install && npm run dev
```

Open [localhost:3002](http://localhost:3002)

</details>

<details>
<summary><b>🚀 Deploy to Railway + Vercel</b></summary>

**Backend (Railway):**
1. Connect GitHub repo to Railway
2. Railway auto-detects `Dockerfile`
3. Set env vars: `OPENAI_API_KEY`, `SOLANA_PRIVATE_KEY`, `AI_MODEL=gpt-4o`, `SOLANA_AUTO_TRADING=true`

**Frontend (Vercel):**
1. Connect `ui/` subfolder to Vercel
2. Set `VITE_API_URL` to your Railway URL
3. Deploy

</details>

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | GPT-4o API key |
| `SOLANA_PRIVATE_KEY` | ✅ | Base58 wallet private key |
| `SOLANA_RPC_URL` | optional | Custom RPC (default: mainnet) |
| `AI_MODEL` | optional | Model override (default: `gpt-4o`) |
| `SOLANA_AUTO_TRADING` | optional | Enable auto-trading (default: `true`) |
| `SOLANA_TRADING_INTERVAL_MINUTES` | optional | Cycle interval (default: `10`) |
| `PORT` | optional | HTTP port (default: `3002`) |

---

## Project Structure

<details>
<summary><b>📁 View full structure</b></summary>

```
src/
├── main.ts                    # Entry point
├── core/
│   ├── engine.ts              # Facade → AgentCenter
│   ├── agent-center.ts        # Provider routing + sessions
│   ├── config.ts              # Env-aware config loader
│   ├── event-log.ts           # Append-only JSONL event bus
│   └── tool-center.ts         # Tool registry
├── extension/
│   ├── memecoin-scanner/      # DexScreener + Pump.fun scanner
│   ├── solana-trading/        # Jupiter swap execution
│   └── brain/                 # Memory + persistent state
├── task/
│   └── trading-loop/          # 10-min autonomous cycle
├── connectors/
│   └── web/                   # Hono HTTP + SSE connector
└── plugins/
    └── http.ts                # /health endpoint

ui/
├── src/
│   ├── App.tsx                # Main dashboard shell
│   ├── components/            # Overview, Scanner, Brain, etc.
│   ├── hooks/useSSE.ts        # Live event stream hook
│   └── api.ts                 # REST client
└── public/
    └── logo.png               # VARDUS logo
```

</details>

---

## Disclaimer

> **This is experimental software.** Memecoin trading carries extreme risk of total loss.
> This project is for educational purposes only. Use at your own risk.

---

## License

MIT © 2026 Vardus

---

<div align="center">

Built with ❤️ &nbsp;·&nbsp; Powered by GPT-4o &nbsp;·&nbsp; Running on Solana

**[Dashboard](https://ui-zeta-roan.vercel.app)** &nbsp;·&nbsp; **[Health](https://actavis-agent-production.up.railway.app/health)**

</div>
