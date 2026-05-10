import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from '@/components/Sidebar'

type NavigationMenuProps = {
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
  onUserGuide: () => void;
  onArchive: () => void;
};

type SidebarDialogsProps = {
  activeDialog: string | null;
  onDialogChange: (dialog: string | null) => void;
};

// Mock dependencies
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/lib/icons', () => ({
  Menu: () => <svg data-testid="menu-icon" />,
  X: () => <svg data-testid="close-icon" />,
}))

vi.mock('@/components/sidebar/SidebarHeader', () => ({
  SidebarHeader: ({ onToggle }: { onToggle: () => void }) => (
    <div data-testid="sidebar-header">
      <button onClick={onToggle}>Toggle</button>
    </div>
  ),
}))

vi.mock('@/components/sidebar/BoardsList', () => ({
  BoardsList: ({ onCreateBoard }: { onCreateBoard: () => void }) => (
    <div data-testid="boards-list">
      <button onClick={onCreateBoard}>Create Board</button>
    </div>
  ),
}))

vi.mock('@/components/sidebar/NavigationMenu', () => ({
  NavigationMenu: ({ onExport, onImport, onSettings, onUserGuide, onArchive }: NavigationMenuProps) => (
    <div data-testid="navigation-menu">
      <button onClick={onExport}>Export</button>
      <button onClick={onImport}>Import</button>
      <button onClick={onSettings}>Settings</button>
      <button onClick={onUserGuide}>User Guide</button>
      <button onClick={onArchive}>Archive</button>
    </div>
  ),
}))

vi.mock('@/components/sidebar/SidebarDialogs', () => ({
  SidebarDialogs: ({ activeDialog, onDialogChange }: SidebarDialogsProps) => (
    <div data-testid="sidebar-dialogs" data-active-dialog={activeDialog}>
      <button onClick={() => onDialogChange(null)}>Close Dialog</button>
    </div>
  ),
}))

vi.mock('@/components/VersionIndicator', () => ({
  VersionFooter: () => <div data-testid="version-footer">Version 1.0.0</div>,
}))

describe('Sidebar', () => {
  it('renders without crashing', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
  })

  it('renders sidebar header', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
  })

  it('renders boards list', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('boards-list')).toBeInTheDocument()
  })

  it('renders navigation menu', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('navigation-menu')).toBeInTheDocument()
  })

  it('renders version footer', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('version-footer')).toBeInTheDocument()
  })

  it('shows close icon when sidebar is open on mobile', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByTestId('close-icon')).toBeInTheDocument()
  })

  it('shows menu icon when sidebar is closed on mobile', () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />)
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument()
  })

  it('calls onToggle when mobile toggle button is clicked', () => {
    const onToggle = vi.fn()
    render(<Sidebar isOpen={true} onToggle={onToggle} />)
    
    const closeButton = screen.getByTestId('close-icon').closest('button')
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(onToggle).toHaveBeenCalled()
    }
  })

  it('opens create board dialog when create board button is clicked', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    
    const createButton = screen.getByText('Create Board')
    fireEvent.click(createButton)
    
    expect(screen.getByTestId('sidebar-dialogs')).toHaveAttribute('data-active-dialog', 'createBoard')
  })

  it('opens export dialog when export button is clicked', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    
    const exportButton = screen.getByText('Export')
    fireEvent.click(exportButton)
    
    expect(screen.getByTestId('sidebar-dialogs')).toHaveAttribute('data-active-dialog', 'export')
  })

  it('opens settings dialog when settings button is clicked', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    
    const settingsButton = screen.getByText('Settings')
    fireEvent.click(settingsButton)
    
    expect(screen.getByTestId('sidebar-dialogs')).toHaveAttribute('data-active-dialog', 'settings')
  })

  it('opens user guide dialog when user guide button is clicked', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />)
    
    const userGuideButton = screen.getByText('User Guide')
    fireEvent.click(userGuideButton)
    
    expect(screen.getByTestId('sidebar-dialogs')).toHaveAttribute('data-active-dialog', 'userGuide')
  })
})
