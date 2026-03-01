import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchAnalytics } from "../api.js";
function PnlChart({ timeline }) {
    if (timeline.length < 2) {
        return (_jsx("div", { style: {
                height: 180, display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", fontSize: 12,
            }, children: "Not enough data for chart" }));
    }
    const W = 600;
    const H = 180;
    const PAD = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const values = timeline.map((d) => d.value);
    const minV = Math.min(...values, 0);
    const maxV = Math.max(...values, 0);
    const range = maxV - minV || 1;
    const x = (i) => PAD.left + (i / (timeline.length - 1)) * innerW;
    const y = (v) => PAD.top + innerH - ((v - minV) / range) * innerH;
    const pathD = timeline
        .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
        .join(" ");
    const areaD = `${pathD} L ${x(timeline.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left} ${(PAD.top + innerH).toFixed(1)} Z`;
    const zeroY = y(0);
    const lastVal = values[values.length - 1];
    const lineColor = lastVal >= 0 ? "var(--cyan)" : "var(--danger)";
    // Y axis labels
    const yLabels = [minV, (minV + maxV) / 2, maxV].map((v) => ({
        v, yp: y(v), label: `${v >= 0 ? "+" : ""}${v.toFixed(3)}`,
    }));
    return (_jsxs("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "100%", overflow: "visible" }, preserveAspectRatio: "none", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "pnlGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: lastVal >= 0 ? "rgba(0,229,255,0.3)" : "rgba(255,77,106,0.3)" }), _jsx("stop", { offset: "100%", stopColor: "rgba(0,0,0,0)" })] }), _jsx("clipPath", { id: "chartClip", children: _jsx("rect", { x: PAD.left, y: PAD.top, width: innerW, height: innerH }) })] }), zeroY >= PAD.top && zeroY <= PAD.top + innerH && (_jsx("line", { x1: PAD.left, y1: zeroY, x2: PAD.left + innerW, y2: zeroY, stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4,4" })), _jsx("path", { d: areaD, fill: "url(#pnlGrad)", clipPath: "url(#chartClip)" }), _jsx("path", { d: pathD, fill: "none", stroke: lineColor, strokeWidth: 1.5, clipPath: "url(#chartClip)" }), yLabels.map((l) => (_jsx("text", { x: PAD.left - 6, y: l.yp + 4, textAnchor: "end", fontSize: 9, fill: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", children: l.label }, l.label))), _jsx("circle", { cx: x(timeline.length - 1), cy: y(lastVal), r: 3, fill: lineColor, filter: "url(#glow)" })] }));
}
function StatCard({ label, value, sub, accent }) {
    return (_jsxs("div", { className: "glass", style: { padding: "18px 20px", borderRadius: 12 }, children: [_jsx("div", { className: "label", style: { marginBottom: 10 }, children: label }), _jsx("div", { style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700,
                    color: accent ?? "var(--text)", lineHeight: 1, marginBottom: 4,
                }, children: value }), sub && (_jsx("div", { style: { fontSize: 11, color: "var(--text-sub)" }, children: sub }))] }));
}
export default function AnalyticsPanel({ trades }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            try {
                const d = await fetchAnalytics();
                if (!d.error)
                    setAnalytics(d);
            }
            finally {
                setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, []);
    // Trade distribution by symbol (from local trades prop for speed)
    const bySym = {};
    trades.forEach((t) => {
        bySym[t.symbol] = (bySym[t.symbol] ?? 0) + 1;
    });
    const topSyms = Object.entries(bySym)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    const totalTradesLocal = trades.length;
    const maxCount = topSyms[0]?.[1] ?? 1;
    // Recent activity: last 7 unique days
    const last7 = {};
    trades.slice(0, 100).forEach((t) => {
        const d = new Date(t.timestamp).toLocaleDateString([], { weekday: "short" });
        last7[d] = (last7[d] ?? 0) + 1;
    });
    const days = Object.entries(last7).slice(0, 7).reverse();
    const maxDay = Math.max(...days.map((d) => d[1]), 1);
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [_jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }, children: loading ? (Array.from({ length: 4 }).map((_, i) => (_jsx("div", { className: "glass", style: { padding: 20, borderRadius: 12, height: 90 } }, i)))) : analytics ? (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0 }, children: _jsx(StatCard, { label: "REALIZED PNL", value: `${analytics.totalPnl >= 0 ? "+" : ""}${analytics.totalPnl.toFixed(4)}`, sub: "SOL net", accent: analytics.totalPnl >= 0 ? "var(--cyan)" : "var(--danger)" }) }), _jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.07 }, children: _jsx(StatCard, { label: "WIN RATE", value: `${analytics.winRate}%`, sub: `${analytics.totalSells} sells / ${analytics.totalBuys} buys`, accent: analytics.winRate >= 50 ? "var(--cyan)" : "var(--warn)" }) }), _jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.14 }, children: _jsx(StatCard, { label: "SOL DEPLOYED", value: analytics.solSpent.toFixed(4), sub: "total SOL spent on buys", accent: "var(--text)" }) }), _jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.21 }, children: _jsx(StatCard, { label: "SOL RETURNED", value: analytics.solReceived.toFixed(4), sub: "total SOL from sells", accent: "var(--violet)" }) })] })) : (_jsx("div", { style: { gridColumn: "1/-1", color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: 24 }, children: "No analytics data yet. Data will appear after the first trades." })) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: _jsxs("div", { className: "glass", style: { padding: 20, borderRadius: 12 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [_jsx("div", { className: "label", children: "CUMULATIVE PNL (SOL)" }), analytics && (_jsxs("span", { style: {
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                                        color: analytics.totalPnl >= 0 ? "var(--cyan)" : "var(--danger)",
                                    }, children: [analytics.totalPnl >= 0 ? "+" : "", analytics.totalPnl.toFixed(6), " SOL"] }))] }), _jsx("div", { style: { height: 180 }, children: _jsx(PnlChart, { timeline: analytics?.timeline ?? [] }) })] }) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }, children: [_jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 }, children: _jsxs("div", { className: "glass", style: { padding: 20, borderRadius: 12 }, children: [_jsxs("div", { className: "label", style: { marginBottom: 16 }, children: ["TRADES BY TOKEN (top ", topSyms.length, ")"] }), topSyms.length === 0 ? (_jsx("div", { style: { color: "var(--text-muted)", fontSize: 12, paddingTop: 20, textAlign: "center" }, children: "No trade data" })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: topSyms.map(([sym, count]) => (_jsxs("div", { children: [_jsxs("div", { style: {
                                                    display: "flex", justifyContent: "space-between",
                                                    marginBottom: 5, alignItems: "center",
                                                }, children: [_jsx("span", { style: {
                                                            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                                                            color: "var(--text)",
                                                        }, children: sym }), _jsxs("span", { style: {
                                                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                                            color: "var(--cyan)",
                                                        }, children: [count, " trade", count !== 1 ? "s" : ""] })] }), _jsx("div", { style: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }, children: _jsx("div", { style: {
                                                        height: "100%", borderRadius: 2,
                                                        width: `${(count / maxCount) * 100}%`,
                                                        background: "linear-gradient(90deg, var(--cyan), var(--violet))",
                                                        transition: "width 0.5s ease",
                                                    } }) })] }, sym))) }))] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: _jsxs("div", { className: "glass", style: { padding: 20, borderRadius: 12 }, children: [_jsx("div", { className: "label", style: { marginBottom: 16 }, children: "DAILY TRADE ACTIVITY" }), days.length === 0 ? (_jsx("div", { style: { color: "var(--text-muted)", fontSize: 12, paddingTop: 20, textAlign: "center" }, children: "No activity data" })) : (_jsx("div", { style: {
                                        display: "flex", alignItems: "flex-end", gap: 8,
                                        height: 100, padding: "0 4px",
                                    }, children: days.map(([day, count]) => (_jsxs("div", { style: {
                                            flex: 1, display: "flex", flexDirection: "column",
                                            alignItems: "center", gap: 6,
                                        }, children: [_jsx("div", { style: {
                                                    width: "100%", borderRadius: 3,
                                                    height: `${Math.max(4, (count / maxDay) * 80)}px`,
                                                    background: "linear-gradient(180deg, var(--cyan), rgba(0,229,255,0.3))",
                                                    transition: "height 0.5s ease",
                                                } }), _jsx("span", { style: {
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                                                    color: "var(--text-muted)",
                                                }, children: day })] }, day))) })), days.length > 0 && (_jsxs("div", { style: {
                                        marginTop: 12, paddingTop: 12,
                                        borderTop: "1px solid var(--border)",
                                        fontSize: 11, color: "var(--text-sub)",
                                    }, children: [totalTradesLocal, " total trades in history"] }))] }) })] })] }));
}
