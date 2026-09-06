import { describe, it, expect, afterEach, vi } from 'vitest';
import { registerCascadeTools, unregisterCascadeTools } from '../index';
import { useWebMcpStatusStore } from '../status';
import type { ModelContextTool } from '../types';
import { FakeModelContext } from './fakeModelContext';
import { logger } from '@/lib/utils/logger';

function makeTool(name: string, overrides: Partial<ModelContextTool> = {}): ModelContextTool {
  return {
    name,
    description: `Test tool ${name}`,
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => ({ ok: true }),
    ...overrides,
  };
}

describe('registerCascadeTools', () => {
  afterEach(() => {
    unregisterCascadeTools();
    useWebMcpStatusStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('reports unsupported, logs one info line, and registers nothing when the API is absent', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});

    const result = await registerCascadeTools({ modelContext: null, tools: [makeTool('cascade_a')] });

    expect(result).toBe('unsupported');
    expect(info).toHaveBeenCalledTimes(1);
    expect(useWebMcpStatusStore.getState().status).toBe('unsupported');
  });

  it('registers every tool with the shared abort signal and reports the count', async () => {
    const fake = new FakeModelContext();
    const tools = [makeTool('cascade_a'), makeTool('cascade_b')];

    const result = await registerCascadeTools({ modelContext: fake, tools });

    expect(result).toBe('registered');
    expect((await fake.getTools()).map((t) => t.name)).toEqual(['cascade_a', 'cascade_b']);
    expect(useWebMcpStatusStore.getState()).toMatchObject({ status: 'registered', toolCount: 2 });
  });

  it('unregisters every tool when torn down', async () => {
    const fake = new FakeModelContext();
    await registerCascadeTools({ modelContext: fake, tools: [makeTool('cascade_a')] });

    unregisterCascadeTools();

    expect(await fake.getTools()).toEqual([]);
    expect(useWebMcpStatusStore.getState().status).toBe('idle');
  });

  it('re-registers cleanly instead of hitting the duplicate-name rejection', async () => {
    const fake = new FakeModelContext();
    const tools = [makeTool('cascade_a')];
    await registerCascadeTools({ modelContext: fake, tools });

    const result = await registerCascadeTools({ modelContext: fake, tools });

    expect(result).toBe('registered');
    expect((await fake.getTools()).map((t) => t.name)).toEqual(['cascade_a']);
  });

  it('treats a teardown during registration as a cancellation, not an error', async () => {
    const fake = new FakeModelContext();
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const tools = [makeTool('cascade_a'), makeTool('cascade_b'), makeTool('cascade_c')];

    const pending = registerCascadeTools({ modelContext: fake, tools });
    unregisterCascadeTools();
    const result = await pending;

    expect(result).toBe('cancelled');
    expect(error).not.toHaveBeenCalled();
    expect(await fake.getTools()).toEqual([]);
    expect(useWebMcpStatusStore.getState().status).toBe('idle');
  });

  it('reports an error and rolls back when the browser rejects a tool', async () => {
    const fake = new FakeModelContext();
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const tools = [makeTool('cascade_a'), makeTool('', { description: 'invalid: empty name' })];

    const result = await registerCascadeTools({ modelContext: fake, tools });

    expect(result).toBe('error');
    expect(error).toHaveBeenCalledTimes(1);
    expect(await fake.getTools()).toEqual([]);
    expect(useWebMcpStatusStore.getState().status).toBe('error');
  });
});
