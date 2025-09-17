import { useCallback, useEffect, useState } from 'react';
import type { Shift } from '../types/production';
import type { WebSocketMessage } from './useWebSocket';

interface SessionState {
  product: string;
  shift: Shift;
  date: string; // DD-MM-YYYY format
}

interface BatchStatus {
  id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'STOPPED';
  start_time?: Date;
  end_time?: Date;
  pause_duration_minutes: number;
  estimated_kg: number;
  production_plan_id: string;
  batch_number: number;
}

interface ProductionSessionHook {
  // State
  batchId: string | null;
  productionPlanId: string | null;
  batchStatus: BatchStatus | null;
  isLoading: boolean;
  error: string | null;
  currentBatch: number;
  elapsedSeconds: number;

  // Computed values
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;

  // Actions
  startBatch: () => Promise<void>;
  pauseBatch: () => Promise<void>;
  resumeBatch: () => Promise<void>;
  stopBatch: () => Promise<void>;
  createNewBatch: () => Promise<void>;
  refreshBatchStatus: () => Promise<void>;
  handleWebSocketBatchUpdate: (data: any) => void;
}

const API_BASE_URL = 'http://localhost:4000/api';

// Helper functions for session persistence
const getSessionKey = (sessionState: SessionState) =>
  `production_session_${sessionState.product}_${sessionState.shift}_${sessionState.date}`;

