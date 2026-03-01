import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchConfig } from "../api.js";
function ConfigRow({ label, value, accent }) {
    const display = typeof value === "boolean"
        ? value ? "ENABLED" : "DISABLED"
        : String(value);
    const color = typeof value === "boolean"
        ? value ? "var(--cyan)" : "var(--danger)"
        : accent ?? "var(--text)";
    return (_jsxs("div", { style: {
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
        }, children: [_jsx("span", { style: { fontSize: 12, color: "var(--text-sub)" }, children: label }), _jsx("span", { style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    fontWeight: 600, color,
                }, children: display })] }));
}
function SectionCard({ title, tag, tagColor, children }) {
    return (_jsxs("div", { className: "glass", style: {
            padding: "20px 22px", borderRadius: 12,
            borderTop: `1px solid ${tagColor}44`,
        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }, children: [_jsx("span", { style: {
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                            letterSpacing: "0.12em", color: tagColor,
                            background: `${tagColor}15`, border: `1px solid ${tagColor}30`,
                            borderRadius: 4, padding: "3px 8px", textTransform: "uppercase",
                        }, children: tag }), _jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text)" }, children: title })] }), children] }));
}
const GUARD_DESCRIPTIONS = {
    maxSolPerTrade: "Maximum SOL allowed in a single trade",
    maxPositionPercent: "Max % of wallet in one token position",
    slippageBps: "Slippage tolerance in basis points (1bps = 0.01%)",
    minLiquidityUsd: "Minimum pool liquidity required to enter",
    cooldownSeconds: "Lock-out seconds between trades on same token",
    stopLossPercent: "Auto-sell trigger loss threshold (%)",
    takeProfitPercent: "Auto-sell trigger profit threshold (%)",
};
export default function ConfigPanel() {
    const [cfg, setCfg] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchConfig()
            .then((d) => { if (!d?.error)
            setCfg(d); })
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }, children: Array.from({ length: 4 }).map((_, i) => (_jsx("div", { className: "glass", style: { padding: 22, borderRadius: 12, height: 200 } }, i))) }));
    }
    if (!cfg) {
        return (_jsx("div", { style: { textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }, children: "Could not load config. Backend may be offline." }));
    }
    const { solana } = cfg;
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [_jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }, children: [
                    {
                        label: "AUTO-TRADING",
                        value: solana.autoTrading ? "ENABLED" : "DISABLED",
                        accent: solana.autoTrading ? "var(--cyan)" : "var(--danger)",
                    },
                    {
                        label: "INTERVAL",
                        value: `${solana.tradingIntervalMinutes ?? "--"} min`,
                        accent: "var(--text)",
                    },
                    {
                        label: "AI MODEL",
                        value: cfg.model,
                        accent: "var(--violet)",
                    },
                    {
                        label: "API PORT",
                        value: `:${cfg.webPort}`,
                        accent: "var(--text-sub)",
                    },
                ].map((card, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 }, children: _jsxs("div", { className: "glass", style: { padding: "18px 20px", borderRadius: 12 }, children: [_jsx("div", { className: "label", style: { marginBottom: 10 }, children: card.label }), _jsx("div", { style: {
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 22,
                                    fontWeight: 700, color: card.accent, lineHeight: 1,
                                }, children: card.value })] }) }, card.label))) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }, children: [_jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: _jsx(SectionCard, { title: "Guard Pipeline", tag: "RISK", tagColor: "var(--danger)", children: _jsx("div", { style: { display: "flex", flexDirection: "column" }, children: Object.entries(GUARD_DESCRIPTIONS).map(([key, desc]) => {
                                    const val = solana[key];
                                    if (val === undefined)
                                        return null;
                                    let display;
                                    if (key === "maxSolPerTrade")
                                        display = `${val} SOL`;
                                    else if (key === "maxPositionPercent")
                                        display = `${val}%`;
                                    else if (key === "slippageBps")
                                        display = `${val} bps (${(val / 100).toFixed(1)}%)`;
                                    else if (key === "minLiquidityUsd")
                                        display = `$${val.toLocaleString()}`;
                                    else if (key === "cooldownSeconds")
                                        display = `${val}s (${Math.round(val / 60)}min)`;
                                    else if (key === "stopLossPercent")
                                        display = `-${val}%`;
                                    else if (key === "takeProfitPercent")
                                        display = `+${val}%`;
                                    else
                                        display = String(val);
                                    return (_jsx("div", { children: _jsxs("div", { style: {
                                                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                                                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                                            }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: "var(--text-sub)", marginBottom: 2 }, children: key }), _jsx("div", { style: { fontSize: 10, color: "var(--text-muted)" }, children: desc })] }), _jsx("span", { style: {
                                                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                                                        fontWeight: 600, color: "var(--text)", flexShrink: 0, marginLeft: 12,
                                                    }, children: display })] }) }, key));
                                }) }) }) }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [_jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 }, children: _jsxs(SectionCard, { title: "Trading Settings", tag: "CONFIG", tagColor: "var(--cyan)", children: [_jsx(ConfigRow, { label: "Auto-Trading", value: solana.autoTrading ?? false }), _jsx(ConfigRow, { label: "Interval", value: `${solana.tradingIntervalMinutes ?? "--"} minutes` }), _jsx(ConfigRow, { label: "Slippage Tolerance", value: `${((solana.slippageBps ?? 0) / 100).toFixed(1)}%`, accent: "var(--warn)" }), _jsx(ConfigRow, { label: "Max Position Size", value: `${solana.maxPositionPercent ?? "--"}% of wallet` })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: _jsxs(SectionCard, { title: "AI + Network", tag: "SYSTEM", tagColor: "var(--violet)", children: [_jsx(ConfigRow, { label: "AI Model", value: cfg.model, accent: "var(--violet)" }), _jsx(ConfigRow, { label: "RPC Endpoint", value: solana.rpcUrl
                                                ? solana.rpcUrl.includes("mainnet") ? "mainnet-beta"
                                                    : solana.rpcUrl.includes("devnet") ? "devnet"
                                                        : "custom"
                                                : "--" }), _jsx(ConfigRow, { label: "Web Port", value: `:${cfg.webPort}` })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.25 }, children: _jsxs("div", { className: "glass", style: {
                                        padding: "16px 20px", borderRadius: 12,
                                        borderLeft: "2px solid rgba(0,229,255,0.4)",
                                    }, children: [_jsx("div", { style: { fontSize: 10, color: "var(--cyan)", letterSpacing: "0.08em",
                                                textTransform: "uppercase", marginBottom: 8 }, children: "CONFIG FILES" }), _jsxs("div", { style: { fontSize: 12, color: "var(--text-sub)", lineHeight: 1.7 }, children: ["All configuration is stored in ", _jsx("span", { style: { fontFamily: "'JetBrains Mono', monospace",
                                                        color: "var(--text)" }, children: "data/config/" }), " as JSON files. Private keys are never exposed via the API. Hot-reload is supported on most parameters."] }), _jsx("div", { style: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }, children: ["solana.json", "model.json", "connectors.json", "api-keys.json", "engine.json"].map((f) => (_jsx("span", { style: {
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                                    color: "var(--text-muted)", background: "rgba(255,255,255,0.04)",
                                                    border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px",
                                                }, children: f }, f))) })] }) })] })] })] }));
}
