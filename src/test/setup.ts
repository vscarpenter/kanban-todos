import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Node.js v22+ provides a broken built-in localStorage (null prototype, no methods).
// Replace it with a proper in-memory implementation that inherits from Storage.prototype
// so that vi.spyOn(Storage.prototype, 'getItem') still intercepts calls in tests.
if (typeof window !== 'undefined' && typeof Storage !== 'undefined') {
  const store = new Map<string, string>();

  // Install backing implementations on Storage.prototype so spies intercept them
  Storage.prototype.getItem = function (key: string): string | null {
    return store.get(String(key)) ?? null;
  };
  Storage.prototype.setItem = function (key: string, value: string): void {
    store.set(String(key), String(value));
  };
  Storage.prototype.removeItem = function (key: string): void {
    store.delete(String(key));
  };
  Storage.prototype.clear = function (): void {
    store.clear();
  };
  Storage.prototype.key = function (index: number): string | null {
    return Array.from(store.keys())[index] ?? null;
  };
  Object.defineProperty(Storage.prototype, 'length', {
    get: () => store.size,
    configurable: true,
  });

  // Replace the broken Node.js localStorage with a proper Storage-inheriting object
  Object.defineProperty(window, 'localStorage', {
    value: Object.create(Storage.prototype) as Storage,
    writable: true,
    configurable: true,
  });
}

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark', 'system'],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock IndexedDB
const mockDB = {
  init: vi.fn().mockResolvedValue(undefined),
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  getTasks: vi.fn().mockResolvedValue([]),
  addBoard: vi.fn().mockResolvedValue(undefined),
  getBoards: vi.fn().mockResolvedValue([]),
}

vi.mock('@/lib/utils/database', () => ({
  taskDB: mockDB,
}))