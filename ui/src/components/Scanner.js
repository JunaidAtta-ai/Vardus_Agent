import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from "framer-motion";
function fmt(n) {
    if (!n)
        return "";
    if (n >= 1000000)
        return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
}
function ChangeBadge({ v }) {
    if (!v)
        return _jsx("span", { style: { color: "var(--text-muted)" } });
    const pos = v >= 0;
    return (_jsxs("span", { style: {
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 700,
            color: pos ? "rgba(74,222,128,0.95)" : "rgba(255,77,106,0.9)",
            textShadow: pos ? "0 0 10px rgba(74,222,128,0.35)" : "0 0 10px rgba(255,77,106,0.3)",
        }, children: [pos ? "+" : "", v.toFixed(1), "%"] }));
}
function LiqBar({ value, max }) {
    const pct = value ? Math.min(100, (value / max) * 100) : 0;
    return (_jsx("div", { className: "progress-bar", style: { marginTop: 5, width: "100%" }, children: _jsx("div", { className: "progress-fill", style: {
                width: `${pct}%`,
                background: "linear-gradient(90deg, rgba(0,229,255,0.5), rgba(124,58,237,0.5))",
            } }) }));
}
function ConfMini({ score }) {
    const r = 8;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return (_jsxs("svg", { width: 20, height: 20, style: { transform: "rotate(-90deg)", flexShrink: 0 }, children: [_jsx("circle", { cx: 10, cy: 10, r: r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: 2 }), _jsx("circle", { cx: 10, cy: 10, r: r, fill: "none", stroke: "var(--cyan)", strokeWidth: 2, strokeDasharray: c, strokeDashoffset: offset, strokeLinecap: "round", style: { filter: "drop-shadow(0 0 3px rgba(0,229,255,0.5))" } })] }));
}
function ScanHeader({ title, sub, loading }) {
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("span", { style: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }, children: title }), _jsx("span", { style: {
                            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                            color: "var(--cyan)", background: "rgba(0,229,255,0.07)",
                            padding: "2px 7px", borderRadius: 3, border: "1px solid rgba(0,229,255,0.15)",
                            letterSpacing: "0.1em",
                        }, children: sub })] }), loading && (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("div", { className: "orb orb-cyan", style: { width: 5, height: 5 } }), _jsxs("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }, children: ["scanning", _jsx("span", { className: "scan-dots" })] })] }))] }));
}
export default function Scanner({ trending, pumpfun }) {
    const maxLiq = Math.max(...trending.map(t => t.liquidityUsd ?? 0), 1);
    return (_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }, children: [_jsxs("div", { className: `glass${trending.length === 0 ? " scan-sweep" : ""}`, style: { borderRadius: 16, padding: "22px 24px" }, children: [_jsx(ScanHeader, { title: "DexScreener", sub: "TRENDING", loading: trending.length === 0 }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 5 }, children: trending.length === 0 ? (_jsxs("div", { style: { padding: "40px 0", textAlign: "center" }, children: [_jsxs("div", { className: "label", style: { marginBottom: 16 }, children: ["Scanning DexScreener", _jsx("span", { className: "scan-dots" })] }), _jsx(motion.div, { style: { display: "flex", gap: 4, justifyContent: "center" }, children: [0, 1, 2, 3, 4].map(i => (_jsx(motion.div, { animate: { height: [4, 18, 4], opacity: [0.3, 0.9, 0.3] }, transition: { duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }, style: { width: 3, borderRadius: 99, background: "var(--cyan)" } }, i))) })] })) : (_jsx(AnimatePresence, { children: trending.slice(0, 15).map((t, i) => {
                                const change = t.priceChange24h ?? t.priceChange1h ?? 0;
                                const confScore = Math.min(95, 30 + (t.liquidityUsd ?? 0) / 50000 * 40 + Math.abs(change) * 0.5);
                                return (_jsx(motion.div, { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }, className: "shimmer row-hover", style: {
                                        padding: "9px 11px", borderRadius: 9,
                                        background: "rgba(255,255,255,0.016)",
                                        border: "1px solid var(--border)",
                                        cursor: "pointer",
                                    }, whileHover: { background: "rgba(0,229,255,0.028)", borderColor: "rgba(0,229,255,0.14)" }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }, children: [_jsx("span", { style: { fontWeight: 700, fontSize: 12.5, letterSpacing: "-0.01em" }, children: t.symbol ?? "?" }), _jsx("span", { style: { color: "var(--text-muted)", fontSize: 11 }, children: "/SOL" })] }), _jsx(LiqBar, { value: t.liquidityUsd, max: maxLiq }), _jsxs("div", { className: "label", style: { marginTop: 4 }, children: [fmt(t.liquidityUsd), " liq"] })] }), _jsxs("div", { style: { textAlign: "right", paddingLeft: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx(ConfMini, { score: Math.round(confScore) }), _jsx(ChangeBadge, { v: change })] }), _jsxs("div", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--text-sub)" }, children: ["$", t.priceUsd ? Number(t.priceUsd).toFixed(7) : ""] })] })] }) }, t.mint));
                            }) })) })] }), _jsxs("div", { className: `glass${pumpfun.length === 0 ? " scan-sweep" : ""}`, style: { borderRadius: 16, padding: "22px 24px" }, children: [_jsx(ScanHeader, { title: "Pump.fun", sub: "NEW", loading: pumpfun.length === 0 }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 5 }, children: pumpfun.length === 0 ? (_jsxs("div", { style: { padding: "40px 0", textAlign: "center" }, children: [_jsxs("div", { className: "label", style: { marginBottom: 16 }, children: ["Scanning Pump.fun", _jsx("span", { className: "scan-dots" })] }), _jsx(motion.div, { style: { display: "flex", gap: 4, justifyContent: "center" }, children: [0, 1, 2, 3, 4].map(i => (_jsx(motion.div, { animate: { height: [4, 18, 4], opacity: [0.3, 0.9, 0.3] }, transition: { duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }, style: { width: 3, borderRadius: 99, background: "rgba(124,58,237,0.8)" } }, i))) })] })) : (_jsx(AnimatePresence, { children: pumpfun.slice(0, 15).map((p, i) => {
                                const mc = p.marketCapUsd ?? 0;
                                const confScore = Math.min(90, 25 + (mc / 5000) * 30);
                                return (_jsx(motion.div, { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }, className: "shimmer row-hover", style: {
                                        padding: "9px 11px", borderRadius: 9,
                                        background: "rgba(255,255,255,0.016)",
                                        border: "1px solid var(--border)",
                                    }, whileHover: { background: "rgba(124,58,237,0.028)", borderColor: "rgba(124,58,237,0.14)" }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 12.5, marginBottom: 2, letterSpacing: "-0.01em" }, children: p.name ?? "Unknown" }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("span", { style: { fontSize: 10, fontFamily: "'JetBrains Mono', monospace', color: 'var(--text-muted)" }, children: p.symbol }), _jsxs("span", { style: { fontSize: 10, color: "var(--text-muted)" }, children: ["mc ", fmt(mc)] })] })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }, children: _jsx(ConfMini, { score: Math.round(confScore) }) })] }) }, p.mint));
                            }) })) })] })] }));
}
