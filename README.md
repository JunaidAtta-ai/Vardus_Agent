# Trader Agent

An AI-powered trading agent skeleton inspired by [OpenAlice](https://github.com/TraderAlice/OpenAlice).  
Built with TypeScript, Vercel AI SDK, CCXT, Hono, and grammY.

---

## Architecture

```
Connectors (Web UI / Telegram)
        │
   ConnectorRegistry
        │
     Engine  ──▶  AgentCenter ──▶ ProviderRouter ──▶ [ Claude Code | Vercel AI SDK ]
        │                               │
   EventLog                        ToolCenter
                                       │
                    ┌──────────────────┼──────────────────┐
               analysis-kit     crypto-trading           brain
               news-collector   (wallet + guard)     (memory + emotion)
```

## Key Concepts

| Concept | Description |
|---|---|
| **Provider** | AI backend — Claude Code CLI subprocess or Vercel AI SDK. Switchable at runtime via `ai-provider.json`. |
| **Extension** | Self-contained tool package registered in `ToolCenter`. Owns its tools, state, and persistence. |
| **Wallet** | Git-like trading workflow: stage → commit → push to exchange. Every commit gets an 8-char hash. |
| **Guard** | Pre-execution safety check before every trade: max position size, max leverage, cooldown. |
| **Connector** | External interface (Web UI, Telegram). ConnectorRegistry routes replies to last-interacted channel. |
| **Brain** | Persistent cognitive state: frontal-lobe memory, emotion log. |
| **Heartbeat** | Periodic market check-in with structured protocol: `HEARTBEAT_OK` / `CHAT_YES` / `CHAT_NO`. |
| **EventLog** | Append-only JSONL event bus; cron, heartbeat, errors all flow through here. |

---

## Project Structure

```
src/
  main.ts                    # Composition root
  core/
    engine.ts                # Thin facade → AgentCenter
    agent-center.ts          # Manages provider routing and sessions
    ai-provider.ts           # AIProvider interface + ProviderRouter
    tool-center.ts           # Centralized tool registry
    config.ts                # Zod-validated config loader
    event-log.ts             # Persistent JSONL event log
    connector-registry.ts    # Last-interacted channel tracker
    session.ts               # JSONL session store
    compaction.ts            # Context window auto-summariser
    types.ts                 # Shared interfaces
  providers/
    claude-code/index.ts     # Claude Code CLI subprocess provider
    vercel-ai-sdk/index.ts   # Vercel AI SDK ToolLoopAgent provider
  extension/
    analysis-kit/            # Technical indicators + market data tools
    crypto-trading/          # CCXT wallet, guard pipeline, tools
    brain/                   # Memory + emotion extension
    news-collector/          # RSS collector + archive search tools
  connectors/
    web/index.ts             # Hono HTTP + SSE push chat interface
    telegram/index.ts        # grammY Telegram bot connector
  task/
    cron/index.ts            # Cron scheduler + AI-powered job runner
    heartbeat/index.ts       # Periodic market heartbeat
  plugins/
    http.ts                  # Health/status HTTP plugin
data/
  config/                    # JSON config files (Zod-validated)
  default/                   # Factory defaults (persona, heartbeat prompts)
  sessions/                  # JSONL conversation histories
  brain/                     # Agent memory and emotion logs
  event-log/                 # events.jsonl
  crypto-trading/            # Wallet commit history
  news-collector/            # Persistent news archive
  cron/                      # jobs.json
```

---

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm 10+
git clone <this-repo>
cd trader-agent
pnpm install
pnpm dev
```

Open [localhost:3002](http://localhost:3002).

---

## Configuration (`data/config/`)

| File | Purpose |
|---|---|
| `ai-provider.json` | Active AI provider (`vercel-ai-sdk` or `claude-code`) |
| `api-keys.json` | AI API keys (Anthropic, OpenAI, Google) |
| `model.json` | Model name |
| `agent.json` | Max steps, evolution mode |
| `engine.json` | Trading pairs, tick interval, timeframe |
| `crypto.json` | CCXT exchange config + API keys, guards |
| `connectors.json` | Web port, Telegram credentials |
| `heartbeat.json` | Heartbeat enable/interval/active hours |
| `news-collector.json` | RSS feeds, fetch interval |

---

## License

MIT
