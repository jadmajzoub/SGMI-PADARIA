import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: Date;
}

const WEBSOCKET_URL = 'ws://localhost:4000/ws';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    if (!token) {
      setConnectionError('Token é necessário para conectar');
      return;
    }

    try {
      const url = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('Conectado ao WebSocket');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send ping to keep connection alive
        sendMessage({ type: 'ping' });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle pong response
          if (message.type === 'pong') {
            console.log('Pong recebido');
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Conexão WebSocket fechada:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          setConnectionError(`Reconectando... (tentativa ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Falha ao conectar após várias tentativas');
        }
      };

      ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setConnectionError('Erro de conexão WebSocket');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      setConnectionError('Falha ao criar conexão WebSocket');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão solicitada pelo usuário');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date()
      }));
    } else {
      console.warn('WebSocket não está conectado');
    }
  };

  // Connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage,
    connect,
    disconnect
  };
}