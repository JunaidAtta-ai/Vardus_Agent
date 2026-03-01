import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChat } from "../api.js";
import type { AppEvent } from "../types.js";

interface Props {
  agentEvents: AppEvent[];
}

const SESSION_ID = "web-default";

interface Message {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  ts: number;
}

function TaggedLine({ text }: { text: string }) {
  const tagMap: Record<string, string> = {
    SCAN: "tag-scan", SIGNAL: "tag-signal", EXECUTE: "tag-execute",
    RISK: "tag-risk", ERROR: "tag-error", INFO: "tag-info",
  };
  const match = text.match(/^\[(SCAN|SIGNAL|EXECUTE|RISK|ERROR|INFO)\](.*)/);
  if (match) {
    const [, tag, rest] = match;
    return (
      <span>
        <span className={`tag ${tagMap[tag] ?? "tag-info"}`}>{tag}</span>
        <span style={{ color: "var(--text-sub)", marginLeft: 6 }}>{rest}</span>
      </span>
    );
  }
  return <span style={{ color: "var(--text-sub)" }}>{text}</span>;
}

export default function ChatPanel({ agentEvents }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    id: "init",
    role: "system",
    text: "[INFO] Terminal ready. Awaiting agent connection...",
    ts: Date.now(),
  }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevEvLen = useRef(0);

  // Sync agent trading loop events as system messages
  useEffect(() => {
    if (agentEvents.length <= prevEvLen.current) return;
    const newEvs = agentEvents.slice(0, agentEvents.length - prevEvLen.current);
    prevEvLen.current = agentEvents.length;
    const systemMsgs: Message[] = newEvs
      .filter((e) => ["trading_loop.start", "trading_loop.end", "trade.pushed", "guard.blocked", "error"].includes(e.type))
      .map((e) => ({
        id: `ev-${e.ts}-${Math.random()}`,
        role: "system" as const,
        text: e.type === "trading_loop.start" ? "[SCAN] Autonomous trading cycle started..."
          : e.type === "trading_loop.end" ? "[INFO] Cycle complete"
          : e.type === "trade.pushed" ? `[EXECUTE] Trade executed - ${JSON.stringify((e.payload as Record<string, unknown>) ?? {}).slice(0, 80)}`
          : e.type === "guard.blocked" ? `[RISK] Guard blocked: ${((e.payload as Record<string, unknown>)?.reason as string) ?? "threshold exceeded"}`
          : `[ERROR] ${((e.payload as Record<string, unknown>)?.message as string) ?? "Unknown error"}`,
        ts: e.ts,
      }));
    if (systemMsgs.length) setMessages((p) => [...p, ...systemMsgs].slice(-200));
  }, [agentEvents]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text, ts: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setThinking(true);
    try {
      const res = await sendChat(text, SESSION_ID);
      const agentMsg: Message = { id: `a-${Date.now()}`, role: "agent", text: res.reply ?? "...", ts: Date.now() };
      setMessages((p) => [...p, agentMsg]);
    } catch {
      setMessages((p) => [...p, { id: `err-${Date.now()}`, role: "system", text: "[ERROR] Failed to reach agent", ts: Date.now() }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="glass" style={{ borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Terminal header bar */}
      <div style={{
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,77,106,0.6)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,170,0,0.6)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(74,222,128,0.6)" }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-sub)", marginLeft: 8 }}>
          agent-terminal / session/{SESSION_ID}
        </span>
        {thinking && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginLeft: "auto", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--cyan)" }}
          >
            <span className="scan-dots">thinking</span>
          </motion.span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", minHeight: 260, maxHeight: 360 }} className="terminal">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 4 }}
            >
              {m.role === "user" ? (
                <span>
                  <span style={{ color: "var(--cyan)", marginRight: 8 }}>{'>'}</span>
                  <span style={{ color: "var(--text)" }}>{m.text}</span>
                </span>
              ) : m.role === "agent" ? (
                <span>
                  <span style={{ color: "rgba(168,85,247,0.8)", marginRight: 8 }}>agent:</span>
                  <span style={{ color: "var(--text)" }}>{m.text}</span>
                </span>
              ) : (
                <TaggedLine text={m.text} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div style={{ color: "var(--cyan)", fontSize: 12 }}>
            <span className="scan-dots">{'> '}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(0,0,0,0.15)",
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--cyan)" }}>{'>'}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the agent anything..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            color: "var(--text)", caretColor: "var(--cyan)",
          }}
        />
        <div className="cursor-blink" style={{ opacity: input ? 0 : 1 }} />
        <button
          onClick={send}
          className="btn-cyan"
          style={{ padding: "5px 14px", borderRadius: 6, cursor: "pointer" }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
