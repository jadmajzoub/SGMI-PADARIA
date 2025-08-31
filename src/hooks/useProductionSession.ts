// COMMENTED OUT FOR WEBSOCKET REFACTOR - DO NOT DELETE
// This entire hook has been temporarily disabled during the websocket refactor

/*
ORIGINAL PRODUCTION SESSION HOOK - COMMENTED OUT

[... ALL THE ORIGINAL PRODUCTION SESSION HOOK CODE WAS HERE ...]

END OF ORIGINAL PRODUCTION SESSION HOOK
*/

// TEMPORARY PLACEHOLDER HOOK - PRODUCTION SESSION FUNCTIONALITY DISABLED
import type { Shift } from '../types/production';

interface SessionState {
  product: string;
  shift: Shift;
  date: string; // DD-MM-YYYY format
}

export function useProductionSession(sessionState: SessionState | null) {
  // Return disabled state
  return {
    // State
    batchId: null,
    productionPlanId: null,
    batchStatus: null,
    isLoading: false,
    error: 'Sessão de produção desabilitada durante refatoração',
    currentBatch: 0,
    elapsedSeconds: 0,
    
    // Computed values
    isRunning: false,
    isPaused: false,
    canStart: false,
    canPause: false,
    canResume: false,
    
    // Actions (all disabled)
    startBatch: () => console.warn('Sessão de produção desabilitada'),
    pauseBatch: () => console.warn('Sessão de produção desabilitada'),
    resumeBatch: () => console.warn('Sessão de produção desabilitada'),
    stopBatch: () => console.warn('Sessão de produção desabilitada'),
    createNewBatch: () => console.warn('Sessão de produção desabilitada'),
    refreshBatchStatus: () => console.warn('Sessão de produção desabilitada'),
    handleWebSocketBatchUpdate: () => console.warn('Sessão de produção desabilitada')
  };
}
