import { api } from './api';

// Types for production data
export interface ProductionPlanData {
  product_id: string;
  planned_quantity: number;
  shift: number;
  planned_date: string; // YYYY-MM-DD format
}

export interface BatchData {
  production_plan_id: string;
  batch_number: number;
  estimated_kg: number;
}

export interface BatchAction {
  action: 'start' | 'pause' | 'resume' | 'complete' | 'stop';
}

export interface BatchStatus {
  id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'STOPPED';
  start_time?: string;
  end_time?: string;
  pause_duration_minutes: number;
  estimated_kg: number;
  production_plan_id: string;
  batch_number: number;
  metrics?: {
    duration_minutes?: number;
    effective_duration_minutes?: number;
    efficiency_percentage?: number;
  };
}

export interface Product {
  id: string;
  name: string;
  unit: 'KG' | 'UN';
  active: boolean;
}

// Production Plan API
export const productionPlanService = {
  create: async (data: ProductionPlanData) => {
    const response = await api.post('/director/production-plans', data);
    return response.data;
  },
  
  findByProductShiftDate: async (productId: string, shift: string, date: string) => {
    const response = await api.get('/director/production-plans', {
      params: { product_id: productId, shift, planned_date: date }
    });
    return response.data;
  },
};

// Batch API
export const batchService = {
  create: async (data: BatchData) => {
    const response = await api.post('/production/batches', data);
    return response.data;
  },
  
  performAction: async (batchId: string, action: BatchAction) => {
    const response = await api.post(`/production/batches/${batchId}/actions`, action);
    return response.data;
  },
  
  getStatus: async (batchId: string): Promise<{ data: BatchStatus }> => {
    const response = await api.get(`/production/batches/${batchId}/status`);
    return response.data;
  },
  
  getByPlan: async (planId: string) => {
    const response = await api.get(`/production/plans/${planId}/batches`);
    return response.data;
  }
};

// Products API  
export const productService = {
  getAll: async (): Promise<{ data: Product[] }> => {
    const response = await api.get('/products');
    return response.data;
  }
};

// Helper function to convert date format from DD-MM-YYYY to YYYY-MM-DD
export const convertDateFormat = (ddmmyyyy: string): string => {
  const [day, month, year] = ddmmyyyy.split('-');
  return `${year}-${month}-${day}`;
};

// Helper function to map shift numbers to backend enum
export const mapShiftToBackend = (shift: number): string => {
  const shiftMap: Record<number, string> = {
    1: 'MORNING',
    2: 'AFTERNOON', 
    3: 'NIGHT'
  };
  return shiftMap[shift] || 'MORNING';
};

// NEW SIMPLIFIED BATCH CREATION API
export const simpleBatchService = {
  create: async (data: {
    product: string;
    shift: string;
    date: string;
    bateladas: number;
    duration: number;
  }) => {
    const response = await api.post('/production/batches/simple', data);
    return response.data;
  }
};
