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
  total_batches: number; // Track total number of batches completed
  pause_start_time?: Date; // Track when pause started
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
  handleWebSocketBatchUpdate: (data: Record<string, unknown>) => void;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

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
      if (parsed.batchStatus?.pause_start_time) {
        parsed.batchStatus.pause_start_time = new Date(parsed.batchStatus.pause_start_time);
      }

      // Add default values for new fields if they don't exist (migration)
      if (parsed.batchStatus && !('total_batches' in parsed.batchStatus)) {
        parsed.batchStatus.total_batches = parsed.batchStatus.batch_number || 1;
      }
      if (parsed.batchStatus && !('pause_start_time' in parsed.batchStatus)) {
        parsed.batchStatus.pause_start_time = undefined;
      }

      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
  }
  return null;
};

const saveSessionToStorage = (sessionState: SessionState, data: Record<string, unknown>) => {
  try {
    const key = getSessionKey(sessionState);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save session to storage:', error);
  }
};

export function useProductionSession(
  sessionState: SessionState | null,
  _sendMessage?: (message: WebSocketMessage) => void,
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
        // For running sessions, calculate current elapsed time minus pause duration
        else if (storedSession.batchStatus?.start_time && storedSession.batchStatus?.status === 'IN_PROGRESS') {
          const now = new Date();
          const startTime = storedSession.batchStatus.start_time;
          const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const pauseDurationSeconds = (storedSession.batchStatus.pause_duration_minutes || 0) * 60;
          const workingElapsed = Math.max(0, totalElapsed - pauseDurationSeconds);
          setElapsedSeconds(workingElapsed);
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

  // Save production entry with specific duration (used when completing session)
  const saveProductionEntryWithDuration = useCallback(async (durationSeconds: number, endTime: Date) => {
    if (!sessionState || !batchStatus?.start_time) return;

    try {
      console.log('saveProductionEntryWithDuration called with:', {
        durationSeconds,
        batchStatus,
        sessionState
      });

      // Use the actual number of batches completed during the session
      const bateladas = batchStatus.total_batches;

      await makeAuthenticatedRequest('/production/batches/simple', {
        method: 'POST',
        body: JSON.stringify({
          product: sessionState.product,
          shift: sessionState.shift,
          date: sessionState.date,
          startTime: batchStatus.start_time,
          endTime,
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
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
          batch_number: 1,
          total_batches: 1,
          pause_start_time: undefined
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
            setBatchStatus(prev => prev ? {
              ...prev,
              status: 'PAUSED',
              pause_start_time: now
            } : null);
            console.log('Production paused');
          }
          break;

        case 'resume':
          if (batchStatus?.status === 'PAUSED') {
            // Calculate how long we were paused
            let newPauseDuration = batchStatus.pause_duration_minutes;
            if (batchStatus.pause_start_time) {
              const pauseDurationMs = now.getTime() - batchStatus.pause_start_time.getTime();
              const pauseDurationMinutes = Math.floor(pauseDurationMs / 60000);
              newPauseDuration += pauseDurationMinutes;
            }

            setBatchStatus(prev => prev ? {
              ...prev,
              status: 'IN_PROGRESS',
              pause_duration_minutes: newPauseDuration,
              pause_start_time: undefined
            } : null);
            console.log('Production resumed');
          }
          break;

        case 'stop':
        case 'complete':
          if (batchStatus?.status === 'IN_PROGRESS' || batchStatus?.status === 'PAUSED') {
            // Calculate final pause duration if currently paused
            let finalPauseDuration = batchStatus.pause_duration_minutes;
            if (batchStatus.status === 'PAUSED' && batchStatus.pause_start_time) {
              const pauseDurationMs = now.getTime() - batchStatus.pause_start_time.getTime();
              const pauseDurationMinutes = Math.floor(pauseDurationMs / 60000);
              finalPauseDuration += pauseDurationMinutes;
            }

            // Calculate final elapsed time minus pause duration
            const totalElapsedSeconds = batchStatus.start_time
              ? Math.floor((now.getTime() - batchStatus.start_time.getTime()) / 1000)
              : elapsedSeconds;

            const finalElapsedSeconds = Math.max(0, totalElapsedSeconds - (finalPauseDuration * 60));

            console.log('Before completing session:', {
              currentElapsedSeconds: elapsedSeconds,
              totalElapsedSeconds,
              pauseDurationMinutes: finalPauseDuration,
              finalElapsedSeconds,
              batchStatus: batchStatus,
              startTime: batchStatus.start_time
            });

            // Update elapsed seconds with final value
            setElapsedSeconds(finalElapsedSeconds);

            const endTime = new Date()

            setBatchStatus(prev => prev ? {
              ...prev,
              status: 'COMPLETED',
              end_time: endTime,
              pause_duration_minutes: finalPauseDuration,
              pause_start_time: undefined
            } : null);

            // Save production entry with final elapsed time
            await saveProductionEntryWithDuration(finalElapsedSeconds, endTime);

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
  }, [batchId, sessionState, batchStatus, elapsedSeconds, saveProductionEntryWithDuration]);

  const startBatch = useCallback(() => performBatchAction('start'), [performBatchAction]);
  const pauseBatch = useCallback(() => performBatchAction('pause'), [performBatchAction]);
  const resumeBatch = useCallback(() => performBatchAction('resume'), [performBatchAction]);
  const stopBatch = useCallback(() => performBatchAction('stop'), [performBatchAction]);

  const createNewBatch = useCallback(async () => {
    if (!sessionState) {
      setError('Sessão não encontrada');
      return;
    }

    // For production tracking, increment batch number and total batches locally
    if (batchStatus) {
      setBatchStatus(prev => prev ? {
        ...prev,
        batch_number: prev.batch_number + 1,
        total_batches: prev.total_batches + 1
      } : null);
      console.log('New batch started, total batches:', (batchStatus.total_batches + 1));
    }
  }, [sessionState, batchStatus]);

  const refreshBatchStatus = useCallback(async () => {
    // For local production tracking, this is not needed
    // Status is managed locally in the state
    return;
  }, []);

  const handleWebSocketBatchUpdate = useCallback((data: Record<string, unknown>) => {
    if (data.batchId === batchId) {
      // Update batch status from WebSocket data
      const newStatus = data.new_status || data.status;
      if (newStatus && typeof newStatus === 'string') {
        setBatchStatus(prev => prev ? {
          ...prev,
          status: newStatus as BatchStatus['status']
        } : null);
      }

      // Update elapsed seconds if provided (from timer broadcasts)
      if (data.elapsedSeconds !== undefined && typeof data.elapsedSeconds === 'number') {
        setElapsedSeconds(data.elapsedSeconds);
      }

      // Update batch number if provided
      if (data.batchNumber !== undefined && typeof data.batchNumber === 'number') {
        const batchNumber = data.batchNumber as number;
        setBatchStatus(prev => prev ? {
          ...prev,
          batch_number: batchNumber
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

      // Calculate total time elapsed since start
      const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

      // Subtract pause duration to get actual working time
      const pauseDurationSeconds = batchStatus.pause_duration_minutes * 60;
      const workingElapsed = Math.max(0, totalElapsed - pauseDurationSeconds);

      setElapsedSeconds(workingElapsed);

      // Schedule next update
      timeoutId = window.setTimeout(updateTimer, 1000);
    };

    // Start the fallback timer after a small delay to allow WebSocket updates to take precedence
    timeoutId = window.setTimeout(updateTimer, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, batchStatus?.start_time, batchStatus?.pause_duration_minutes]);

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
