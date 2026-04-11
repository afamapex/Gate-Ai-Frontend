// src/hooks/useWebSocket.js
// Connects to the Gate AI backend WebSocket server.
// Automatically reconnects on disconnect.
// Returns the latest event received.

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = (() => {
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  return base.replace(/^http/, 'ws') + '/ws';
})();

export function useWebSocket(onMessage) {
  const ws            = useRef(null);
  const reconnectTimer= useRef(null);
  const onMessageRef  = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  // Keep the callback ref fresh without re-running the effect
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('gateai_token');
    if (!token) return;

    try {
      ws.current = new WebSocket(`${WS_URL}?token=${token}`);

      ws.current.onopen = () => {
        console.log('[WS] Connected');
        setConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ping') return; // ignore heartbeats
          onMessageRef.current?.(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.current.onclose = () => {
        console.log('[WS] Disconnected — reconnecting in 5s');
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.current.onerror = (err) => {
        console.warn('[WS] Error:', err);
        ws.current?.close();
      };
    } catch (err) {
      console.warn('[WS] Connection failed:', err);
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { connected };
}
