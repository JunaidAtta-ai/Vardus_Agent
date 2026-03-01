import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const TYPE_MAP = {
    "trading_loop.start": { tag: "SCAN", cls: "tag-scan" },
    "trading_loop.end": { tag: "INFO", cls: "tag-info" },
    "trade.pushed": { tag: "EXECUTE", cls: "tag-execute" },
    "guard.blocked": { tag: "RISK", cls: "tag-risk" },
    "signal.found": { tag: "SIGNAL", cls: "tag-signal" },
    "error": { tag: "ERROR", cls: "tag-error" },
    "heartbeat": { tag: "INFO", cls: "tag-info" },
};
const FILTERS = ["ALL", "SCAN", "SIGNAL", "EXECUTE", "RISK", "ERROR"];
function getTag(type) {
    if (TYPE_MAP[type])
        return TYPE_MAP[type];
    if (type.includes("trade"))
        return { tag: "EXECUTE", cls: "tag-execute" };
    if (type.includes("scan"))
        return { tag: "SCAN", cls: "tag-scan" };
    if (type.includes("signal"))
        return { tag: "SIGNAL", cls: "tag-signal" };
    if (type.includes("risk") || type.includes("guard"))
        return { tag: "RISK", cls: "tag-risk" };
    if (type.includes("error"))
        return { tag: "ERROR", cls: "tag-error" };
    return { tag: "INFO", cls: "tag-info" };
}
function ts(timestamp) {
    return new Date(timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export default function EventLogPanel({ events }) {
    const [filter, setFilter] = useState("ALL");
    const sorted = [...events].sort((a, b) => b.ts - a.ts);
    const filtered = filter === "ALL" ? sorted : sorted.filter(ev => getTag(ev.type).tag === filter);
    const logRef = useRef(null);
    /* Auto-scroll to top when new events arrive */
    useEffect(() => {
        if (logRef.current)
            logRef.current.scrollTop = 0;
    }, [events.length]);
    return (_jsxs("div", { className: "glass", style: { borderRadius: 16, overflow: "hidden" }, children: [_jsxs("div", { style: {
                    padding: "10px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(0,0,0,0.28)",
                }, children: [_jsxs("div", { style: { display: "flex", gap: 5 }, children: [_jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(255,77,106,0.55)", boxShadow: "0 0 6px rgba(255,77,106,0.3)" } }), _jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(255,170,0,0.55)", boxShadow: "0 0 6px rgba(255,170,0,0.3)" } }), _jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(74,222,128,0.55)", boxShadow: "0 0 6px rgba(74,222,128,0.3)" } })] }), _jsx("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--text-muted)", marginLeft: 6, letterSpacing: "0.06em" }, children: "system-log" }), _jsxs("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }, children: ["[", sorted.length, "]"] }), _jsxs("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("div", { className: "orb orb-cyan", style: { width: 5, height: 5 } }), _jsx("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--cyan)", letterSpacing: "0.08em" }, children: "LIVE" })] })] }), _jsxs("div", { style: {
                    padding: "8px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(0,0,0,0.18)",
                    position: "sticky", top: 0, zIndex: 2,
                }, children: [_jsx("span", { className: "label", style: { marginRight: 6 }, children: "Filter" }), FILTERS.map((f) => (_jsx("button", { onClick: () => setFilter(f), style: {
                            padding: "2px 9px", borderRadius: 4, cursor: "pointer",
                            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.1em", fontWeight: 600,
                            transition: "all 0.15s ease",
                            background: filter === f ? "rgba(0,229,255,0.1)" : "transparent",
                            border: filter === f ? "1px solid rgba(0,229,255,0.28)" : "1px solid transparent",
                            color: filter === f ? "var(--cyan)" : "var(--text-muted)",
                        }, children: f }, f)))] }), _jsx("div", { ref: logRef, className: "terminal", style: { padding: "14px 20px", maxHeight: 560, overflowY: "auto" }, children: filtered.length === 0 ? (_jsx("div", { style: { color: "var(--text-muted)", paddingTop: 24 }, children: events.length === 0
                        ? _jsxs(_Fragment, { children: ["Waiting for events", _jsx("span", { className: "scan-dots" }), _jsx("span", { className: "cursor-blink" })] })
                        : _jsxs("span", { children: ["No ", filter, " events"] }) })) : (_jsx(AnimatePresence, { initial: false, children: filtered.map((ev) => {
                        const { tag, cls } = getTag(ev.type);
                        let detail = "";
                        const p = ev.payload;
                        if (p) {
                            if (typeof p === "string")
                                detail = p;
                            else if (p.message)
                                detail = p.message;
                            else if (p.reason)
                                detail = p.reason;
                            else if (p.mint)
                                detail = `mint=${p.mint}`;
                            else
                                detail = JSON.stringify(p).slice(0, 120);
                        }
                        return (_jsxs(motion.div, { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.22 }, className: "log-row", style: { display: "flex", gap: 10, marginBottom: 2, alignItems: "baseline" }, children: [_jsx("span", { style: { color: "var(--text-muted)", flexShrink: 0, fontSize: 10.5, letterSpacing: "0.04em" }, children: ts(ev.ts) }), _jsx("span", { className: `tag ${cls}`, style: { flexShrink: 0 }, children: tag }), _jsxs("span", { style: { fontSize: 11, minWidth: 0, overflow: "hidden" }, children: [_jsx("span", { style: { color: "rgba(255,255,255,0.45)" }, children: ev.type }), detail && (_jsx("span", { style: { marginLeft: 8, color: "var(--text-muted)", fontStyle: "italic" }, children: detail }))] })] }, `${ev.type}-${ev.ts}`));
                    }) })) })] }));
}
