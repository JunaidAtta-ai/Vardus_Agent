import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useSSE } from "./hooks/useSSE.js";
import { fetchWallet, fetchPositions, fetchTrades, fetchScanner, fetchEvents } from "./api.js";
import type { WalletInfo, Position, PositionsSummary, Trade, DexToken, PumpToken, AppEvent, SSEMessage } from "./types.js";

import Overview from "./components/Overview.js";
import WalletCard from "./components/WalletCard.js";
import Positions from "./components/Positions.js";
import TradesFeed from "./components/TradesFeed.js";
import ChatPanel from "./components/ChatPanel.js";
import Scanner from "./components/Scanner.js";
import EventLogPanel from "./components/EventLogPanel.js";
import BrainPanel from "./components/BrainPanel.js";
import AnalyticsPanel from "./components/AnalyticsPanel.js";
import ConfigPanel from "./components/ConfigPanel.js";

type Tab = "overview" | "dashboard" | "scanner" | "brain" | "analytics" | "config" | "logs";
type AgentStatus = "active" | "scanning" | "risk" | "idle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ease1 = [0.16, 1, 0.3, 1] as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ease2 = [0.4, 0, 1, 1] as any;
const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.42, ease: ease1 } },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.2,  ease: ease2 } },
};

const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.45, ease: ease1 } },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"   },
  { id: "dashboard",  label: "Dashboard"  },
  { id: "analytics",  label: "Analytics"  },
  { id: "scanner",    label: "Scanner"    },
  { id: "brain",      label: "Brain"      },
  { id: "config",     label: "Config"     },
  { id: "logs",       label: "Event Log"  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PositionsSummary>({ totalTrades: 0, totalRealizedPnlSol: 0 });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [trending, setTrending] = useState<DexToken[]>([]);
  const [pumpfun, setPumpfun] = useState<PumpToken[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [connected, setConnected] = useState(false);

  /*  Parallax mouse glows  */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 30 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth  - 0.5) * 60);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  const reload = useCallback(async () => {
    try {
      const [w, p, t, s, e] = await Promise.allSettled([
        fetchWallet(), fetchPositions(), fetchTrades(50),
        fetchScanner(), fetchEvents(50),
      ]);
      if (w.status === "fulfilled" && !w.value?.error) setWallet(w.value);
      if (p.status === "fulfilled" && !p.value?.error) {
        setPositions(p.value.positions ?? []);
        setSummary(p.value.summary ?? { totalTrades: 0, totalRealizedPnlSol: 0 });
      }
      if (t.status === "fulfilled") setTrades(t.value.trades ?? []);
      if (s.status === "fulfilled") {
        setTrending(s.value.trending ?? []);
        setPumpfun(s.value.pumpfun ?? []);
      }
      if (e.status === "fulfilled") { setEvents(e.value.events ?? []); setConnected(true); }
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, 15_000);
    return () => clearInterval(t);
  }, [reload]);

  useSSE((msg: SSEMessage) => {
    setConnected(true);
    if (msg.type === "event") {
      const ev = msg.data;
      setEvents((prev) => [ev, ...prev].slice(0, 300));
      if (ev.type === "trading_loop.start") setAgentStatus("scanning");
      if (ev.type === "trading_loop.end")   setAgentStatus("active");
      if (ev.type === "guard.blocked")      setAgentStatus("risk");
      if (ev.type === "trade.pushed") {
        fetchTrades(50).then((r) => setTrades(r.trades ?? []));
        fetchWallet().then((r) => { if (!r?.error) setWallet(r); });
        fetchPositions().then((r) => {
          if (!r?.error) {
            setPositions(r.positions ?? []);
            setSummary(r.summary ?? { totalTrades: 0, totalRealizedPnlSol: 0 });
          }
        });
      }
    }
  });

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", position: "relative" }}>
      {/* Layer 0: grid + noise */}
      <div className="grid-bg" />
      <div className="noise-overlay" />

      {/* Layer 1: animated glow orbs (parallax) */}
      <motion.div
        className="glow-orb-cyan"
        style={{
          top: -120, right: -120, width: 600, height: 600,
          x: springX, y: springY,
        }}
      />
      <motion.div
        className="glow-orb-violet"
        style={{
          bottom: "5%", left: -100, width: 500, height: 500,
          x: springX, y: springY,
          filter: "blur(1px)",
        }}
      />
      {/* Subtle indigo mid-screen accent */}
      <div style={{
        position: "fixed", top: "40%", right: "20%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Layer 2: header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(7,10,19,0.82)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        padding: "0 28px",
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src="/logo.png" alt="Actavis" style={{
            width: 32, height: 32, borderRadius: 7,
            objectFit: "contain",
            flexShrink: 0,
          }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              ACTAVIS AGENT
            </span>
          </div>
        </div>

        {/* Center tabs */}
        <nav style={{ display: "flex", gap: 2, overflow: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 6,
            background: connected ? "rgba(74,222,128,0.06)" : "rgba(255,77,106,0.06)",
            border: `1px solid ${connected ? "rgba(74,222,128,0.18)" : "rgba(255,77,106,0.18)"}`,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: connected ? "var(--green)" : "var(--danger)",
              boxShadow: connected ? "0 0 6px rgba(74,222,128,0.7)" : "0 0 6px rgba(255,77,106,0.5)",
            }} />
            <span style={{ fontSize: 10, color: "var(--text-sub)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
              {connected ? "live" : "offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Layer 3: main content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "36px 28px" }}>
        <AnimatePresence mode="wait">

          {activeTab === "overview" && (
            <motion.div key="overview" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <Overview wallet={wallet} summary={summary} trades={trades} events={events} agentStatus={agentStatus} />
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div key="dashboard" variants={cardStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <motion.div variants={cardItem}><WalletCard solBalance={wallet?.solBalance ?? 0} address={wallet?.address ?? ""} totalTrades={summary.totalTrades} realizedPnlSol={summary.totalRealizedPnlSol} agentStatus={agentStatus} /></motion.div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <motion.div variants={cardItem}><Positions positions={positions} /></motion.div>
                <motion.div variants={cardItem}><TradesFeed trades={trades} /></motion.div>
              </div>
              <motion.div variants={cardItem}><ChatPanel agentEvents={events} /></motion.div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div key="analytics" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <AnalyticsPanel trades={trades} />
            </motion.div>
          )}

          {activeTab === "scanner" && (
            <motion.div key="scanner" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <Scanner trending={trending} pumpfun={pumpfun} />
            </motion.div>
          )}

          {activeTab === "brain" && (
            <motion.div key="brain" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <BrainPanel />
            </motion.div>
          )}

          {activeTab === "config" && (
            <motion.div key="config" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <ConfigPanel />
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div key="logs" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <EventLogPanel events={events} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}