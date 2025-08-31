import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  productionPlanService, 
  batchService, 
  productService,
  convertDateFormat, 
  mapShiftToBackend,
  type BatchStatus,
  type Product
} from '../services/production';
import type { Shift } from '../types/production';

interface SessionState {
  product: string;
  shift: Shift;
  date: string; // DD-MM-YYYY format
}

interface ProductionSessionData {
  batchId: string | null;
  productionPlanId: string | null;
  batchStatus: BatchStatus | null;
  isLoading: boolean;
  error: string | null;
  currentBatch: number;
  elapsedSeconds: number;
}

export function useProductionSession(sessionState: SessionState | null) {
  const [sessionData, setSessionData] = useState<ProductionSessionData>({
    batchId: null,
    productionPlanId: null,
    batchStatus: null,
    isLoading: false,
    error: null,
    currentBatch: 1,
    elapsedSeconds: 0
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const timerRef = useRef<number | null>(null);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productService.getAll();
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  const initializeSession = useCallback(async () => {
    if (!sessionState) return;

    setSessionData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Find the product by name
      const product = products.find(p => p.name === sessionState.product);
      if (!product) {
        throw new Error(`Produto "${sessionState.product}" não encontrado`);
      }

      // Check if we already have a production plan for this session
      const existingBatch = await findExistingBatch(product.id, sessionState.shift, sessionState.date);
      
      if (existingBatch) {
        // Restore existing session
        await restoreExistingSession(existingBatch);
      } else {
        // Check if production plan exists
        const existingPlan = await findExistingProductionPlan(product.id, sessionState.shift, sessionState.date);
        if (existingPlan) {
          // Production plan exists but no active batch found
          // Try to get the most recent batch or create a new one
          await handleExistingProductionPlan(existingPlan);
        } else {
          // Create new production plan and batch
          await createNewSession(product);
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSessionData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao inicializar sessão'
      }));
    }
  }, [sessionState, products]);

  const findExistingProductionPlan = async (productId: string, shift: Shift, date: string) => {
    try {
      const backendShift = mapShiftToBackend(shift);
      const backendDate = convertDateFormat(date);
      
      console.log('Searching for production plan:', { productId, backendShift, backendDate });
      
      const planResponse = await productionPlanService.findByProductShiftDate(
        productId, 
        backendShift, 
        backendDate
      );
      
      console.log('Production plan response:', planResponse);
      
      if (planResponse.success && planResponse.data && Array.isArray(planResponse.data)) {
        // Filter the array to find the exact matching plan
        const matchingPlan = planResponse.data.find((plan: any) => 
          plan.productId === productId && 
          plan.shift === backendShift && 
          new Date(plan.plannedDate).toDateString() === new Date(backendDate).toDateString()
        );
        
        console.log('Found matching plan:', matchingPlan);
        return matchingPlan || null;
      }
      
      return null;
    } catch (error) {
      console.log('Error finding production plan:', error);
      return null;
    }
  };

  const handleExistingProductionPlan = async (existingPlan: any) => {
    try {
      console.log('Handling existing production plan:', existingPlan);
      
      if (!existingPlan?.id) {
        throw new Error('Production plan ID is missing');
      }
      
      // First, try to get existing batches and use the most recent one
      try {
        const batchesResponse = await batchService.getByPlan(existingPlan.id);
        const existingBatches = batchesResponse.success ? batchesResponse.data || [] : [];
        
        if (existingBatches.length > 0) {
          // Use the most recent existing batch
          const mostRecentBatch = existingBatches[existingBatches.length - 1];
          console.log(`Found ${existingBatches.length} existing batches, using most recent batch:`, mostRecentBatch);
          await restoreExistingSession(mostRecentBatch);
          return;
        }
      } catch (error) {
        console.log('Could not fetch existing batches, will try to create new batch:', error);
      }
      
      // If no existing batches found or fetch failed, create session without active batch
      // User can manually create new batches using "Nova Batelada" button
      console.log('No existing batches found or fetch failed, creating session without active batch');
      setSessionData(prev => ({
        ...prev,
        batchId: null,
        productionPlanId: existingPlan.id,
        batchStatus: null,
        isLoading: false,
        error: null,
        currentBatch: 0,
        elapsedSeconds: 0
      }));
      
    } catch (error) {
      throw error;
    }
  };

  const createBatchForExistingPlan = async (existingPlan: any) => {
    try {
      console.log('Creating batch for existing plan:', existingPlan);
      
      if (!existingPlan?.id) {
        throw new Error('Production plan ID is missing');
      }
      
      // Get existing batches to determine next batch number
      let existingBatches: any[] = [];
      let nextBatchNumber = 1;
      
      try {
        const batchesResponse = await batchService.getByPlan(existingPlan.id);
        existingBatches = batchesResponse.success ? batchesResponse.data || [] : [];
        nextBatchNumber = existingBatches.length + 1;
        console.log(`Found ${existingBatches.length} existing batches, creating batch number ${nextBatchNumber}`);
      } catch (error) {
        // If we can't fetch batches due to validation or other issues,
        // try to create starting from batch 1 and increment on conflicts
        console.log('Could not fetch existing batches, will try creating from batch 1:', error);
        nextBatchNumber = 1;
      }
      
      // Create new batch with retry logic for conflicts
      let batchResponse: any = null;
      let maxAttempts = 5; // Limit attempts to prevent infinite loops
      
      while (maxAttempts > 0 && !batchResponse) {
        try {
          console.log(`Attempting to create batch number ${nextBatchNumber}`);
          batchResponse = await batchService.create({
            production_plan_id: existingPlan.id,
            batch_number: nextBatchNumber,
            estimated_kg: 25
          });
          break; // Success, exit loop
        } catch (error: any) {
          if (error?.response?.status === 409) {
            // Batch number already exists, try next number
            console.log(`Batch number ${nextBatchNumber} already exists, trying ${nextBatchNumber + 1}`);
            nextBatchNumber++;
            maxAttempts--;
          } else {
            // Other error, throw it
            throw error;
          }
        }
      }
      
      if (!batchResponse) {
        throw new Error(`Could not create batch after ${5} attempts`);
      }
      
      const batchId = batchResponse.data.id;
      
      // Create initial batch status
      const initialBatchStatus: BatchStatus = {
        id: batchId,
        status: 'PLANNED',
        start_time: undefined,
        end_time: undefined,
        pause_duration_minutes: 0,
        estimated_kg: 25,
        production_plan_id: existingPlan.id,
        batch_number: nextBatchNumber
      };
      
      setSessionData(prev => ({
        ...prev,
        batchId,
        productionPlanId: existingPlan.id,
        batchStatus: initialBatchStatus,
        isLoading: false,
        error: null,
        currentBatch: nextBatchNumber,
        elapsedSeconds: 0
      }));
      
    } catch (error) {
      throw error;
    }
  };

  // Initialize or restore session when sessionState changes and products are loaded
  useEffect(() => {
    if (!sessionState) {
      setSessionData(prev => ({
        ...prev,
        batchId: null,
        productionPlanId: null,
        batchStatus: null,
        elapsedSeconds: 0
      }));
      return;
    }

    // Wait for products to be loaded before initializing session
    if (products.length === 0) {
      console.log('Waiting for products to load...');
      return;
    }

    initializeSession();
  }, [sessionState, products, initializeSession]);

  // Timer effect for calculating elapsed time
  useEffect(() => {
    if (sessionData.batchStatus?.status === 'IN_PROGRESS') {
      timerRef.current = setInterval(() => {
        setSessionData(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionData.batchStatus?.status]);

  const findExistingBatch = async (productId: string, shift: Shift, date: string) => {
    try {
      // Convert shift and date to backend format
      const backendShift = mapShiftToBackend(shift);
      const backendDate = convertDateFormat(date);
      
      // Look for existing production plan
      const planResponse = await productionPlanService.findByProductShiftDate(
        productId, 
        backendShift, 
        backendDate
      );
      
      if (planResponse.success && planResponse.data && Array.isArray(planResponse.data)) {
        // Filter the array to find the exact matching plan
        const matchingPlan = planResponse.data.find((plan: any) => 
          plan.productId === productId && 
          plan.shift === backendShift && 
          new Date(plan.plannedDate).toDateString() === new Date(backendDate).toDateString()
        );
        
        if (matchingPlan) {
          try {
            // Get batches for this production plan
            const batchesResponse = await batchService.getByPlan(matchingPlan.id);
            
            if (batchesResponse.success && batchesResponse.data?.length > 0) {
              // Return the most recent batch
              const batches = batchesResponse.data;
              return batches[batches.length - 1];
            }
          } catch (error) {
            // If we can't fetch batches (e.g., validation error), assume no existing batch
            console.log('Could not fetch batches for plan, assuming no existing batches:', error);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log('No existing production plan found, will create new one');
      return null;
    }
  };

  const createNewSession = async (product: Product) => {
    if (!sessionState) return;

    try {
      // Create production plan
      const planResponse = await productionPlanService.create({
        product_id: product.id,
        planned_quantity: 100, // Default quantity - could be made configurable
        shift: mapShiftToBackend(sessionState.shift) as any,
        planned_date: convertDateFormat(sessionState.date)
      });

      const productionPlanId = planResponse.data.id;

      // Create initial batch
      const batchResponse = await batchService.create({
        production_plan_id: productionPlanId,
        batch_number: 1,
        estimated_kg: 25 // Default batch size - could be made configurable
      });

      const batchId = batchResponse.data.id;

      // Create initial batch status since the batch was just created
      const initialBatchStatus: BatchStatus = {
        id: batchId,
        status: 'PLANNED',
        start_time: undefined,
        end_time: undefined,
        pause_duration_minutes: 0,
        estimated_kg: 25,
        production_plan_id: productionPlanId,
        batch_number: 1
      };

      setSessionData(prev => ({
        ...prev,
        batchId,
        productionPlanId,
        batchStatus: initialBatchStatus,
        isLoading: false,
        error: null,
        currentBatch: 1,
        elapsedSeconds: 0
      }));

    } catch (error) {
      throw error;
    }
  };

  const restoreExistingSession = async (existingBatch: any) => {
    console.log('Restoring existing session:', existingBatch);
    
    // Create batch status from existing batch
    const batchStatus: BatchStatus = {
      id: existingBatch.id,
      status: existingBatch.status || 'PLANNED',
      start_time: existingBatch.start_time,
      end_time: existingBatch.end_time,
      pause_duration_minutes: existingBatch.pause_duration_minutes || 0,
      estimated_kg: existingBatch.estimated_kg || 25,
      production_plan_id: existingBatch.production_plan_id,
      batch_number: existingBatch.batch_number || 1
    };
    
    // Calculate elapsed seconds if batch is running
    let elapsedSeconds = 0;
    if (batchStatus.start_time && batchStatus.status === 'IN_PROGRESS') {
      const startTime = new Date(batchStatus.start_time).getTime();
      const now = Date.now();
      const pauseMs = (batchStatus.pause_duration_minutes || 0) * 60 * 1000;
      elapsedSeconds = Math.floor((now - startTime - pauseMs) / 1000);
    }
    
    setSessionData(prev => ({
      ...prev,
      batchId: existingBatch.id,
      productionPlanId: existingBatch.production_plan_id,
      batchStatus,
      currentBatch: existingBatch.batch_number || 1,
      elapsedSeconds: Math.max(0, elapsedSeconds),
      isLoading: false,
      error: null
    }));
  };

  const refreshBatchStatus = useCallback(async () => {
    if (!sessionData.batchId) return;

    try {
      const response = await batchService.getStatus(sessionData.batchId);
      const batchStatus = response.data;
      
      // Calculate elapsed seconds if batch is running
      let elapsedSeconds = sessionData.elapsedSeconds;
      if (batchStatus.start_time && batchStatus.status === 'IN_PROGRESS') {
        const startTime = new Date(batchStatus.start_time).getTime();
        const now = Date.now();
        const pauseMs = (batchStatus.pause_duration_minutes || 0) * 60 * 1000;
        elapsedSeconds = Math.floor((now - startTime - pauseMs) / 1000);
      }

      setSessionData(prev => ({
        ...prev,
        batchStatus,
        elapsedSeconds: Math.max(0, elapsedSeconds)
      }));
    } catch (error) {
      // If the GET endpoint doesn't exist (404), just log it and continue
      // The WebSocket will provide status updates
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Batch status endpoint not available, relying on WebSocket updates');
      } else {
        console.error('Failed to refresh batch status:', error);
      }
    }
  }, [sessionData.batchId, sessionData.elapsedSeconds]);

  const performBatchAction = useCallback(async (action: 'start' | 'pause' | 'resume' | 'complete' | 'stop') => {
    if (!sessionData.batchId) return;

    try {
      setSessionData(prev => ({ ...prev, isLoading: true, error: null }));
      
      await batchService.performAction(sessionData.batchId, { action });
      
      // Refresh status after action
      await refreshBatchStatus();
      
      setSessionData(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error(`Failed to perform ${action} action:`, error);
      setSessionData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : `Falha ao executar ação: ${action}`
      }));
    }
  }, [sessionData.batchId, refreshBatchStatus]);

  const startBatch = useCallback(() => performBatchAction('start'), [performBatchAction]);
  const pauseBatch = useCallback(() => performBatchAction('pause'), [performBatchAction]);
  const resumeBatch = useCallback(() => performBatchAction('resume'), [performBatchAction]);
  const stopBatch = useCallback(() => performBatchAction('stop'), [performBatchAction]);
  
  const createNewBatch = useCallback(async () => {
    if (!sessionData.productionPlanId) return;

    try {
      setSessionData(prev => ({ ...prev, isLoading: true, error: null }));

      // Try to determine the next batch number, starting from current + 1 or 1
      let nextBatchNumber = Math.max(1, sessionData.currentBatch + 1);
      let batchResponse: any = null;
      let maxAttempts = 10; // Allow more attempts for manual creation
      
      while (maxAttempts > 0 && !batchResponse) {
        try {
          console.log(`Attempting to create batch number ${nextBatchNumber}`);
          batchResponse = await batchService.create({
            production_plan_id: sessionData.productionPlanId,
            batch_number: nextBatchNumber,
            estimated_kg: 25
          });
          break; // Success, exit loop
        } catch (error: any) {
          if (error?.response?.status === 409) {
            // Batch number already exists, try next number
            console.log(`Batch number ${nextBatchNumber} already exists, trying ${nextBatchNumber + 1}`);
            nextBatchNumber++;
            maxAttempts--;
          } else {
            // Other error, throw it
            throw error;
          }
        }
      }
      
      if (!batchResponse) {
        throw new Error(`Could not create batch after ${10} attempts`);
      }

      const newBatchId = batchResponse.data.id;
      
      // Create initial batch status for the new batch
      const newBatchStatus: BatchStatus = {
        id: newBatchId,
        status: 'PLANNED',
        start_time: undefined,
        end_time: undefined,
        pause_duration_minutes: 0,
        estimated_kg: 25,
        production_plan_id: sessionData.productionPlanId,
        batch_number: nextBatchNumber
      };
      
      setSessionData(prev => ({
        ...prev,
        batchId: newBatchId,
        batchStatus: newBatchStatus,
        currentBatch: nextBatchNumber,
        elapsedSeconds: 0,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to create new batch:', error);
      setSessionData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao criar nova batelada'
      }));
    }
  }, [sessionData.productionPlanId, sessionData.currentBatch]);

  // Handle WebSocket batch updates
  const handleWebSocketBatchUpdate = useCallback((data: any) => {
    if (data.batchId) {
      // If this is our current batch, update the status
      if (data.batchId === sessionData.batchId) {
        const updatedStatus: BatchStatus = {
          id: data.batchId,
          status: data.status || 'PLANNED',
          start_time: data.start_time,
          end_time: data.end_time,
          pause_duration_minutes: data.pause_duration_minutes || 0,
          estimated_kg: data.estimated_kg || 25,
          production_plan_id: data.production_plan_id || sessionData.productionPlanId || '',
          batch_number: data.batch_number || sessionData.currentBatch
        };
        
        setSessionData(prev => ({
          ...prev,
          batchStatus: updatedStatus,
          // Reset timer if status changed to non-running state
          elapsedSeconds: updatedStatus.status === 'IN_PROGRESS' ? prev.elapsedSeconds : 0
        }));
      }
    }
  }, [sessionData.batchId, sessionData.productionPlanId, sessionData.currentBatch]);

  return {
    // State
    ...sessionData,
    
    // Computed values
    isRunning: sessionData.batchStatus?.status === 'IN_PROGRESS',
    isPaused: sessionData.batchStatus?.status === 'PAUSED',
    canStart: sessionData.batchStatus?.status === 'PLANNED',
    canPause: sessionData.batchStatus?.status === 'IN_PROGRESS',
    canResume: sessionData.batchStatus?.status === 'PAUSED',
    
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