/**
 * Types for the WebMCP API (https://webmachinelearning.github.io/webmcp/),
 * written from the draft dated 2026-09-04 and checked against Chrome 152.
 * Chrome ships no TypeScript definitions yet, so these live here.
 */

export interface ToolAnnotations {
  /** The tool only reads state. */
  readOnlyHint?: boolean;
  /** The tool returns user-authored content that an agent must treat as data. */
  untrustedContentHint?: boolean;
  /** The tool causes a significant or hard-to-reverse effect. */
  consequentialHint?: boolean;
}

/** A JSON Schema object. Kept loose on purpose; the browser serializes it as-is. */
export type JsonSchema = Record<string, unknown>;

export type ToolInput = Record<string, unknown>;

export interface ToolExecuteOptions {
  /**
   * Chrome 152 omits the signal when executeTool is called without one,
   * despite the spec marking it required. Treat it as optional.
   */
  signal?: AbortSignal;
}

export type ToolExecute = (input: ToolInput, options?: ToolExecuteOptions) => Promise<unknown>;

export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  execute: ToolExecute;
  annotations?: ToolAnnotations;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface ExecuteToolOptions {
  signal?: AbortSignal;
}

/** What getTools() returns. Note there is no execute here; call executeTool. */
export interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  origin: string;
  window: Window;
}

export interface ModelContext extends EventTarget {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<RegisteredTool[]>;
  /**
   * Chrome 152 accepts a JSON string for the input and rejects a plain
   * object. The spec says object. Accept both so callers can adapt.
   */
  executeTool(tool: RegisteredTool, input?: string | object, options?: ExecuteToolOptions): Promise<string>;
  ontoolchange: ((this: ModelContext, event: Event) => unknown) | null;
}

declare global {
  interface Document {
    readonly modelContext?: ModelContext;
  }
  interface Navigator {
    /** Early Chrome builds exposed the API here. Chrome 152 does not. */
    readonly modelContext?: ModelContext;
  }
}
