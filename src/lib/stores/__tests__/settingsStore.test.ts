import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from '../settingsStore'
import { taskDB } from '@/lib/utils/database'

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  }
}))

// Mock exportSettings
vi.mock('@/lib/utils/exportImport', () => ({
  exportSettings: vi.fn((settings) => ({ settings }))
}))

describe('SettingsStore - Search Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSettingsStore.setState({
      settings: {
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        enableDeveloperMode: false,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      },
      isLoading: false,
      error: null,
    })
  })

  it('updates search preferences', async () => {
    const mockUpdateSettings = vi.mocked(taskDB.updateSettings)
    mockUpdateSettings.mockResolvedValue()

    const { updateSearchPreferences } = useSettingsStore.getState()
    
    await updateSearchPreferences({
      defaultScope: 'all-boards',
      rememberScope: false,
    })

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      theme: 'system',
      autoArchiveDays: 30,
      enableNotifications: true,
      enableKeyboardShortcuts: true,
      enableDebugMode: false,
      enableDeveloperMode: false,
      searchPreferences: {
        defaultScope: 'all-boards',
        rememberScope: false,
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium',
      },
    })

    const state = useSettingsStore.getState()
    expect(state.settings.searchPreferences.defaultScope).toBe('all-boards')
    expect(state.settings.searchPreferences.rememberScope).toBe(false)
  })

  it('sets default search scope', async () => {
    const mockUpdateSettings = vi.mocked(taskDB.updateSettings)
    mockUpdateSettings.mockResolvedValue()

    const { setDefaultSearchScope } = useSettingsStore.getState()
    
    await setDefaultSearchScope('all-boards')

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true, // Should preserve existing value
        },
      })
    )
  })

  it('sets remember scope preference', async () => {
    const mockUpdateSettings = vi.mocked(taskDB.updateSettings)
    mockUpdateSettings.mockResolvedValue()

    const { setRememberScope } = useSettingsStore.getState()
    
    await setRememberScope(false)

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        searchPreferences: {
          defaultScope: 'current-board', // Should preserve existing value
          rememberScope: false,
        },
      })
    )
  })

  it('handles errors when updating search preferences', async () => {
    const mockUpdateSettings = vi.mocked(taskDB.updateSettings)
    mockUpdateSettings.mockRejectedValue(new Error('Database error'))

    const { updateSearchPreferences } = useSettingsStore.getState()
    
    await updateSearchPreferences({ defaultScope: 'all-boards' })

    const state = useSettingsStore.getState()
    expect(state.error).toBe('Database error') // Error comes from updateSettings
  })

  it('initializes with default search preferences', async () => {
    const mockGetSettings = vi.mocked(taskDB.getSettings)
    mockGetSettings.mockResolvedValue(null) // No stored settings

    const { initializeSettings } = useSettingsStore.getState()
    
    await initializeSettings()

    const state = useSettingsStore.getState()
    expect(state.settings.searchPreferences).toEqual({
      defaultScope: 'current-board',
      rememberScope: true,
    })
  })

  it('loads stored search preferences', async () => {
    const mockGetSettings = vi.mocked(taskDB.getSettings)
    mockGetSettings.mockResolvedValue({
      theme: 'dark',
      autoArchiveDays: 60,
      enableNotifications: false,
      enableKeyboardShortcuts: false,
      enableDebugMode: true,
      enableDeveloperMode: false,
      searchPreferences: {
        defaultScope: 'all-boards',
        rememberScope: false,
      },
      accessibility: {
        highContrast: true,
        reduceMotion: true,
        fontSize: 'large',
      },
    })

    const { initializeSettings } = useSettingsStore.getState()
    
    await initializeSettings()

    const state = useSettingsStore.getState()
    expect(state.settings.searchPreferences).toEqual({
      defaultScope: 'all-boards',
      rememberScope: false,
    })
  })
})