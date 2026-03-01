import { motion, AnimatePresence } from "framer-motion";
import type { DexToken, PumpToken } from "../types.js";

interface Props { trending: DexToken[]; pumpfun: PumpToken[]; }

function fmt(n: number | undefined) {
  if (!n) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function ChangeBadge({ v }: { v: number | undefined }) {
  if (!v) return <span style={{ color: "var(--text-muted)" }}></span>;
  const pos = v >= 0;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 700,
      color: pos ? "rgba(74,222,128,0.95)" : "rgba(255,77,106,0.9)",
      textShadow: pos ? "0 0 10px rgba(74,222,128,0.35)" : "0 0 10px rgba(255,77,106,0.3)",
    }}>
      {pos ? "+" : ""}{v.toFixed(1)}%
    </span>
  );
}

function LiqBar({ value, max }: { value: number | undefined; max: number }) {
  const pct = value ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress-bar" style={{ marginTop: 5, width: "100%" }}>
      <div className="progress-fill" style={{
        width: `${pct}%`,
        background: "linear-gradient(90deg, rgba(0,229,255,0.5), rgba(124,58,237,0.5))",
      }} />
    </div>
  );
}

function ConfMini({ score }: { score: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={20} height={20} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={10} cy={10} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2}/>
      <circle cx={10} cy={10} r={r} fill="none"
        stroke="var(--cyan)" strokeWidth={2}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(0,229,255,0.5))" }}
      />
    </svg>
  );
}

function ScanHeader({ title, sub, loading }: { title: string; sub: string; loading: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</span>
        <span style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
          color: "var(--cyan)", background: "rgba(0,229,255,0.07)",
          padding: "2px 7px", borderRadius: 3, border: "1px solid rgba(0,229,255,0.15)",
          letterSpacing: "0.1em",
        }}>{sub}</span>
      </div>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="orb orb-cyan" style={{ width: 5, height: 5 }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)" }}>
            scanning<span className="scan-dots" />
          </span>
        </div>
      )}
    </div>
  );
}

export default function Scanner({ trending, pumpfun }: Props) {
  const maxLiq = Math.max(...trending.map(t => t.liquidityUsd ?? 0), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* DexScreener panel */}
      <div className={`glass${trending.length === 0 ? " scan-sweep" : ""}`}
        style={{ borderRadius: 16, padding: "22px 24px" }}>
        <ScanHeader title="DexScreener" sub="TRENDING" loading={trending.length === 0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {trending.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div className="label" style={{ marginBottom: 16 }}>Scanning DexScreener<span className="scan-dots" /></div>
              <motion.div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {[0,1,2,3,4].map(i => (
                  <motion.div key={i}
                    animate={{ height: [4, 18, 4], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 3, borderRadius: 99, background: "var(--cyan)" }}
                  />
                ))}
              </motion.div>
            </div>
          ) : (
            <AnimatePresence>
              {trending.slice(0, 15).map((t, i) => {
                const change = t.priceChange24h ?? t.priceChange1h ?? 0;
                const confScore = Math.min(95, 30 + (t.liquidityUsd ?? 0) / 50000 * 40 + Math.abs(change) * 0.5);
                return (
                  <motion.div
                    key={t.mint}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
                    className="shimmer row-hover"
                    style={{
                      padding: "9px 11px", borderRadius: 9,
                      background: "rgba(255,255,255,0.016)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                    whileHover={{ background: "rgba(0,229,255,0.028)", borderColor: "rgba(0,229,255,0.14)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: "-0.01em" }}>
                            {t.symbol ?? "?"}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>/SOL</span>
                        </div>
                        <LiqBar value={t.liquidityUsd} max={maxLiq} />
                        <div className="label" style={{ marginTop: 4 }}>{fmt(t.liquidityUsd)} liq</div>
                      </div>
                      <div style={{ textAlign: "right", paddingLeft: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <ConfMini score={Math.round(confScore)} />
                          <ChangeBadge v={change} />
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--text-sub)" }}>
                          ${t.priceUsd ? Number(t.priceUsd).toFixed(7) : ""}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Pump.fun panel */}
      <div className={`glass${pumpfun.length === 0 ? " scan-sweep" : ""}`}
        style={{ borderRadius: 16, padding: "22px 24px" }}>
        <ScanHeader title="Pump.fun" sub="NEW" loading={pumpfun.length === 0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {pumpfun.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div className="label" style={{ marginBottom: 16 }}>Scanning Pump.fun<span className="scan-dots" /></div>
              <motion.div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {[0,1,2,3,4].map(i => (
                  <motion.div key={i}
                    animate={{ height: [4, 18, 4], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 3, borderRadius: 99, background: "rgba(124,58,237,0.8)" }}
                  />
                ))}
              </motion.div>
            </div>
          ) : (
            <AnimatePresence>
              {pumpfun.slice(0, 15).map((p, i) => {
                const mc = p.marketCapUsd ?? 0;
                const confScore = Math.min(90, 25 + (mc / 5000) * 30);
                return (
                  <motion.div
                    key={p.mint}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
                    className="shimmer row-hover"
                    style={{
                      padding: "9px 11px", borderRadius: 9,
                      background: "rgba(255,255,255,0.016)",
                      border: "1px solid var(--border)",
                    }}
                    whileHover={{ background: "rgba(124,58,237,0.028)", borderColor: "rgba(124,58,237,0.14)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 2, letterSpacing: "-0.01em" }}>{p.name ?? "Unknown"}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace', color: 'var(--text-muted)" }}>{p.symbol}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>mc {fmt(mc)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <ConfMini score={Math.round(confScore)} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}