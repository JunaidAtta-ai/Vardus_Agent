import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBrain } from "../api.js";
const EMOTION_COLORS = {
    confident: "var(--cyan)",
    cautious: "var(--warn)",
    anxious: "var(--danger)",
    neutral: "var(--text-sub)",
    bullish: "#4ade80",
    bearish: "var(--danger)",
    excited: "var(--cyan)",
    uncertain: "var(--warn)",
};
function emotionColor(e) {
    return EMOTION_COLORS[e.toLowerCase()] ?? "var(--text-sub)";
}
function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDate(ts) {
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function SentimentBar({ value }) {
    const pct = Math.round((value + 1) * 50);
    const color = value > 0.2 ? "var(--cyan)" : value < -0.2 ? "var(--danger)" : "var(--warn)";
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 6 }, children: [_jsx("div", { style: { flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }, children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${pct}%` }, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }, style: { height: "100%", background: color, borderRadius: 99, boxShadow: `0 0 6px ${color}` } }) }), _jsxs("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color, minWidth: 38, textAlign: "right" }, children: [value >= 0 ? "+" : "", value.toFixed(2)] })] }));
}
/* Mini spark line for sentiment history */
function SentimentSpark({ emotions }) {
    const last10 = emotions.slice(0, 10).reverse();
    if (last10.length < 2)
        return null;
    const W = 160, H = 36;
    const xs = last10.map((_, i) => (i / (last10.length - 1)) * W);
    const ys = last10.map(e => H - ((e.sentiment + 1) / 2) * H);
    const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    return (_jsxs("svg", { width: W, height: H, style: { overflow: "visible" }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "sparkGrad", x1: "0", y1: "0", x2: "1", y2: "0", children: [_jsx("stop", { offset: "0%", stopColor: "rgba(0,229,255,0.1)" }), _jsx("stop", { offset: "100%", stopColor: "rgba(0,229,255,0.5)" })] }) }), _jsx("path", { d: d, fill: "none", stroke: "url(#sparkGrad)", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }), xs.map((x, i) => (_jsx("circle", { cx: x, cy: ys[i], r: 2, fill: "var(--cyan)", opacity: 0.6 }, i)))] }));
}
export default function BrainPanel() {
    const [brain, setBrain] = useState({ memory: null, emotions: [] });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchBrain();
                if (!data.error)
                    setBrain(data);
            }
            finally {
                setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 10000);
        return () => clearInterval(t);
    }, []);
    const latestEmotion = brain.emotions[0];
    const avgSentiment = brain.emotions.length > 0
        ? brain.emotions.slice(0, 5).reduce((s, e) => s + e.sentiment, 0) / Math.min(5, brain.emotions.length)
        : 0;
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 18 }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }, children: [_jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.04 }, children: _jsxs("div", { className: "glass", style: { padding: 22, borderRadius: 14, position: "relative", overflow: "hidden", height: "100%" }, children: [_jsx("div", { className: "neural-bg" }), _jsx("div", { className: "label", style: { marginBottom: 14 }, children: "CURRENT STATE" }), latestEmotion ? (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, style: {
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800,
                                                color: emotionColor(latestEmotion.emotion), textTransform: "capitalize", marginBottom: 2,
                                                textShadow: `0 0 24px ${emotionColor(latestEmotion.emotion)}`,
                                            }, children: latestEmotion.emotion }, latestEmotion.emotion), _jsx(SentimentBar, { value: latestEmotion.sentiment }), _jsx("div", { style: { fontSize: 11, color: "var(--text-sub)", marginTop: 12, lineHeight: 1.55 }, children: latestEmotion.rationale }), _jsx("div", { className: "label", style: { marginTop: 10 }, children: fmtDate(latestEmotion.timestamp) })] })) : (_jsx("div", { style: { color: "var(--text-muted)", fontSize: 12 }, children: loading ? _jsxs(_Fragment, { children: ["Loading", _jsx("span", { className: "scan-dots" })] }) : "Awaiting first trading cycle" }))] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.09 }, children: _jsxs("div", { className: "glass", style: { padding: 22, borderRadius: 14, height: "100%" }, children: [_jsx("div", { className: "label", style: { marginBottom: 14 }, children: "AVG SENTIMENT (5)" }), _jsxs("div", { style: {
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: 42, fontWeight: 800, lineHeight: 1,
                                        color: avgSentiment > 0.1 ? "var(--cyan)" : avgSentiment < -0.1 ? "var(--danger)" : "var(--warn)",
                                        marginBottom: 8,
                                    }, children: [avgSentiment >= 0 ? "+" : "", avgSentiment.toFixed(2)] }), _jsx(SentimentBar, { value: avgSentiment }), _jsx("div", { style: { marginTop: 16 }, children: _jsx(SentimentSpark, { emotions: brain.emotions }) }), _jsx("div", { style: { fontSize: 11, color: "var(--text-sub)", marginTop: 10 }, children: avgSentiment > 0.3 ? "Bullish outlook" : avgSentiment < -0.3 ? "Bearish / risk-off" : "Neutral stance" })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.14 }, children: _jsxs("div", { className: "glass", style: { padding: 22, borderRadius: 14, height: "100%" }, children: [_jsx("div", { className: "label", style: { marginBottom: 14 }, children: "MEMORY" }), _jsx("div", { style: {
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800,
                                        color: "var(--cyan)", marginBottom: 6,
                                        textShadow: "0 0 20px rgba(0,229,255,0.35)",
                                    }, children: brain.memory?.lastUpdated ? fmtTime(brain.memory.lastUpdated) : "--:--:--" }), _jsx("div", { style: { fontSize: 11, color: "var(--text-sub)", marginBottom: 12 }, children: "Last memory write" }), _jsxs("div", { style: {
                                        fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                                        color: brain.memory?.frontalLobe ? "var(--cyan)" : "var(--text-muted)",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }, children: [_jsx("div", { className: `orb ${brain.memory?.frontalLobe ? "orb-cyan" : "orb-dim"}`, style: { width: 5, height: 5 } }), brain.memory?.frontalLobe ? "Active context" : "Empty frontal lobe"] })] }) })] }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.19 }, children: _jsxs("div", { className: "glass", style: { padding: 22, borderRadius: 14 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("div", { className: "label", children: "FRONTAL LOBE  WORKING MEMORY" }), _jsx("div", { className: `orb ${brain.memory?.frontalLobe ? "orb-cyan" : "orb-dim"}`, style: { width: 5, height: 5 } })] }), brain.memory?.lastUpdated && (_jsx("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }, children: fmtDate(brain.memory.lastUpdated) }))] }), _jsxs("div", { style: {
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
                                color: "var(--text-sub)", lineHeight: 1.8,
                                background: "rgba(0,0,0,0.22)", borderRadius: 9,
                                padding: "16px 18px", minHeight: 72,
                                border: "1px solid var(--border)",
                                whiteSpace: "pre-wrap",
                            }, children: [brain.memory?.frontalLobe || (_jsxs("span", { style: { color: "var(--text-muted)", fontStyle: "italic" }, children: ["No memory recorded yet", _jsx("span", { className: "scan-dots" }), "\n", "The agent will populate this after the first trading cycle."] })), _jsx("span", { className: "cursor-blink" })] })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.24 }, children: _jsxs("div", { className: "glass", style: { padding: 22, borderRadius: 14 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, children: [_jsx("div", { className: "label", children: "EMOTION TIMELINE" }), _jsxs("span", { style: { fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }, children: [brain.emotions.length, " entries"] })] }), _jsx("div", { style: { display: "flex", flexDirection: "column" }, children: _jsx(AnimatePresence, { children: brain.emotions.length === 0 ? (_jsx("div", { style: { color: "var(--text-muted)", fontSize: 12, padding: "20px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }, children: loading ? _jsxs(_Fragment, { children: ["Loading", _jsx("span", { className: "scan-dots" })] }) : "No emotion entries yet. Logs appear during trading cycles." })) : (brain.emotions.map((entry, i) => (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.04 }, className: "log-row", style: {
                                        display: "grid",
                                        gridTemplateColumns: "90px 100px 140px 1fr",
                                        gap: 14,
                                        padding: "10px 8px",
                                        borderBottom: i < brain.emotions.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                                        alignItems: "center",
                                    }, children: [_jsx("div", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }, children: fmtDate(entry.timestamp) }), _jsx("span", { style: {
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                                color: emotionColor(entry.emotion),
                                                background: `${emotionColor(entry.emotion)}14`,
                                                border: `1px solid ${emotionColor(entry.emotion)}28`,
                                                borderRadius: 4, padding: "2px 8px",
                                                textTransform: "capitalize",
                                                textShadow: `0 0 10px ${emotionColor(entry.emotion)}`,
                                                display: "inline-block",
                                            }, children: entry.emotion }), _jsx(SentimentBar, { value: entry.sentiment }), _jsx("div", { style: { fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.5 }, children: entry.rationale })] }, entry.timestamp)))) }) })] }) })] }));
}
