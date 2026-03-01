import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
const CAPABILITIES = [
    {
        tag: "AUTOPILOT",
        title: "Autonomous Trading Loop",
        desc: "AI reasoning cycle on configurable schedule. The agent scans markets, analyzes signals, executes trades, and logs reasoning without human intervention.",
        accent: "var(--cyan)",
    },
    {
        tag: "SCANNER",
        title: "DexScreener + PumpFun",
        desc: "Live trending token detection across all Solana DEXs. Monitors new launches, liquidity depth, volume momentum, and price action in real time.",
        accent: "var(--violet)",
    },
    {
        tag: "EXECUTION",
        title: "Jupiter V6 Aggregator",
        desc: "Optimal swap routing via Jupiter DEX. Slippage-protected execution with automatic retry logic and on-chain confirmation tracking.",
        accent: "var(--cyan)",
    },
    {
        tag: "RISK",
        title: "Guard Pipeline",
        desc: "Multi-layer pre-execution safety checks. Max position size, daily loss limits, per-token cooldown windows, and minimum liquidity gates.",
        accent: "var(--danger)",
    },
    {
        tag: "MEMORY",
        title: "Cognitive Brain",
        desc: "Persistent working memory across all sessions. Emotion tracking, frontal lobe context buffer, and decision rationale stored as immutable JSONL.",
        accent: "var(--violet)",
    },
    {
        tag: "AUDIT",
        title: "Immutable Event Log",
        desc: "Append-only event bus for every agent action. Real-time SSE push to dashboard. Crash-safe JSONL persistence with replay support.",
        accent: "var(--cyan)",
    },
    {
        tag: "ANALYSIS",
        title: "Market Intelligence",
        desc: "Multi-signal analysis: liquidity ratios, volume/mcap ratio, price momentum, holder counts, social metadata, and pump activity detection.",
        accent: "var(--violet)",
    },
    {
        tag: "TERMINAL",
        title: "AI Terminal Interface",
        desc: "Direct real-time console for agent interaction. Query reasoning, inspect positions, override limits, and watch the agent think in real time.",
        accent: "var(--cyan)",
    },
];
const ARCH_LAYERS = [
    { num: "01", name: "Web Dashboard", desc: "React + Framer Motion UI. SSE real-time push. Chat terminal." },
    { num: "02", name: "Agent Engine", desc: "AI reasoning core with tool loop, context compaction, session memory." },
    { num: "03", name: "Extension Layer", desc: "Solana trading, memecoin scanner, brain, news collector, analysis kit." },
    { num: "04", name: "Solana Network", desc: "Wallet keypair, Jupiter DEX aggregator, SPL token accounts, RPC." },
];
const MODULES = [
    { module: "TradingLoop", cls: "Scheduler", purpose: "AI-driven buy/sell cycle on configurable interval" },
    { module: "SolanaTradingExt", cls: "Exchange", purpose: "Jupiter swaps, positions, PnL tracking, guard checks" },
    { module: "MemecoinScanner", cls: "Data Feed", purpose: "DexScreener + PumpFun trending token aggregation" },
    { module: "BrainExtension", cls: "Cognitive", purpose: "Working memory, emotion log, decision rationale" },
    { module: "GuardPipeline", cls: "Risk Mgmt", purpose: "Pre-execution: size limits, cooldown, daily loss cap" },
    { module: "EventLog", cls: "Audit Trail", purpose: "Append-only JSONL bus with real-time SSE subscriptions" },
    { module: "WebConnector", cls: "API Server", purpose: "Hono HTTP, REST endpoints, static UI serving" },
    { module: "Heartbeat", cls: "Monitor", purpose: "Periodic health check with structured response protocol" },
];
const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: (i) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
    }),
};
export default function Overview({ wallet, summary, trades, events, agentStatus }) {
    const buys = trades.filter((t) => t.type === "buy").length;
    const sells = trades.filter((t) => t.type === "sell").length;
    const STATS = [
        { label: "TRADES TOTAL", value: String(summary.totalTrades) },
        {
            label: "REALIZED PNL",
            value: `${summary.totalRealizedPnlSol >= 0 ? "+" : ""}${summary.totalRealizedPnlSol.toFixed(4)} SOL`,
            color: summary.totalRealizedPnlSol >= 0 ? "var(--cyan)" : "var(--danger)",
        },
        { label: "SOL BALANCE", value: wallet ? `${wallet.solBalance.toFixed(4)} SOL` : "--" },
        { label: "BUY SIGNALS", value: String(buys), color: "var(--cyan)" },
        { label: "SELL SIGNALS", value: String(sells), color: "var(--danger)" },
        { label: "EVENTS LOGGED", value: String(events.length) },
    ];
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 64 }, children: [_jsxs(motion.section, { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }, style: { textAlign: "center", paddingTop: 40 }, children: [_jsxs("div", { style: {
                            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
                            background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.2)",
                            borderRadius: 20, padding: "5px 16px",
                        }, children: [_jsx("div", { className: "orb orb-cyan", style: { width: 6, height: 6 } }), _jsxs("span", { style: {
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                    letterSpacing: "0.12em", color: "var(--cyan)", textTransform: "uppercase",
                                }, children: ["AGENT STATUS: ", agentStatus.toUpperCase()] })] }), _jsxs("h1", { style: {
                            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800,
                            letterSpacing: "-0.04em", lineHeight: 1.08,
                            margin: "0 0 20px", color: "var(--text)",
                        }, children: ["Autonomous Solana", _jsx("br", {}), _jsx("span", { style: {
                                    background: "linear-gradient(90deg, var(--cyan) 30%, var(--violet))",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                }, children: "AI Trader" })] }), _jsx("p", { style: {
                            fontSize: 16, color: "var(--text-sub)", maxWidth: 560,
                            margin: "0 auto 40px", lineHeight: 1.7,
                        }, children: "Your personal AI trading desk running 24/7 on Solana mainnet. Scans trending tokens, analyzes signals, decides, executes. Full reasoning trail. Zero manual intervention required." }), _jsx("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }, children: STATS.map((s, i) => (_jsx(motion.div, { custom: i, variants: fadeUp, initial: "hidden", animate: "show", children: _jsxs("div", { className: "glass", style: { padding: "12px 20px", borderRadius: 10, textAlign: "center", minWidth: 110 }, children: [_jsx("div", { style: {
                                            fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
                                            color: s.color ?? "var(--text)", marginBottom: 5, lineHeight: 1,
                                        }, children: s.value }), _jsx("div", { style: {
                                            fontSize: 9, letterSpacing: "0.1em", color: "var(--text-muted)",
                                            textTransform: "uppercase",
                                        }, children: s.label })] }) }, s.label))) })] }), _jsxs("section", { children: [_jsx(SectionHeading, { label: "CAPABILITIES" }), _jsx("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                            gap: 14,
                        }, children: CAPABILITIES.map((cap, i) => (_jsx(motion.div, { custom: i, variants: fadeUp, initial: "hidden", animate: "show", children: _jsxs("div", { className: "glass hover-lift", style: {
                                    padding: "20px 22px", borderRadius: 12,
                                    borderTop: `1px solid ${cap.accent}44`,
                                    position: "relative", overflow: "hidden",
                                    height: "100%",
                                }, children: [_jsx("div", { style: {
                                            position: "absolute", top: 0, right: 0,
                                            width: 90, height: 90,
                                            background: `radial-gradient(circle at top right, ${cap.accent}18, transparent 70%)`,
                                            pointerEvents: "none",
                                        } }), _jsx("div", { style: { marginBottom: 14 }, children: _jsx("span", { style: {
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                                                letterSpacing: "0.12em", color: cap.accent,
                                                background: `${cap.accent}18`, border: `1px solid ${cap.accent}33`,
                                                borderRadius: 4, padding: "3px 8px", textTransform: "uppercase",
                                            }, children: cap.tag }) }), _jsx("h3", { style: {
                                            fontSize: 14, fontWeight: 600, color: "var(--text)",
                                            margin: "0 0 10px", letterSpacing: "-0.01em",
                                        }, children: cap.title }), _jsx("p", { style: {
                                            fontSize: 12, color: "var(--text-sub)", lineHeight: 1.65, margin: 0,
                                        }, children: cap.desc })] }) }, cap.tag))) })] }), _jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 28 }, children: [_jsxs("div", { children: [_jsx(SectionHeading, { label: "ARCHITECTURE LAYERS" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: ARCH_LAYERS.map((layer, i) => (_jsx(motion.div, { custom: i + 6, variants: fadeUp, initial: "hidden", animate: "show", children: _jsxs("div", { className: "glass", style: { padding: "16px 20px", borderRadius: 10, display: "flex", gap: 18, alignItems: "flex-start" }, children: [_jsx("span", { style: {
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 800,
                                                    color: "rgba(0,229,255,0.18)", lineHeight: 1, flexShrink: 0,
                                                }, children: layer.num }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 5 }, children: layer.name }), _jsx("div", { style: { fontSize: 12, color: "var(--text-sub)", lineHeight: 1.5 }, children: layer.desc })] })] }) }, layer.num))) })] }), _jsxs("div", { children: [_jsx(SectionHeading, { label: "RUNTIME MODULES" }), _jsx("div", { className: "glass", style: { borderRadius: 10, overflow: "hidden" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: "1px solid var(--border)" }, children: ["MODULE", "CLASS", "PURPOSE"].map((h) => (_jsx("th", { style: {
                                                        padding: "10px 14px", textAlign: "left",
                                                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                                                        letterSpacing: "0.1em", color: "var(--text-muted)",
                                                        textTransform: "uppercase", fontWeight: 600,
                                                    }, children: h }, h))) }) }), _jsx("tbody", { children: MODULES.map((m, i) => (_jsxs(motion.tr, { custom: i + 8, variants: fadeUp, initial: "hidden", animate: "show", style: { borderBottom: i < MODULES.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }, children: [_jsx("td", { style: {
                                                            padding: "9px 14px",
                                                            fontFamily: "'JetBrains Mono', monospace",
                                                            fontSize: 11, color: "var(--cyan)",
                                                        }, children: m.module }), _jsx("td", { style: { padding: "9px 14px", fontSize: 11, color: "var(--text-sub)" }, children: m.cls }), _jsx("td", { style: { padding: "9px 14px", fontSize: 11, color: "var(--text-muted)" }, children: m.purpose })] }, m.module))) })] }) })] })] }), _jsx(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.4 }, children: _jsx("div", { className: "glass", style: {
                        padding: "20px 32px", borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "space-around",
                        flexWrap: "wrap", gap: 20,
                        borderTop: "1px solid rgba(0,229,255,0.15)",
                    }, children: [
                        { value: "8", label: "EXTENSIONS" },
                        { value: "20+", label: "AI TOOLS" },
                        { value: "4", label: "ARCH LAYERS" },
                        { value: "SSE", label: "REALTIME PUSH" },
                        { value: "JSONL", label: "EVENT STORE" },
                        { value: "24/7", label: "UPTIME TARGET" },
                    ].map((s) => (_jsxs("div", { style: { textAlign: "center" }, children: [_jsx("div", { style: {
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 800,
                                    color: "var(--cyan)", letterSpacing: "-0.02em", lineHeight: 1,
                                }, children: s.value }), _jsx("div", { style: {
                                    fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)",
                                    textTransform: "uppercase", marginTop: 6,
                                }, children: s.label })] }, s.label))) }) })] }));
}
function SectionHeading({ label }) {
    return (_jsxs("div", { style: { marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }, children: [_jsx("span", { style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    letterSpacing: "0.12em", color: "var(--cyan)", textTransform: "uppercase",
                    flexShrink: 0,
                }, children: label }), _jsx("div", { style: { flex: 1, height: 1, background: "var(--border)" } })] }));
}
