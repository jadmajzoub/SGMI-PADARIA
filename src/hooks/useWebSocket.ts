import { useCallback, useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: Date;
}

const WEBSOCKET_URL = 'ws://localhost:4000/ws';
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 25000; // 25 seconds

export function useWebSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const isManualDisconnectRef = useRef(false);

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const calculateReconnectDelay = useCallback((attempts: number) => {
    // Exponential backoff with jitter
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempts), MAX_RECONNECT_DELAY);
    const jitter = Math.random() * 0.3 * delay; // 30% jitter
    return delay + jitter;
  }, []);

  const startPingInterval = useCallback(() => {
    clearInterval(pingIntervalRef.current!);
    pingIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: new Date() }));
      }
    }, PING_INTERVAL);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          ...message,
          timestamp: new Date()
        }));
      } catch (error) {
        console.error('Erro ao enviar mensagem WebSocket:', error);
      }
    } else {
      console.warn('WebSocket não está conectado. Estado:', wsRef.current?.readyState);
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      setConnectionError('Token é necessário para conectar');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return; // Already trying to connect
    }

    clearTimeouts();
    isManualDisconnectRef.current = false;

    try {
      const url = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ Conectado ao WebSocket');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        startPingInterval();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Don't log pong responses to reduce noise
          if (message.type !== 'pong') {
            console.log('📨 Mensagem WebSocket recebida:', message.type);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 Conexão WebSocket fechada:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        clearTimeouts();

        // Only auto-reconnect if not manually disconnected and haven't exceeded max attempts
        if (!isManualDisconnectRef.current &&
            event.code !== 1000 &&
            reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {

          reconnectAttemptsRef.current += 1;
          const delay = calculateReconnectDelay(reconnectAttemptsRef.current - 1);

          setConnectionError(`Reconectando... (tentativa ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Falha ao conectar após várias tentativas. Clique para tentar novamente.');
        }
      };

      ws.onerror = () => {
        console.error('❌ Erro na conexão WebSocket');
        setConnectionError('Erro de conexão WebSocket');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      setConnectionError('Falha ao criar conexão WebSocket');
    }
  }, [token, clearTimeouts, calculateReconnectDelay, startPingInterval]);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearTimeouts();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão solicitada pelo usuário');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, [clearTimeouts]);

  const retryConnection = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connect();
  }, [connect]);

  // Connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage,
    connect: retryConnection,
    disconnect
  };
}
