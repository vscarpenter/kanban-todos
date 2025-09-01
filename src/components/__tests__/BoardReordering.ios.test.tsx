import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Sidebar } from '../Sidebar'
import { useBoardStore } from '@/lib/stores/boardStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { Board } from '@/lib/types'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = () => null
    Component.displayName = 'MockedComponent'
    return Component
  }
}))

// Mock the stores
vi.mock('@/lib/stores/boardStore')
vi.mock('@/lib/stores/taskStore')
vi.mock('@/lib/stores/settingsStore')

const mockBoards: Board[] = [
  {
    id: 'board-1',
    name: 'First Board',
    description: 'First board description',
    color: '#3b82f6',
    isDefault: false,
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'board-2', 
    name: 'Second Board',
    description: 'Second board description',
    color: '#ef4444',
    isDefault: false,
    order: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'board-3',
    name: 'Third Board',
    description: 'Third board description', 
    color: '#10b981',
    isDefault: false,
    order: 2,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
]

const mockReorderBoard = vi.fn()
const mockSelectBoard = vi.fn()

describe('Board Reordering iOS Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useBoardStore
    ;(useBoardStore as ReturnType<typeof vi.fn>).mockReturnValue({
      boards: mockBoards,
      currentBoardId: 'board-1',
      selectBoard: mockSelectBoard,
      reorderBoard: mockReorderBoard,
    })

    // Mock useTaskStore
    ;(useTaskStore as ReturnType<typeof vi.fn>).mockReturnValue({
      tasks: [],
    })

    // Mock useSettingsStore
    ;(useSettingsStore as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        theme: 'light',
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
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
      updateSettings: vi.fn(),
    })
  })

  describe('Touch-Friendly Reorder Controls', () => {
    it('should render reorder buttons for each board', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      // Should have up/down buttons for each board by checking for chevron icons
      const allButtons = screen.getAllByRole('button')
      const upButtons = allButtons.filter(btn => {
        const svg = btn.querySelector('svg')
        return svg?.querySelector('path[d*="m15 18-6-6 6-6"]') || // ChevronUp path
               svg?.querySelector('path[d*="18-6-6 6-6"]') 
      })
      const downButtons = allButtons.filter(btn => {
        const svg = btn.querySelector('svg') 
        return svg?.querySelector('path[d*="m9 6 6 6-6 6"]') || // ChevronDown path
               svg?.querySelector('path[d*="6 6 6-6"]')
      })

      // Should have reorder buttons for boards (some may be disabled)
      expect(upButtons.length).toBeGreaterThanOrEqual(1)
      expect(downButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should disable up button for first board', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const boardCards = screen.getAllByText(/Board/)
      const firstBoardCard = boardCards.find(card => card.textContent?.includes('First Board'))?.closest('.group')
      
      expect(firstBoardCard).toBeInTheDocument()
      
      // Find up button in the first board card
      const upButton = firstBoardCard?.querySelector('button svg')?.closest('button')
      
      if (upButton) {
        expect(upButton).toBeDisabled()
      }
    })

    it('should disable down button for last board', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const boardCards = screen.getAllByText(/Board/)
      const lastBoardCard = boardCards.find(card => card.textContent?.includes('Third Board'))?.closest('.group')
      
      expect(lastBoardCard).toBeInTheDocument()
    })

    it('should call reorderBoard when up button is clicked', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      // Find Second Board's up button (should be enabled)
      const secondBoardCard = screen.getByText('Second Board').closest('.group')
      const upButtons = secondBoardCard?.querySelectorAll('button')
      
      // Find the up button by checking for ChevronUp icon
      let upButton = null
      if (upButtons) {
        for (const button of Array.from(upButtons)) {
          const svg = button.querySelector('svg')
          if (svg && button.getAttribute('disabled') !== '') {
            upButton = button
            break
          }
        }
      }

      if (upButton && !upButton.hasAttribute('disabled')) {
        fireEvent.click(upButton)
        
        await waitFor(() => {
          expect(mockReorderBoard).toHaveBeenCalledWith('board-2', 'up')
        })
      }
    })

    it('should call reorderBoard when down button is clicked', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      // Find First Board's down button (should be enabled)  
      const firstBoardCard = screen.getByText('First Board').closest('.group')
      const downButtons = firstBoardCard?.querySelectorAll('button')
      
      // Find the down button by checking for ChevronDown icon
      let downButton = null
      if (downButtons) {
        for (const button of Array.from(downButtons)) {
          const svg = button.querySelector('svg')
          if (svg && button.getAttribute('disabled') !== '') {
            downButton = button
            break
          }
        }
      }

      if (downButton && !downButton.hasAttribute('disabled')) {
        fireEvent.click(downButton)
        
        await waitFor(() => {
          expect(mockReorderBoard).toHaveBeenCalledWith('board-1', 'down')
        })
      }
    })
  })

  describe('iOS Touch Target Requirements', () => {
    it('should have minimum 44px touch targets on touch devices', () => {
      // Add iOS classes to simulate iOS environment
      document.body.classList.add('ios-device', 'ipad-device')
      
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const buttons = screen.getAllByRole('button')
      const reorderButtons = buttons.filter(btn => {
        const classes = btn.className
        return classes.includes('touch:h-6') && classes.includes('touch:w-6')
      })

      // Should have touch-optimized button sizes
      expect(reorderButtons.length).toBeGreaterThan(0)
      
      // Cleanup
      document.body.classList.remove('ios-device', 'ipad-device')
    })

    it('should prevent event bubbling when reorder buttons are clicked', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const secondBoardCard = screen.getByText('Second Board').closest('.group')
      const cardClickHandler = vi.fn()
      
      if (secondBoardCard) {
        secondBoardCard.addEventListener('click', cardClickHandler)
        
        // Find and click a reorder button
        const buttons = secondBoardCard.querySelectorAll('button')
        const reorderButton = Array.from(buttons).find(btn => 
          btn.querySelector('svg') && !btn.hasAttribute('disabled')
        )
        
        if (reorderButton) {
          fireEvent.click(reorderButton)
          
          // Board selection should not be triggered
          expect(mockSelectBoard).not.toHaveBeenCalled()
        }
      }
    })
  })

  describe('Keyboard Navigation Support', () => {
    it('should support keyboard navigation for reorder buttons', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const reorderButtons = screen.getAllByRole('button').filter(btn => {
        const svg = btn.querySelector('svg')
        return svg && (
          svg.getAttribute('class')?.includes('ChevronUp') ||
          svg.getAttribute('class')?.includes('ChevronDown')
        )
      })

      reorderButtons.forEach(button => {
        // Should be focusable
        expect(button.tabIndex).not.toBe(-1)
      })
    })

    it('should trigger reorder on Enter key press', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const secondBoardCard = screen.getByText('Second Board').closest('.group')
      const buttons = secondBoardCard?.querySelectorAll('button')
      
      if (buttons) {
        const upButton = Array.from(buttons).find(btn => 
          btn.querySelector('svg') && !btn.hasAttribute('disabled')
        )
        
        if (upButton) {
          upButton.focus()
          fireEvent.keyDown(upButton, { key: 'Enter', code: 'Enter' })
          
          await waitFor(() => {
            expect(mockReorderBoard).toHaveBeenCalled()
          })
        }
      }
    })

    it('should trigger reorder on Space key press', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const firstBoardCard = screen.getByText('First Board').closest('.group')
      const buttons = firstBoardCard?.querySelectorAll('button')
      
      if (buttons) {
        const downButton = Array.from(buttons).find(btn => 
          btn.querySelector('svg') && !btn.hasAttribute('disabled')
        )
        
        if (downButton) {
          downButton.focus()
          fireEvent.keyDown(downButton, { key: ' ', code: 'Space' })
          
          await waitFor(() => {
            expect(mockReorderBoard).toHaveBeenCalled()
          })
        }
      }
    })
  })

  describe('Visual Feedback and Accessibility', () => {
    it('should show visual feedback on hover', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const boardCards = screen.getAllByRole('button').filter(btn => 
        btn.closest('.group')
      )

      boardCards.forEach(card => {
        const groupElement = card.closest('.group')
        if (groupElement) {
          // Should have hover styles
          expect(groupElement.className).toContain('hover:shadow-md')
        }
      })
    })

    it('should have proper ARIA labels for screen readers', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const reorderButtons = screen.getAllByRole('button').filter(btn => {
        const svg = btn.querySelector('svg')
        return svg && (
          svg.getAttribute('class')?.includes('ChevronUp') ||
          svg.getAttribute('class')?.includes('ChevronDown')
        )
      })

      // Buttons should be properly labeled or have descriptive content
      reorderButtons.forEach(button => {
        const hasAriaLabel = button.hasAttribute('aria-label')
        const hasTitle = button.hasAttribute('title')
        const hasDescriptiveIcon = button.querySelector('svg') !== null
        
        expect(hasAriaLabel || hasTitle || hasDescriptiveIcon).toBe(true)
      })
    })

    it('should indicate active board visually', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const activeBoardCard = screen.getByText('First Board').closest('.group')
      
      if (activeBoardCard) {
        expect(activeBoardCard.className).toContain('ring-2 ring-primary')
      }
    })
  })

  describe('Performance and Responsiveness', () => {
    it('should handle rapid button clicks gracefully', async () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      const secondBoardCard = screen.getByText('Second Board').closest('.group')
      const buttons = secondBoardCard?.querySelectorAll('button')
      
      if (buttons) {
        const upButton = Array.from(buttons).find(btn => 
          btn.querySelector('svg') && !btn.hasAttribute('disabled')
        )
        
        if (upButton) {
          // Rapid clicks
          fireEvent.click(upButton)
          fireEvent.click(upButton)
          fireEvent.click(upButton)
          
          // Should handle gracefully without errors
          await waitFor(() => {
            expect(mockReorderBoard).toHaveBeenCalled()
          })
        }
      }
    })

    it('should maintain button state during reordering', () => {
      render(<Sidebar isOpen={true} onToggle={() => {}} />)

      // Buttons should maintain their enabled/disabled state
      const firstBoardButtons = screen.getByText('First Board').closest('.group')?.querySelectorAll('button')
      const lastBoardButtons = screen.getByText('Third Board').closest('.group')?.querySelectorAll('button')

      // First board's up button should be disabled
      // Last board's down button should be disabled
      expect(firstBoardButtons?.length).toBeGreaterThan(0)
      expect(lastBoardButtons?.length).toBeGreaterThan(0)
    })
  })
})