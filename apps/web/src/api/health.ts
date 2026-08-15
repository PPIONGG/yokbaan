import { healthResponseSchema, type HealthResponse } from '@yokbaan/shared';
import { apiGet } from './client';

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet('/health', healthResponseSchema);
}
