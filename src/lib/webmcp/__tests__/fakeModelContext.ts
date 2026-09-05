import type {
  ModelContext,
  ModelContextTool,
  RegisteredTool,
  RegisterToolOptions,
  ExecuteToolOptions,
} from '../types';

/**
 * In-memory stand-in for document.modelContext, shaped after the behavior
 * observed in Chrome 152: duplicate names reject with InvalidStateError,
 * an aborted signal removes the tool, executeTool takes a JSON string and
 * resolves to a JSON string, and every change fires "toolchange".
 */
export class FakeModelContext extends EventTarget implements ModelContext {
  ontoolchange: ((this: ModelContext, event: Event) => unknown) | null = null;
  private readonly tools = new Map<string, ModelContextTool>();

  async registerTool(tool: ModelContextTool, options: RegisterToolOptions = {}): Promise<void> {
    if (options.signal?.aborted) {
      throw options.signal.reason ?? new DOMException('Registration aborted', 'AbortError');
    }
    if (!tool.name || !tool.description) {
      throw new DOMException('Tool name and description are required', 'InvalidStateError');
    }
    if (this.tools.has(tool.name)) {
      throw new DOMException('Duplicate tool name', 'InvalidStateError');
    }

    this.tools.set(tool.name, tool);
    options.signal?.addEventListener(
      'abort',
      () => {
        this.tools.delete(tool.name);
        this.dispatchEvent(new Event('toolchange'));
      },
      { once: true }
    );
    this.dispatchEvent(new Event('toolchange'));
  }

  async getTools(): Promise<RegisteredTool[]> {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
      origin: 'http://localhost',
      window,
    }));
  }

  async executeTool(
    tool: RegisteredTool,
    input: string | object = '{}',
    options: ExecuteToolOptions = {}
  ): Promise<string> {
    const registered = this.tools.get(tool.name);
    if (!registered) throw new DOMException(`Unknown tool: ${tool.name}`, 'UnknownError');

    const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
    const signal = options.signal ?? new AbortController().signal;
    const result = await registered.execute(parsedInput, { signal });
    return JSON.stringify(result);
  }
}

/** Installs a fake on document (and optionally navigator) and returns a cleanup. */
export function installFakeModelContext(
  target: 'document' | 'navigator' = 'document'
): { fake: FakeModelContext; restore: () => void } {
  const fake = new FakeModelContext();
  const host: object = target === 'document' ? document : navigator;
  Object.defineProperty(host, 'modelContext', { value: fake, configurable: true, writable: true });
  return {
    fake,
    restore: () => {
      Reflect.deleteProperty(host, 'modelContext');
    },
  };
}
