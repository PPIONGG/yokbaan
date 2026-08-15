import { describe, expect, it, vi } from 'vitest';
import { fetchHealth } from './health';

describe('fetchHealth', () => {
  it('returns the parsed body when the API responds correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      }),
    );

    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('throws when the API returns a shape the schema rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'broken' }),
      }),
    );

    await expect(fetchHealth()).rejects.toThrow('Invalid response from /health');
  });
});
