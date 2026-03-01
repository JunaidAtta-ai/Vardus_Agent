import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChat } from "../api.js";
const SESSION_ID = "web-default";
function TaggedLine({ text }) {
    const tagMap = {
        SCAN: "tag-scan", SIGNAL: "tag-signal", EXECUTE: "tag-execute",
        RISK: "tag-risk", ERROR: "tag-error", INFO: "tag-info",
    };
    const match = text.match(/^\[(SCAN|SIGNAL|EXECUTE|RISK|ERROR|INFO)\](.*)/);
    if (match) {
        const [, tag, rest] = match;
        return (_jsxs("span", { children: [_jsx("span", { className: `tag ${tagMap[tag] ?? "tag-info"}`, children: tag }), _jsx("span", { style: { color: "var(--text-sub)", marginLeft: 6 }, children: rest })] }));
    }
    return _jsx("span", { style: { color: "var(--text-sub)" }, children: text });
}
export default function ChatPanel({ agentEvents }) {
    const [messages, setMessages] = useState([{
            id: "init",
            role: "system",
            text: "[INFO] Terminal ready. Awaiting agent connection...",
            ts: Date.now(),
        }]);
    const [input, setInput] = useState("");
    const [thinking, setThinking] = useState(false);
    const bottomRef = useRef(null);
    const prevEvLen = useRef(0);
    // Sync agent trading loop events as system messages
    useEffect(() => {
        if (agentEvents.length <= prevEvLen.current)
            return;
        const newEvs = agentEvents.slice(0, agentEvents.length - prevEvLen.current);
        prevEvLen.current = agentEvents.length;
        const systemMsgs = newEvs
            .filter((e) => ["trading_loop.start", "trading_loop.end", "trade.pushed", "guard.blocked", "error"].includes(e.type))
            .map((e) => ({
            id: `ev-${e.ts}-${Math.random()}`,
            role: "system",
            text: e.type === "trading_loop.start" ? "[SCAN] Autonomous trading cycle started..."
                : e.type === "trading_loop.end" ? "[INFO] Cycle complete"
                    : e.type === "trade.pushed" ? `[EXECUTE] Trade executed - ${JSON.stringify(e.payload ?? {}).slice(0, 80)}`
                        : e.type === "guard.blocked" ? `[RISK] Guard blocked: ${e.payload?.reason ?? "threshold exceeded"}`
                            : `[ERROR] ${e.payload?.message ?? "Unknown error"}`,
            ts: e.ts,
        }));
        if (systemMsgs.length)
            setMessages((p) => [...p, ...systemMsgs].slice(-200));
    }, [agentEvents]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const send = async () => {
        const text = input.trim();
        if (!text)
            return;
        setInput("");
        const userMsg = { id: `u-${Date.now()}`, role: "user", text, ts: Date.now() };
        setMessages((p) => [...p, userMsg]);
        setThinking(true);
        try {
            const res = await sendChat(text, SESSION_ID);
            const agentMsg = { id: `a-${Date.now()}`, role: "agent", text: res.reply ?? "...", ts: Date.now() };
            setMessages((p) => [...p, agentMsg]);
        }
        catch {
            setMessages((p) => [...p, { id: `err-${Date.now()}`, role: "system", text: "[ERROR] Failed to reach agent", ts: Date.now() }]);
        }
        finally {
            setThinking(false);
        }
    };
    return (_jsxs("div", { className: "glass", style: { borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }, children: [_jsxs("div", { style: {
                    padding: "10px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(0,0,0,0.2)",
                }, children: [_jsxs("div", { style: { display: "flex", gap: 5 }, children: [_jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(255,77,106,0.6)" } }), _jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(255,170,0,0.6)" } }), _jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "rgba(74,222,128,0.6)" } })] }), _jsxs("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-sub)", marginLeft: 8 }, children: ["agent-terminal / session/", SESSION_ID] }), thinking && (_jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, style: { marginLeft: "auto", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--cyan)" }, children: _jsx("span", { className: "scan-dots", children: "thinking" }) }))] }), _jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "16px 20px", minHeight: 260, maxHeight: 360 }, className: "terminal", children: [_jsx(AnimatePresence, { initial: false, children: messages.map((m) => (_jsx(motion.div, { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, style: { marginBottom: 4 }, children: m.role === "user" ? (_jsxs("span", { children: [_jsx("span", { style: { color: "var(--cyan)", marginRight: 8 }, children: '>' }), _jsx("span", { style: { color: "var(--text)" }, children: m.text })] })) : m.role === "agent" ? (_jsxs("span", { children: [_jsx("span", { style: { color: "rgba(168,85,247,0.8)", marginRight: 8 }, children: "agent:" }), _jsx("span", { style: { color: "var(--text)" }, children: m.text })] })) : (_jsx(TaggedLine, { text: m.text })) }, m.id))) }), thinking && (_jsx("div", { style: { color: "var(--cyan)", fontSize: 12 }, children: _jsx("span", { className: "scan-dots", children: '> ' }) })), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { style: {
                    borderTop: "1px solid var(--border)",
                    padding: "12px 20px",
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(0,0,0,0.15)",
                }, children: [_jsx("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--cyan)" }, children: '>' }), _jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && send(), placeholder: "Ask the agent anything...", style: {
                            flex: 1, background: "transparent", border: "none", outline: "none",
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                            color: "var(--text)", caretColor: "var(--cyan)",
                        } }), _jsx("div", { className: "cursor-blink", style: { opacity: input ? 0 : 1 } }), _jsx("button", { onClick: send, className: "btn-cyan", style: { padding: "5px 14px", borderRadius: 6, cursor: "pointer" }, children: "SEND" })] })] }));
}
