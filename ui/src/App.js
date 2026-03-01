import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useSSE } from "./hooks/useSSE.js";
import { fetchWallet, fetchPositions, fetchTrades, fetchScanner, fetchEvents } from "./api.js";
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ease1 = [0.16, 1, 0.3, 1];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ease2 = [0.4, 0, 1, 1];
const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: ease1 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: ease2 } },
};
const cardStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};
const cardItem = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ease1 } },
};
const TABS = [
    { id: "overview", label: "Overview" },
    { id: "dashboard", label: "Dashboard" },
    { id: "analytics", label: "Analytics" },
    { id: "scanner", label: "Scanner" },
    { id: "brain", label: "Brain" },
    { id: "config", label: "Config" },
    { id: "logs", label: "Event Log" },
];
export default function App() {
    const [activeTab, setActiveTab] = useState("overview");
    const [agentStatus, setAgentStatus] = useState("idle");
    const [wallet, setWallet] = useState(null);
    const [positions, setPositions] = useState([]);
    const [summary, setSummary] = useState({ totalTrades: 0, totalRealizedPnlSol: 0 });
    const [trades, setTrades] = useState([]);
    const [trending, setTrending] = useState([]);
    const [pumpfun, setPumpfun] = useState([]);
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);
    /*  Parallax mouse glows  */
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 40, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 40, damping: 30 });
    useEffect(() => {
        const handleMove = (e) => {
            mouseX.set((e.clientX / window.innerWidth - 0.5) * 60);
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
            if (w.status === "fulfilled" && !w.value?.error)
                setWallet(w.value);
            if (p.status === "fulfilled" && !p.value?.error) {
                setPositions(p.value.positions ?? []);
                setSummary(p.value.summary ?? { totalTrades: 0, totalRealizedPnlSol: 0 });
            }
            if (t.status === "fulfilled")
                setTrades(t.value.trades ?? []);
            if (s.status === "fulfilled") {
                setTrending(s.value.trending ?? []);
                setPumpfun(s.value.pumpfun ?? []);
            }
            if (e.status === "fulfilled") {
                setEvents(e.value.events ?? []);
                setConnected(true);
            }
        }
        catch {
            setConnected(false);
        }
    }, []);
    useEffect(() => {
        reload();
        const t = setInterval(reload, 15000);
        return () => clearInterval(t);
    }, [reload]);
    useSSE((msg) => {
        setConnected(true);
        if (msg.type === "event") {
            const ev = msg.data;
            setEvents((prev) => [ev, ...prev].slice(0, 300));
            if (ev.type === "trading_loop.start")
                setAgentStatus("scanning");
            if (ev.type === "trading_loop.end")
                setAgentStatus("active");
            if (ev.type === "guard.blocked")
                setAgentStatus("risk");
            if (ev.type === "trade.pushed") {
                fetchTrades(50).then((r) => setTrades(r.trades ?? []));
                fetchWallet().then((r) => { if (!r?.error)
                    setWallet(r); });
                fetchPositions().then((r) => {
                    if (!r?.error) {
                        setPositions(r.positions ?? []);
                        setSummary(r.summary ?? { totalTrades: 0, totalRealizedPnlSol: 0 });
                    }
                });
            }
        }
    });
    return (_jsxs("div", { style: { background: "var(--bg)", minHeight: "100vh", position: "relative" }, children: [_jsx("div", { className: "grid-bg" }), _jsx("div", { className: "noise-overlay" }), _jsx(motion.div, { className: "glow-orb-cyan", style: {
                    top: -120, right: -120, width: 600, height: 600,
                    x: springX, y: springY,
                } }), _jsx(motion.div, { className: "glow-orb-violet", style: {
                    bottom: "5%", left: -100, width: 500, height: 500,
                    x: springX, y: springY,
                    filter: "blur(1px)",
                } }), _jsx("div", { style: {
                    position: "fixed", top: "40%", right: "20%",
                    width: 300, height: 300, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)",
                    pointerEvents: "none", zIndex: 0,
                } }), _jsxs("header", { style: {
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
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }, children: [_jsx("img", { src: "/logo.png", alt: "Actavis", style: {
                                    width: 32, height: 32, borderRadius: 7,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                } }), _jsx("div", { style: { display: "flex", alignItems: "baseline", gap: 6 }, children: _jsx("span", { style: { fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }, children: "ACTAVIS AGENT" }) })] }), _jsx("nav", { style: { display: "flex", gap: 2, overflow: "auto" }, children: TABS.map((tab) => (_jsx("button", { className: `tab-btn${activeTab === tab.id ? " active" : ""}`, onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) }), _jsx("div", { style: { display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }, children: _jsxs("div", { style: {
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "3px 10px", borderRadius: 6,
                                background: connected ? "rgba(74,222,128,0.06)" : "rgba(255,77,106,0.06)",
                                border: `1px solid ${connected ? "rgba(74,222,128,0.18)" : "rgba(255,77,106,0.18)"}`,
                            }, children: [_jsx("div", { style: {
                                        width: 5, height: 5, borderRadius: "50%",
                                        background: connected ? "var(--green)" : "var(--danger)",
                                        boxShadow: connected ? "0 0 6px rgba(74,222,128,0.7)" : "0 0 6px rgba(255,77,106,0.5)",
                                    } }), _jsx("span", { style: { fontSize: 10, color: "var(--text-sub)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }, children: connected ? "live" : "offline" })] }) })] }), _jsx("main", { style: { position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "36px 28px" }, children: _jsxs(AnimatePresence, { mode: "wait", children: [activeTab === "overview" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(Overview, { wallet: wallet, summary: summary, trades: trades, events: events, agentStatus: agentStatus }) }, "overview")), activeTab === "dashboard" && (_jsxs(motion.div, { variants: cardStagger, initial: "hidden", animate: "show", exit: { opacity: 0, transition: { duration: 0.15 } }, style: { display: "flex", flexDirection: "column", gap: 20 }, children: [_jsx(motion.div, { variants: cardItem, children: _jsx(WalletCard, { solBalance: wallet?.solBalance ?? 0, address: wallet?.address ?? "", totalTrades: summary.totalTrades, realizedPnlSol: summary.totalRealizedPnlSol, agentStatus: agentStatus }) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }, children: [_jsx(motion.div, { variants: cardItem, children: _jsx(Positions, { positions: positions }) }), _jsx(motion.div, { variants: cardItem, children: _jsx(TradesFeed, { trades: trades }) })] }), _jsx(motion.div, { variants: cardItem, children: _jsx(ChatPanel, { agentEvents: events }) })] }, "dashboard")), activeTab === "analytics" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(AnalyticsPanel, { trades: trades }) }, "analytics")), activeTab === "scanner" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(Scanner, { trending: trending, pumpfun: pumpfun }) }, "scanner")), activeTab === "brain" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(BrainPanel, {}) }, "brain")), activeTab === "config" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(ConfigPanel, {}) }, "config")), activeTab === "logs" && (_jsx(motion.div, { variants: pageVariants, initial: "hidden", animate: "show", exit: "exit", children: _jsx(EventLogPanel, { events: events }) }, "logs"))] }) })] }));
}
