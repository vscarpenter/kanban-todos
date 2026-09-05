import { create } from 'zustand';

export type WebMcpStatus = 'idle' | 'unsupported' | 'registered' | 'error';

interface WebMcpStatusState {
  status: WebMcpStatus;
  toolCount: number;
  setStatus: (status: WebMcpStatus, toolCount: number) => void;
  reset: () => void;
}

/**
 * Registration state for the sidebar indicator. Written by the
 * registration lifecycle, read by the UI. Nothing here is persisted.
 */
export const useWebMcpStatusStore = create<WebMcpStatusState>((set) => ({
  status: 'idle',
  toolCount: 0,
  setStatus: (status, toolCount) => set({ status, toolCount }),
  reset: () => set({ status: 'idle', toolCount: 0 }),
}));
