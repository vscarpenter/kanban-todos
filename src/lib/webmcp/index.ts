import { logger } from '@/lib/utils/logger';
import { getModelContext } from './detect';
import { useWebMcpStatusStore } from './status';
import { CASCADE_TOOLS } from './tools';
import type { ModelContext, ModelContextTool } from './types';

export type RegistrationResult = 'registered' | 'unsupported' | 'cancelled' | 'error';

interface RegisterOptions {
  /** Pass null to force the unsupported path, or a fake in tests. */
  modelContext?: ModelContext | null;
  tools?: ModelContextTool[];
}

// One controller owns every registered tool. Aborting it unregisters them
// all, which is how teardown, hot reload, and re-registration stay free of
// the duplicate-name rejection.
let activeController: AbortController | null = null;

export async function registerCascadeTools(options: RegisterOptions = {}): Promise<RegistrationResult> {
  const modelContext = options.modelContext === undefined ? getModelContext() : options.modelContext;
  const tools = options.tools ?? CASCADE_TOOLS;
  const statusStore = useWebMcpStatusStore.getState();

  if (!modelContext) {
    logger.info('WebMCP is not available in this browser; Cascade agent tools are off.');
    statusStore.setStatus('unsupported', 0);
    return 'unsupported';
  }

  unregisterCascadeTools();
  const controller = new AbortController();
  activeController = controller;

  try {
    for (const tool of tools) {
      await modelContext.registerTool(tool, { signal: controller.signal });
    }
  } catch (error: unknown) {
    // A teardown mid-registration (React strict mode does this) aborts the
    // signal, and the next registerTool rejects with that reason. Expected.
    if (controller.signal.aborted) return 'cancelled';

    controller.abort();
    if (activeController === controller) activeController = null;
    logger.error('Failed to register Cascade agent tools', error);
    statusStore.setStatus('error', 0);
    return 'error';
  }

  if (controller.signal.aborted) return 'cancelled';

  statusStore.setStatus('registered', tools.length);
  return 'registered';
}

export function unregisterCascadeTools(): void {
  if (!activeController) return;
  activeController.abort();
  activeController = null;
  useWebMcpStatusStore.getState().setStatus('idle', 0);
}
