import { motion, AnimatePresence } from "framer-motion";
import type { Position } from "../types.js";

interface Props { positions: Position[]; }

function PnlBadge({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
      color: pos ? "rgba(74,222,128,0.95)" : "rgba(255,77,106,0.95)",
      background: pos ? "rgba(74,222,128,0.08)" : "rgba(255,77,106,0.08)",
      border: `1px solid ${pos ? "rgba(74,222,128,0.18)" : "rgba(255,77,106,0.18)"}`,
      padding: "2px 8px", borderRadius: 5,
      textShadow: pos ? "0 0 12px rgba(74,222,128,0.4)" : "0 0 12px rgba(255,77,106,0.35)",
    }}>
      {pos ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

/* Circular ping scanner loader */
function ScanLoader() {
  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid rgba(0,229,255,0.12)",
          borderTopColor: "rgba(0,229,255,0.6)",
        }}
      />
      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          border: "1px solid rgba(124,58,237,0.12)",
          borderTopColor: "rgba(124,58,237,0.5)",
        }}
      />
      {/* Ping effect */}
      <div className="scan-ping" style={{ inset: 6 }} />
      {/* Center dot */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div className="orb orb-cyan" style={{ width: 5, height: 5 }} />
      </div>
    </div>
  );
}

export default function Positions({ positions }: Props) {
  return (
    <div className="glass" style={{ borderRadius: 16, padding: "22px 24px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="label">Open Positions</span>
          {positions.length > 0 && (
            <motion.span
              key={positions.length}
              initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(0,229,255,0.08)", color: "var(--cyan)",
                padding: "1px 7px", borderRadius: 10,
                border: "1px solid rgba(0,229,255,0.2)",
              }}
            >{positions.length}</motion.span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {positions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "44px 0", gap: 14,
            }}
          >
            <ScanLoader />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-sub)" }}>
              AI scanning network<span className="scan-dots" />
            </div>
            <div className="label">No open positions</div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: 7 }}
          >
            {positions.map((p, i) => {
              const pnlPct = p.avgEntryPriceSol > 0 ? ((( p.currentPriceSol ?? p.avgEntryPriceSol) - p.avgEntryPriceSol) / p.avgEntryPriceSol) * 100 : (p.pnlPercent ?? 0);
              const isPos  = pnlPct >= 0;
              return (
                <motion.div
                  key={p.mint}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="row-hover"
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    background: "rgba(255,255,255,0.018)",
                    border: `1px solid ${isPos ? "rgba(0,229,255,0.1)" : "rgba(255,77,106,0.1)"}`,
                    borderRadius: 9,
                    borderLeft: `2px solid ${isPos ? "rgba(0,229,255,0.45)" : "rgba(255,77,106,0.4)"}`,
                  }}
                  whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 30 } }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, letterSpacing: "-0.01em" }}>
                      {p.symbol ?? p.mint.slice(0, 6)}
                    </div>
                    <div className="label">{p.tokenAmount?.toFixed(2)} tokens</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <PnlBadge pct={pnlPct} />
                    <div className="label" style={{ marginTop: 5 }}>entry ${p.avgEntryPriceSol?.toFixed(6)}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}