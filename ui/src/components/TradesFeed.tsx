import { motion, AnimatePresence } from "framer-motion";
import type { Trade } from "../types.js";

interface Props { trades: Trade[]; }

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export default function TradesFeed({ trades }: Props) {
  const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="glass" style={{ borderRadius: 16, padding: "22px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="label">Live Trades</span>
          {sorted.length > 0 && (
            <div className="orb orb-green" style={{ width: 5, height: 5 }} />
          )}
        </div>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }}>
          {sorted.length} trades
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: "44px 0", textAlign: "center" }}>
            <div style={{ marginBottom: 10 }}>
              <div className="orb orb-dim" style={{ width: 6, height: 6, margin: "0 auto 10px" }} />
            </div>
            <div className="label" style={{ marginBottom: 7 }}>Awaiting first trade</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)" }}>
              Agent executes when signal conditions align
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sorted.map((t) => {
              const isBuy   = t.type === "buy";
              const accentC = isBuy ? "var(--cyan)" : "var(--danger)";
              return (
                <motion.div
                  key={t.signature ?? `${t.mint}-${t.timestamp}`}
                  initial={{ opacity: 0, x: 20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0,  scale: 1 }}
                  exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className={isBuy ? "trade-profit" : "trade-loss"}
                  style={{ borderRadius: 9, padding: "10px 12px", cursor: "default" }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700, letterSpacing: "0.1em",
                        color: accentC,
                        background: isBuy ? "rgba(0,229,255,0.08)" : "rgba(255,77,106,0.08)",
                        border: `1px solid ${isBuy ? "rgba(0,229,255,0.18)" : "rgba(255,77,106,0.18)"}`,
                        padding: "1px 6px", borderRadius: 3,
                      }}>{isBuy ? "BUY" : "SELL"}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>
                        {t.symbol ?? t.mint.slice(0, 8)}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }}>
                      {timeAgo(t.timestamp)} ago
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--text-sub)" }}>
                      {t.solAmount?.toFixed(3)} SOL
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                        @ ${t.pricePerToken?.toFixed(8) ?? ""}
                      </span>
                    </div>
                    {t.signature && (
                      <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10, color: accentC, opacity: 0.6, textDecoration: "none",
                          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em" }}>
                         tx
                      </a>
                    )}
                  </div>
                  {t.reasoning && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-sub)", fontStyle: "italic", lineHeight: 1.5,
                      borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 5 }}>
                      {t.reasoning.length > 90 ? t.reasoning.slice(0, 90) + "" : t.reasoning}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}