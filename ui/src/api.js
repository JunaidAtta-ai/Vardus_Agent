const BASE = import.meta.env.VITE_API_URL ?? "";
export async function fetchWallet() {
    const r = await fetch(`${BASE}/api/wallet`);
    return r.json();
}
export async function fetchPositions() {
    const r = await fetch(`${BASE}/api/positions`);
    return r.json();
}
export async function fetchTrades(limit = 50) {
    const r = await fetch(`${BASE}/api/trades?limit=${limit}`);
    return r.json();
}
export async function fetchScanner() {
    const r = await fetch(`${BASE}/api/scanner`);
    return r.json();
}
export async function fetchEvents(limit = 50) {
    const r = await fetch(`${BASE}/api/events?limit=${limit}`);
    return r.json();
}
export async function fetchBrain() {
    const r = await fetch(`${BASE}/api/brain`);
    return r.json();
}
export async function fetchConfig() {
    const r = await fetch(`${BASE}/api/config`);
    return r.json();
}
export async function fetchAnalytics() {
    const r = await fetch(`${BASE}/api/analytics`);
    return r.json();
}
export async function sendChat(message, sessionId) {
    const r = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
    });
    return r.json();
}
