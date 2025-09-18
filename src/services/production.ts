import { api } from './api';

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

// Products API  
export const productService = {
  getAll: async (): Promise<{ data: Product[] }> => {
    const response = await api.get('/products');
    return response.data;
  }
};
