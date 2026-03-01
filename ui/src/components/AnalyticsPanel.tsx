import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchAnalytics } from "../api.js";
import type { Analytics, Trade } from "../types.js";

interface Props {
  trades: Trade[];
}

function PnlChart({ timeline }: { timeline: Array<{ ts: number; value: number }> }) {
  if (timeline.length < 2) {
    return (
      <div style={{
        height: 180, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 12,
      }}>
        Not enough data for chart
      </div>
    );
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

  const x = (i: number) => PAD.left + (i / (timeline.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - ((v - minV) / range) * innerH;

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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "100%", overflow: "visible" }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lastVal >= 0 ? "rgba(0,229,255,0.3)" : "rgba(255,77,106,0.3)"} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <clipPath id="chartClip">
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} />
        </clipPath>
      </defs>

      {/* Zero line */}
      {zeroY >= PAD.top && zeroY <= PAD.top + innerH && (
        <line
          x1={PAD.left} y1={zeroY} x2={PAD.left + innerW} y2={zeroY}
          stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4,4"
        />
      )}

      {/* Area fill */}
      <path d={areaD} fill="url(#pnlGrad)" clipPath="url(#chartClip)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} clipPath="url(#chartClip)" />

      {/* Y axis labels */}
      {yLabels.map((l) => (
        <text
          key={l.label}
          x={PAD.left - 6} y={l.yp + 4}
          textAnchor="end"
          fontSize={9}
          fill="rgba(255,255,255,0.3)"
          fontFamily="'JetBrains Mono', monospace"
        >
          {l.label}
        </text>
      ))}

      {/* Last value dot */}
      <circle
        cx={x(timeline.length - 1)} cy={y(lastVal)}
        r={3} fill={lineColor}
        filter="url(#glow)"
      />
    </svg>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="glass" style={{ padding: "18px 20px", borderRadius: 12 }}>
      <div className="label" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700,
        color: accent ?? "var(--text)", lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-sub)" }}>{sub}</div>
      )}
    </div>
  );
}

export default function AnalyticsPanel({ trades }: Props) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetchAnalytics();
        if (!d.error) setAnalytics(d);
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  // Trade distribution by symbol (from local trades prop for speed)
  const bySym: Record<string, number> = {};
  trades.forEach((t) => {
    bySym[t.symbol] = (bySym[t.symbol] ?? 0) + 1;
  });
  const topSyms = Object.entries(bySym)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const totalTradesLocal = trades.length;
  const maxCount = topSyms[0]?.[1] ?? 1;

  // Recent activity: last 7 unique days
  const last7: Record<string, number> = {};
  trades.slice(0, 100).forEach((t) => {
    const d = new Date(t.timestamp).toLocaleDateString([], { weekday: "short" });
    last7[d] = (last7[d] ?? 0) + 1;
  });
  const days = Object.entries(last7).slice(0, 7).reverse();
  const maxDay = Math.max(...days.map((d) => d[1]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: 20, borderRadius: 12, height: 90 }} />
          ))
        ) : analytics ? (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <StatCard
                label="REALIZED PNL"
                value={`${analytics.totalPnl >= 0 ? "+" : ""}${analytics.totalPnl.toFixed(4)}`}
                sub="SOL net"
                accent={analytics.totalPnl >= 0 ? "var(--cyan)" : "var(--danger)"}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <StatCard
                label="WIN RATE"
                value={`${analytics.winRate}%`}
                sub={`${analytics.totalSells} sells / ${analytics.totalBuys} buys`}
                accent={analytics.winRate >= 50 ? "var(--cyan)" : "var(--warn)"}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <StatCard
                label="SOL DEPLOYED"
                value={analytics.solSpent.toFixed(4)}
                sub="total SOL spent on buys"
                accent="var(--text)"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
              <StatCard
                label="SOL RETURNED"
                value={analytics.solReceived.toFixed(4)}
                sub="total SOL from sells"
                accent="var(--violet)"
              />
            </motion.div>
          </>
        ) : (
          <div style={{ gridColumn: "1/-1", color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: 24 }}>
            No analytics data yet. Data will appear after the first trades.
          </div>
        )}
      </div>

      {/* PnL Chart */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="label">CUMULATIVE PNL (SOL)</div>
            {analytics && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                color: analytics.totalPnl >= 0 ? "var(--cyan)" : "var(--danger)",
              }}>
                {analytics.totalPnl >= 0 ? "+" : ""}{analytics.totalPnl.toFixed(6)} SOL
              </span>
            )}
          </div>
          <div style={{ height: 180 }}>
            <PnlChart timeline={analytics?.timeline ?? []} />
          </div>
        </div>
      </motion.div>

      {/* Bottom row: Token distribution + Daily activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Token distribution */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass" style={{ padding: 20, borderRadius: 12 }}>
            <div className="label" style={{ marginBottom: 16 }}>
              TRADES BY TOKEN (top {topSyms.length})
            </div>
            {topSyms.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12, paddingTop: 20, textAlign: "center" }}>
                No trade data
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topSyms.map(([sym, count]) => (
                  <div key={sym}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginBottom: 5, alignItems: "center",
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        color: "var(--text)",
                      }}>
                        {sym}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: "var(--cyan)",
                      }}>
                        {count} trade{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${(count / maxCount) * 100}%`,
                        background: "linear-gradient(90deg, var(--cyan), var(--violet))",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Daily activity */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass" style={{ padding: 20, borderRadius: 12 }}>
            <div className="label" style={{ marginBottom: 16 }}>
              DAILY TRADE ACTIVITY
            </div>
            {days.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12, paddingTop: 20, textAlign: "center" }}>
                No activity data
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 8,
                height: 100, padding: "0 4px",
              }}>
                {days.map(([day, count]) => (
                  <div key={day} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 6,
                  }}>
                    <div style={{
                      width: "100%", borderRadius: 3,
                      height: `${Math.max(4, (count / maxDay) * 80)}px`,
                      background: "linear-gradient(180deg, var(--cyan), rgba(0,229,255,0.3))",
                      transition: "height 0.5s ease",
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                      color: "var(--text-muted)",
                    }}>
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {days.length > 0 && (
              <div style={{
                marginTop: 12, paddingTop: 12,
                borderTop: "1px solid var(--border)",
                fontSize: 11, color: "var(--text-sub)",
              }}>
                {totalTradesLocal} total trades in history
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
