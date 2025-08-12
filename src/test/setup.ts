import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

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