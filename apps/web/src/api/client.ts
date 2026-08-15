import type { ZodSchema } from 'zod';

const BASE_URL = '/api';

export async function apiGet<T>(path: string, schema: ZodSchema<T>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }

  const parsed = schema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error(`Invalid response from ${path}`);
  }

  return parsed.data;
}
