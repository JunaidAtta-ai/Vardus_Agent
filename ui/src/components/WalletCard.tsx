import { useState, useEffect, useRef } from "react";

type AgentStatus = "active" | "scanning" | "risk" | "idle";

interface Props {
  solBalance: number;
  address: string;
  totalTrades: number;
  realizedPnlSol: number;
  agentStatus?: AgentStatus;
}

/* Smooth animated counter */
function useCountUp(target: number, decimals = 3) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.0001) { setValue(target); return; }
    const dur = 800;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(start + diff * eased);
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value.toFixed(decimals);
}

/* Dual-ring confidence SVG */
function ConfidenceRing({ value }: { value: number }) {
  const r = 28, r2 = 22;
  const c  = 2 * Math.PI * r;
  const c2 = 2 * Math.PI * r2;
  const offset  = c  - (value / 100) * c;
  const offset2 = c2 - ((value * 0.6) / 100) * c2;
  return (
    <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
      {/* Outer track */}
      <circle cx={36} cy={36} r={r}  fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={2.5}/>
      {/* Inner track */}
      <circle cx={36} cy={36} r={r2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={2}/>
      {/* Outer arc */}
      <circle cx={36} cy={36} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={2.5}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)", filter: "drop-shadow(0 0 4px rgba(0,229,255,0.6))" }}
      />
      {/* Inner arc  violet */}
      <circle cx={36} cy={36} r={r2} fill="none"
        stroke="rgba(124,58,237,0.55)" strokeWidth={2}
        strokeDasharray={c2} strokeDashoffset={offset2}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00E5FF" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function WalletCard({ solBalance, address, totalTrades, realizedPnlSol, agentStatus = "idle" }: Props) {
  const pnlPositive = realizedPnlSol >= 0;
  const pnlColor    = pnlPositive ? "rgba(74,222,128,1)" : "rgba(255,77,106,1)";
  const confidence  = Math.min(95, 40 + totalTrades * 3);
  const riskPct     = Math.min(100, (1 - (solBalance / Math.max(solBalance + Math.abs(realizedPnlSol), 0.001))) * 100 + 15);

  const balanceStr = useCountUp(solBalance, 3);
  const pnlStr     = useCountUp(realizedPnlSol, 4);

  const statusText = agentStatus === "scanning" ? "Scanning markets..."
    : agentStatus === "risk"   ? "Risk threshold hit"
    : agentStatus === "active" ? "Ready to trade"
    : "Awaiting cycle";

  const statusColor = agentStatus === "scanning" ? "var(--cyan)"
    : agentStatus === "risk"   ? "var(--danger)"
    : agentStatus === "active" ? "var(--green)"
    : "var(--text-muted)";

  return (
    <div
      className={`glass hover-lift${agentStatus === "scanning" ? " scan-sweep" : ""}`}
      style={{ borderRadius: 18, padding: "32px 36px", position: "relative", overflow: "hidden" }}
    >
      {/* Background glow under balance */}
      <div style={{
        position: "absolute", bottom: -40, left: 24,
        width: 220, height: 120, borderRadius: "50%",
        background: pnlPositive
          ? "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(255,77,106,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        transition: "background 1s ease",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28 }}>
        {/* Left */}
        <div style={{ flex: 1 }}>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div className={`orb ${
              agentStatus === "scanning" ? "orb-cyan" :
              agentStatus === "risk"     ? "orb-red"  :
              agentStatus === "active"   ? "orb-green": "orb-dim"
            }`} />
            <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: statusColor, fontFamily: "'JetBrains Mono', monospace" }}>
              {statusText}
            </span>
          </div>

          {/* Balance */}
          <div style={{ marginBottom: 6, lineHeight: 1 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em",
              color: "var(--text)",
              textShadow: pnlPositive ? "0 0 40px rgba(0,229,255,0.12)" : "0 0 40px rgba(255,77,106,0.1)",
            }}>
              {balanceStr}
            </span>
            <span style={{ marginLeft: 10, color: "var(--cyan)", fontSize: 17, fontWeight: 600, letterSpacing: "0.02em" }}>SOL</span>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 28 }}>
            {address ? (
              <a
                href={`https://solscan.io/account/${address}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: "var(--cyan)", letterSpacing: "0.04em",
                  textDecoration: "none", opacity: 0.8,
                  borderBottom: "1px dashed rgba(34,211,238,0.35)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.8")}
                title={address}
              >
                {address.slice(0, 6)}…{address.slice(-6)} ↗
              </a>
            ) : (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: "var(--text-muted)", letterSpacing: "0.04em",
              }}>
                No wallet connected
              </span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 36 }}>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Realized P&amp;L</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 700,
                color: pnlColor,
                textShadow: pnlPositive ? "0 0 16px rgba(74,222,128,0.35)" : "0 0 16px rgba(255,77,106,0.3)",
              }}>
                {pnlPositive ? "+" : ""}{pnlStr} SOL
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Trades</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 700 }}>{totalTrades}</div>
            </div>
          </div>
        </div>

        {/* Right: ring + risk */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <ConfidenceRing value={confidence} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--cyan)" }}>
                {confidence}%
              </span>
            </div>
          </div>
          <div className="label">Confidence</div>

          <div style={{ width: 88 }}>
            <div className="label" style={{ marginBottom: 7, textAlign: "center" }}>Risk</div>
            <div className="progress-bar-thick">
              <div className="progress-fill" style={{
                width: `${Math.min(100, riskPct)}%`,
                background: riskPct > 70
                  ? "linear-gradient(90deg, var(--warn), var(--danger))"
                  : "linear-gradient(90deg, rgba(0,229,255,0.7), rgba(124,58,237,0.7))",
                boxShadow: riskPct > 70 ? "0 0 8px rgba(255,77,106,0.4)" : "0 0 8px rgba(0,229,255,0.3)",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}