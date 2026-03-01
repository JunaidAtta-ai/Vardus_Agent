import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchConfig } from "../api.js";
import type { AgentConfig } from "../types.js";

function ConfigRow({ label, value, accent }: { label: string; value: string | number | boolean; accent?: string }) {
  const display = typeof value === "boolean"
    ? value ? "ENABLED" : "DISABLED"
    : String(value);
  const color = typeof value === "boolean"
    ? value ? "var(--cyan)" : "var(--danger)"
    : accent ?? "var(--text)";

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-sub)" }}>{label}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        fontWeight: 600, color,
      }}>
        {display}
      </span>
    </div>
  );
}

function SectionCard({ title, tag, tagColor, children }: {
  title: string; tag: string; tagColor: string; children: React.ReactNode;
}) {
  return (
    <div className="glass" style={{
      padding: "20px 22px", borderRadius: 12,
      borderTop: `1px solid ${tagColor}44`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: "0.12em", color: tagColor,
          background: `${tagColor}15`, border: `1px solid ${tagColor}30`,
          borderRadius: 4, padding: "3px 8px", textTransform: "uppercase",
        }}>
          {tag}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const GUARD_DESCRIPTIONS: Record<string, string> = {
  maxSolPerTrade: "Maximum SOL allowed in a single trade",
  maxPositionPercent: "Max % of wallet in one token position",
  slippageBps: "Slippage tolerance in basis points (1bps = 0.01%)",
  minLiquidityUsd: "Minimum pool liquidity required to enter",
  cooldownSeconds: "Lock-out seconds between trades on same token",
  stopLossPercent: "Auto-sell trigger loss threshold (%)",
  takeProfitPercent: "Auto-sell trigger profit threshold (%)",
};

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig()
      .then((d) => { if (!d?.error) setCfg(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass" style={{ padding: 22, borderRadius: 12, height: 200 }} />
        ))}
      </div>
    );
  }

  if (!cfg) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }}>
        Could not load config. Backend may be offline.
      </div>
    );
  }

  const { solana } = cfg;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Top highlight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          {
            label: "AUTO-TRADING",
            value: solana.autoTrading ? "ENABLED" : "DISABLED",
            accent: solana.autoTrading ? "var(--cyan)" : "var(--danger)",
          },
          {
            label: "INTERVAL",
            value: `${solana.tradingIntervalMinutes ?? "--"} min`,
            accent: "var(--text)",
          },
          {
            label: "AI MODEL",
            value: cfg.model,
            accent: "var(--violet)",
          },
          {
            label: "API PORT",
            value: `:${cfg.webPort}`,
            accent: "var(--text-sub)",
          },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="glass" style={{ padding: "18px 20px", borderRadius: 12 }}>
              <div className="label" style={{ marginBottom: 10 }}>{card.label}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 22,
                fontWeight: 700, color: card.accent, lineHeight: 1,
              }}>
                {card.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Config sections grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Guard pipeline */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard title="Guard Pipeline" tag="RISK" tagColor="var(--danger)">
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(GUARD_DESCRIPTIONS).map(([key, desc]) => {
                const val = (solana as Record<string, unknown>)[key];
                if (val === undefined) return null;
                let display: string;
                if (key === "maxSolPerTrade") display = `${val} SOL`;
                else if (key === "maxPositionPercent") display = `${val}%`;
                else if (key === "slippageBps") display = `${val} bps (${((val as number) / 100).toFixed(1)}%)`;
                else if (key === "minLiquidityUsd") display = `$${(val as number).toLocaleString()}`;
                else if (key === "cooldownSeconds") display = `${val}s (${Math.round((val as number) / 60)}min)`;
                else if (key === "stopLossPercent") display = `-${val}%`;
                else if (key === "takeProfitPercent") display = `+${val}%`;
                else display = String(val);
                return (
                  <div key={key}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 2 }}>
                          {key}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{desc}</div>
                      </div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                        fontWeight: 600, color: "var(--text)", flexShrink: 0, marginLeft: 12,
                      }}>
                        {display}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Trading settings */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionCard title="Trading Settings" tag="CONFIG" tagColor="var(--cyan)">
              <ConfigRow label="Auto-Trading" value={solana.autoTrading ?? false} />
              <ConfigRow label="Interval" value={`${solana.tradingIntervalMinutes ?? "--"} minutes`} />
              <ConfigRow label="Slippage Tolerance" value={`${((solana.slippageBps ?? 0) / 100).toFixed(1)}%`} accent="var(--warn)" />
              <ConfigRow label="Max Position Size" value={`${solana.maxPositionPercent ?? "--"}% of wallet`} />
            </SectionCard>
          </motion.div>

          {/* AI + Network */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard title="AI + Network" tag="SYSTEM" tagColor="var(--violet)">
              <ConfigRow label="AI Model" value={cfg.model} accent="var(--violet)" />
              <ConfigRow label="RPC Endpoint" value={
                solana.rpcUrl
                  ? solana.rpcUrl.includes("mainnet") ? "mainnet-beta"
                    : solana.rpcUrl.includes("devnet") ? "devnet"
                    : "custom"
                  : "--"
              } />
              <ConfigRow label="Web Port" value={`:${cfg.webPort}`} />
            </SectionCard>
          </motion.div>

          {/* Info box */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="glass" style={{
              padding: "16px 20px", borderRadius: 12,
              borderLeft: "2px solid rgba(0,229,255,0.4)",
            }}>
              <div style={{ fontSize: 10, color: "var(--cyan)", letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 8 }}>
                CONFIG FILES
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.7 }}>
                All configuration is stored in <span style={{ fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--text)" }}>data/config/</span> as JSON files.
                Private keys are never exposed via the API.
                Hot-reload is supported on most parameters.
              </div>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["solana.json", "model.json", "connectors.json", "api-keys.json", "engine.json"].map((f) => (
                  <span key={f} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: "var(--text-muted)", background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px",
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
