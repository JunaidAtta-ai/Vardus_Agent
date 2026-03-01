import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBrain } from "../api.js";
import type { BrainState } from "../types.js";

const EMOTION_COLORS: Record<string, string> = {
  confident: "var(--cyan)",
  cautious:  "var(--warn)",
  anxious:   "var(--danger)",
  neutral:   "var(--text-sub)",
  bullish:   "#4ade80",
  bearish:   "var(--danger)",
  excited:   "var(--cyan)",
  uncertain: "var(--warn)",
};

function emotionColor(e: string) {
  return EMOTION_COLORS[e.toLowerCase()] ?? "var(--text-sub)";
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SentimentBar({ value }: { value: number }) {
  const pct = Math.round((value + 1) * 50);
  const color = value > 0.2 ? "var(--cyan)" : value < -0.2 ? "var(--danger)" : "var(--warn)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          style={{ height: "100%", background: color, borderRadius: 99, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color, minWidth: 38, textAlign: "right" }}>
        {value >= 0 ? "+" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
}

/* Mini spark line for sentiment history */
function SentimentSpark({ emotions }: { emotions: BrainState["emotions"] }) {
  const last10 = emotions.slice(0, 10).reverse();
  if (last10.length < 2) return null;
  const W = 160, H = 36;
  const xs = last10.map((_, i) => (i / (last10.length - 1)) * W);
  const ys = last10.map(e => H - ((e.sentiment + 1) / 2) * H);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,229,255,0.1)"/>
          <stop offset="100%" stopColor="rgba(0,229,255,0.5)"/>
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#sparkGrad)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={2} fill="var(--cyan)" opacity={0.6} />
      ))}
    </svg>
  );
}

export default function BrainPanel() {
  const [brain, setBrain]   = useState<BrainState>({ memory: null, emotions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBrain();
        if (!data.error) setBrain(data);
      } finally { setLoading(false); }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  const latestEmotion = brain.emotions[0];
  const avgSentiment  = brain.emotions.length > 0
    ? brain.emotions.slice(0, 5).reduce((s, e) => s + e.sentiment, 0) / Math.min(5, brain.emotions.length)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Top stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Current emotion */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <div className="glass" style={{ padding: 22, borderRadius: 14, position: "relative", overflow: "hidden", height: "100%" }}>
            <div className="neural-bg" />
            <div className="label" style={{ marginBottom: 14 }}>CURRENT STATE</div>
            {latestEmotion ? (
              <>
                <motion.div
                  key={latestEmotion.emotion}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800,
                    color: emotionColor(latestEmotion.emotion), textTransform: "capitalize", marginBottom: 2,
                    textShadow: `0 0 24px ${emotionColor(latestEmotion.emotion)}`,
                  }}>
                  {latestEmotion.emotion}
                </motion.div>
                <SentimentBar value={latestEmotion.sentiment} />
                <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 12, lineHeight: 1.55 }}>
                  {latestEmotion.rationale}
                </div>
                <div className="label" style={{ marginTop: 10 }}>{fmtDate(latestEmotion.timestamp)}</div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {loading ? <>Loading<span className="scan-dots"/></> : "Awaiting first trading cycle"}
              </div>
            )}
          </div>
        </motion.div>

        {/* Avg sentiment + spark */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <div className="glass" style={{ padding: 22, borderRadius: 14, height: "100%" }}>
            <div className="label" style={{ marginBottom: 14 }}>AVG SENTIMENT (5)</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 42, fontWeight: 800, lineHeight: 1,
              color: avgSentiment > 0.1 ? "var(--cyan)" : avgSentiment < -0.1 ? "var(--danger)" : "var(--warn)",
              marginBottom: 8,
            }}>
              {avgSentiment >= 0 ? "+" : ""}{avgSentiment.toFixed(2)}
            </div>
            <SentimentBar value={avgSentiment} />
            <div style={{ marginTop: 16 }}>
              <SentimentSpark emotions={brain.emotions} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 10 }}>
              {avgSentiment > 0.3 ? "Bullish outlook" : avgSentiment < -0.3 ? "Bearish / risk-off" : "Neutral stance"}
            </div>
          </div>
        </motion.div>

        {/* Memory */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="glass" style={{ padding: 22, borderRadius: 14, height: "100%" }}>
            <div className="label" style={{ marginBottom: 14 }}>MEMORY</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800,
              color: "var(--cyan)", marginBottom: 6,
              textShadow: "0 0 20px rgba(0,229,255,0.35)",
            }}>
              {brain.memory?.lastUpdated ? fmtTime(brain.memory.lastUpdated) : "--:--:--"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 12 }}>Last memory write</div>
            <div style={{
              fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
              color: brain.memory?.frontalLobe ? "var(--cyan)" : "var(--text-muted)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <div className={`orb ${brain.memory?.frontalLobe ? "orb-cyan" : "orb-dim"}`} style={{ width: 5, height: 5 }} />
              {brain.memory?.frontalLobe ? "Active context" : "Empty frontal lobe"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Frontal lobe memory */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
        <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="label">FRONTAL LOBE  WORKING MEMORY</div>
              <div className={`orb ${brain.memory?.frontalLobe ? "orb-cyan" : "orb-dim"}`} style={{ width: 5, height: 5 }} />
            </div>
            {brain.memory?.lastUpdated && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }}>
                {fmtDate(brain.memory.lastUpdated)}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
            color: "var(--text-sub)", lineHeight: 1.8,
            background: "rgba(0,0,0,0.22)", borderRadius: 9,
            padding: "16px 18px", minHeight: 72,
            border: "1px solid var(--border)",
            whiteSpace: "pre-wrap",
          }}>
            {brain.memory?.frontalLobe || (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                No memory recorded yet<span className="scan-dots"/>
                {"\n"}The agent will populate this after the first trading cycle.
              </span>
            )}
            <span className="cursor-blink" />
          </div>
        </div>
      </motion.div>

      {/* Emotion timeline */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="label">EMOTION TIMELINE</div>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }}>
              {brain.emotions.length} entries
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <AnimatePresence>
              {brain.emotions.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "20px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                  {loading ? <>Loading<span className="scan-dots"/></> : "No emotion entries yet. Logs appear during trading cycles."}
                </div>
              ) : (
                brain.emotions.map((entry, i) => (
                  <motion.div
                    key={entry.timestamp}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="log-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 100px 140px 1fr",
                      gap: 14,
                      padding: "10px 8px",
                      borderBottom: i < brain.emotions.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }}>
                      {fmtDate(entry.timestamp)}
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: emotionColor(entry.emotion),
                      background: `${emotionColor(entry.emotion)}14`,
                      border: `1px solid ${emotionColor(entry.emotion)}28`,
                      borderRadius: 4, padding: "2px 8px",
                      textTransform: "capitalize",
                      textShadow: `0 0 10px ${emotionColor(entry.emotion)}`,
                      display: "inline-block",
                    }}>
                      {entry.emotion}
                    </span>
                    <SentimentBar value={entry.sentiment} />
                    <div style={{ fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.5 }}>
                      {entry.rationale}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

    </div>
  );
}