import { useEffect, useRef, useCallback } from "react";
export function useSSE(onMessage) {
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;
    const connect = useCallback(() => {
        const base = import.meta.env.VITE_API_URL ?? "";
        const es = new EventSource(`${base}/events`);
        es.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                onMessageRef.current(msg);
            }
            catch {
                // skip unparseable
            }
        };
        es.onerror = () => {
            es.close();
            // Reconnect with exponential backoff
            setTimeout(connect, 3000);
        };
        return es;
    }, []);
    useEffect(() => {
        const es = connect();
        return () => es.close();
    }, [connect]);
}
