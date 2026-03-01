import { useEffect, useRef, useCallback } from "react";
import type { SSEMessage } from "../types.js";

export function useSSE(onMessage: (msg: SSEMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
    const es = new EventSource(`${base}/events`);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as SSEMessage;
        onMessageRef.current(msg);
      } catch {
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