const loadSessionFromStorage = (sessionState: SessionState) => {
  try {
    const key = getSessionKey(sessionState);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert ISO strings back to Date objects
      if (parsed.batchStatus?.start_time) {
        parsed.batchStatus.start_time = new Date(parsed.batchStatus.start_time);
      }
      if (parsed.batchStatus?.end_time) {
        parsed.batchStatus.end_time = new Date(parsed.batchStatus.end_time);
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
  }
  return null;
};

const saveSessionToStorage = (sessionState: SessionState, data: any) => {
  try {
    const key = getSessionKey(sessionState);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save session to storage:', error);
  }
};

const clearSessionFromStorage = (sessionState: SessionState) => {
  try {
    const key = getSessionKey(sessionState);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear session from storage:', error);
  }
};

export function useProductionSession(
  sessionState: SessionState | null,
  sendMessage?: (message: WebSocketMessage) => void,
  authToken?: string
): ProductionSessionHook {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [productionPlanId, setProductionPlanId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Computed values
  const isRunning = batchStatus?.status === 'IN_PROGRESS';
  const isPaused = batchStatus?.status === 'PAUSED';
  const isCompleted = batchStatus?.status === 'COMPLETED';
  const canStart = !batchStatus || batchStatus?.status === 'PLANNED';
  const canPause = batchStatus?.status === 'IN_PROGRESS';
  const canResume = batchStatus?.status === 'PAUSED';
  const currentBatch = batchStatus?.batch_number || 0;

  // API helper function
  const makeAuthenticatedRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!authToken) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }

    return response.json();
  }, [authToken]);


  // Initialize production session
  const initializeSession = useCallback(async () => {
    if (!sessionState) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to load existing session from localStorage
      const storedSession = loadSessionFromStorage(sessionState);

      if (storedSession) {
        console.log('Loading session from storage:', storedSession);
        setBatchId(storedSession.batchId);
        setProductionPlanId(storedSession.productionPlanId);
        setBatchStatus(storedSession.batchStatus);

        // For completed sessions, use the stored elapsed seconds
        if (storedSession.batchStatus?.status === 'COMPLETED') {
          setElapsedSeconds(storedSession.elapsedSeconds || 0);
          console.log('Loaded completed session');
        }
        // For running sessions, calculate current elapsed time
        else if (storedSession.batchStatus?.start_time && storedSession.batchStatus?.status === 'IN_PROGRESS') {
          const now = new Date();
          const startTime = storedSession.batchStatus.start_time;
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setElapsedSeconds(elapsed);
          console.log('Resumed running session');
        } else {
          setElapsedSeconds(storedSession.elapsedSeconds || 0);
          console.log('Resumed paused session');
        }

        console.log('Session loaded successfully');
        return;
      }

      // No stored session or session was completed, start fresh
      console.log('Initializing new production tracking session for:', {
        product: sessionState.product,
        shift: sessionState.shift,
        date: sessionState.date
      });

      setBatchId(null);
      setProductionPlanId(null);
      setBatchStatus(null);
      setElapsedSeconds(0);

      console.log('Ready to start production tracking');
    } catch (err) {
      console.error('Erro ao inicializar sessão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao inicializar sessão');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState]);

  // Batch actions
  const performBatchAction = useCallback(async (action: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // If we don't have a session yet and action is 'start', start tracking
      if (!batchId && action === 'start' && sessionState) {
        console.log('Starting production tracking session');

        // For production tracking, we create a simple local session
        // This will be saved as a production entry when the session ends
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setBatchId(sessionId);

        // Set initial batch status for tracking
        setBatchStatus({
          id: sessionId,
          status: 'IN_PROGRESS',
          start_time: new Date(),
          end_time: undefined,
          pause_duration_minutes: 0,
          estimated_kg: 0,
          production_plan_id: '', // Not needed for tracking
          batch_number: 1
        });

        setElapsedSeconds(0);
        console.log('Production tracking session started:', sessionId);
        return;
      }

      if (!batchId) {
        setError('Nenhuma sessão de produção ativa');
        return;
      }

      // Handle production tracking actions locally
      const now = new Date();

      switch (action) {
        case 'pause':
          if (batchStatus?.status === 'IN_PROGRESS') {
            setBatchStatus(prev => prev ? { ...prev, status: 'PAUSED' } : null);
            console.log('Production paused');
          }
          break;

        case 'resume':
          if (batchStatus?.status === 'PAUSED') {
            setBatchStatus(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
            console.log('Production resumed');
          }
          break;

        case 'stop':
        case 'complete':
          if (batchStatus?.status === 'IN_PROGRESS' || batchStatus?.status === 'PAUSED') {
            // Calculate final elapsed time at the moment of completion
            const finalElapsedSeconds = batchStatus.start_time
              ? Math.floor((now.getTime() - batchStatus.start_time.getTime()) / 1000)
              : elapsedSeconds;

            console.log('Before completing session:', {
              currentElapsedSeconds: elapsedSeconds,
              finalElapsedSeconds,
              batchStatus: batchStatus,
              startTime: batchStatus.start_time
            });

            // Update elapsed seconds with final value
            setElapsedSeconds(finalElapsedSeconds);

            setBatchStatus(prev => prev ? {
              ...prev,
              status: 'COMPLETED',
              end_time: now
            } : null);

            // Save production entry with final elapsed time
            await saveProductionEntryWithDuration(finalElapsedSeconds);

            // Keep completed session in storage for persistence through refresh
            console.log('Production session completed and saved');
          }
          break;

        default:
          console.warn('Unknown action:', action);
      }
    } catch (err) {
      console.error(`Erro ao executar ação ${action}:`, err);
      setError(err instanceof Error ? err.message : `Erro ao executar ${action}`);
    } finally {
      setIsLoading(false);
    }
  }, [batchId, sendMessage, makeAuthenticatedRequest, sessionState]);

  // Save production entry when session completes
  const saveProductionEntry = useCallback(async () => {
    if (!sessionState || !batchStatus?.start_time) return;

    try {
      console.log('saveProductionEntry called with:', {
        elapsedSeconds,
        batchStatus,
        sessionState
      });

      // Use the current elapsed seconds directly - no conversion needed
      const durationSeconds = elapsedSeconds;

      // Use the actual number of batches completed during the session
      const bateladas = batchStatus.batch_number;

      await makeAuthenticatedRequest('/production/batches/simple', {
        method: 'POST',
        body: JSON.stringify({
          product: sessionState.product,
          shift: sessionState.shift,
          date: sessionState.date,
          bateladas,
          duration: durationSeconds
        }),
      });

      console.log('Production entry saved:', {
        product: sessionState.product,
        shift: sessionState.shift,
        date: sessionState.date,
        bateladas,
        duration: durationSeconds,
        elapsedSeconds,
        displayTime: `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`
      });
    } catch (error) {
      console.error('Failed to save production entry:', error);
      setError('Erro ao salvar produção');
    }
  }, [sessionState, batchStatus, elapsedSeconds, makeAuthenticatedRequest]);

  // Save production entry with specific duration (used when completing session)
  const saveProductionEntryWithDuration = useCallback(async (durationSeconds: number) => {
    if (!sessionState || !batchStatus?.start_time) return;

    try {
      console.log('saveProductionEntryWithDuration called with:', {
        durationSeconds,
        batchStatus,
        sessionState
      });

      // Use the actual number of batches completed during the session
      const bateladas = batchStatus.batch_number;

      await makeAuthenticatedRequest('/production/batches/simple', {
        method: 'POST',
        body: JSON.stringify({
          product: sessionState.product,
          shift: sessionState.shift,
          date: sessionState.date,
          bateladas,
          duration: durationSeconds
        }),
      });

      console.log('Production entry saved with specific duration:', {
        product: sessionState.product,
        shift: sessionState.shift,
        date: sessionState.date,
        bateladas,
        duration: durationSeconds,
        displayTime: `${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}`
      });
    } catch (error) {
      console.error('Failed to save production entry with duration:', error);
      setError('Erro ao salvar produção');
    }
  }, [sessionState, batchStatus, makeAuthenticatedRequest]);

  const startBatch = useCallback(() => performBatchAction('start'), [performBatchAction]);
  const pauseBatch = useCallback(() => performBatchAction('pause'), [performBatchAction]);
  const resumeBatch = useCallback(() => performBatchAction('resume'), [performBatchAction]);
  const stopBatch = useCallback(() => performBatchAction('stop'), [performBatchAction]);

  const createNewBatch = useCallback(async () => {
    if (!sessionState) {
      setError('Sessão não encontrada');
      return;
    }

    // For production tracking, increment batch number locally
    if (batchStatus) {
      setBatchStatus(prev => prev ? {
        ...prev,
        batch_number: prev.batch_number + 1
      } : null);
      console.log('New batch started, total batches:', (batchStatus.batch_number + 1));
    }
  }, [sessionState, batchStatus]);

  const refreshBatchStatus = useCallback(async () => {
    // For local production tracking, this is not needed
    // Status is managed locally in the state
    return;
  }, []);

  const handleWebSocketBatchUpdate = useCallback((data: any) => {
    if (data.batchId === batchId) {
      // Update batch status from WebSocket data
      setBatchStatus(prev => prev ? {
        ...prev,
        status: data.new_status || data.status || prev.status
      } : null);

      // Update elapsed seconds if provided (from timer broadcasts)
      if (data.elapsedSeconds !== undefined) {
        setElapsedSeconds(data.elapsedSeconds);
      }

      // Update batch number if provided
      if (data.batchNumber !== undefined) {
        setBatchStatus(prev => prev ? {
          ...prev,
          batch_number: data.batchNumber
        } : null);
      }
    }
  }, [batchId]);

  // Fallback timer effect for elapsed seconds (when WebSocket is not available)
  useEffect(() => {
    if (!isRunning || !batchStatus?.start_time) return;

    // Only use local timer as fallback if WebSocket timer updates aren't coming through
    let timeoutId: number;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(batchStatus.start_time!);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);

      // Schedule next update
      timeoutId = window.setTimeout(updateTimer, 1000);
    };

    // Start the fallback timer after a small delay to allow WebSocket updates to take precedence
    timeoutId = window.setTimeout(updateTimer, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, batchStatus?.start_time]);

  // Save session to storage whenever state changes
  useEffect(() => {
    if (sessionState && batchStatus) {
      const sessionData = {
        batchId,
        productionPlanId,
        batchStatus,
        elapsedSeconds
      };
      saveSessionToStorage(sessionState, sessionData);
    }
  }, [sessionState, batchId, productionPlanId, batchStatus, elapsedSeconds]);

  // Initialize session when sessionState changes
  useEffect(() => {
    if (sessionState) {
      initializeSession();
    }
  }, [sessionState, initializeSession]);

  return {
    // State
    batchId,
    productionPlanId,
    batchStatus,
    isLoading,
    error,
    currentBatch,
    elapsedSeconds,

    // Computed values
    isRunning,
    isPaused,
    isCompleted,
    canStart,
    canPause,
    canResume,

    // Actions
    startBatch,
    pauseBatch,
    resumeBatch,
    stopBatch,
    createNewBatch,
    refreshBatchStatus,
    handleWebSocketBatchUpdate
  };
}
