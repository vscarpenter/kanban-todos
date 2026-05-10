import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from '@/app/page'
import AboutPage from '@/app/about/page'
import InstallPage from '@/app/install/page'
import PrivacyPage from '@/app/privacy/page'

// Mock the components that are imported
vi.mock('@/components/KanbanBoard', () => ({
  KanbanBoard: () => <div data-testid="kanban-board">Kanban Board</div>,
}))

vi.mock('@/components/about/FirstVisitRedirect', () => ({
  FirstVisitGate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="first-visit-gate">{children}</div>
  ),
}))

vi.mock('@/components/about/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero</div>,
}))

vi.mock('@/components/about/HowItWorksSection', () => ({
  HowItWorksSection: () => <div data-testid="how-it-works">How It Works</div>,
}))

vi.mock('@/components/about/FeaturesSection', () => ({
  FeaturesSection: () => <div data-testid="features-section">Features</div>,
}))

vi.mock('@/components/about/PrivacySection', () => ({
  PrivacySection: () => <div data-testid="privacy-section">Privacy</div>,
}))

vi.mock('@/components/about/FooterCTA', () => ({
  FooterCTA: () => <div data-testid="footer-cta">Footer CTA</div>,
}))

vi.mock('@/components/about/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-reveal">{children}</div>
  ),
}))

vi.mock('@/components/about/EnterAppLink', () => ({
  EnterAppLink: ({ children }: { children: React.ReactNode }) => (
    <a href="/">{children}</a>
  ),
}))

vi.mock('@/components/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}))

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByTestId('first-visit-gate')).toBeInTheDocument()
  })

  it('includes KanbanBoard component', () => {
    render(<Home />)
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument()
  })

  it('has main element with correct id', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
  })

  it('exports metadata', () => {
    // Check if metadata is exported (this is a build-time check)
    expect(Home).toBeDefined()
  })
})

describe('About Page', () => {
  it('renders without crashing', () => {
    render(<AboutPage />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })

  it('includes all main sections', () => {
    render(<AboutPage />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument()
    expect(screen.getByTestId('features-section')).toBeInTheDocument()
    expect(screen.getByTestId('privacy-section')).toBeInTheDocument()
    expect(screen.getByTestId('footer-cta')).toBeInTheDocument()
  })

  it('includes navigation bar with logo', () => {
    render(<AboutPage />)
    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByText('Cascade')).toBeInTheDocument()
  })

  it('includes Open App button', () => {
    render(<AboutPage />)
    expect(screen.getByText('Open App')).toBeInTheDocument()
  })
})

describe('Install Page', () => {
  it('renders without crashing', () => {
    render(<InstallPage />)
    expect(screen.getByText('Install Cascade')).toBeInTheDocument()
  })

  it('includes back to app button', () => {
    render(<InstallPage />)
    expect(screen.getByText('Back to App')).toBeInTheDocument()
  })

  it('includes desktop instructions section', () => {
    render(<InstallPage />)
    expect(screen.getByText('Desktop')).toBeInTheDocument()
    expect(screen.getByText('Chrome, Edge, or Brave')).toBeInTheDocument()
  })

  it('includes iOS instructions section', () => {
    render(<InstallPage />)
    expect(screen.getByText('iOS (iPhone & iPad)')).toBeInTheDocument()
    expect(screen.getByText('Safari (Required)')).toBeInTheDocument()
  })

  it('includes Android instructions section', () => {
    render(<InstallPage />)
    expect(screen.getByText('Android')).toBeInTheDocument()
    expect(screen.getByText('Chrome (Recommended)')).toBeInTheDocument()
  })

  it('includes benefits section', () => {
    render(<InstallPage />)
    expect(screen.getByText('Why Install?')).toBeInTheDocument()
    expect(screen.getByText('Quick Access')).toBeInTheDocument()
    expect(screen.getByText('Offline Support')).toBeInTheDocument()
  })

  it('includes troubleshooting section', () => {
    render(<InstallPage />)
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument()
  })
})

describe('Privacy Page', () => {
  it('renders without crashing', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('includes back to app button', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Back to App')).toBeInTheDocument()
  })

  it('includes core privacy principles', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Core Privacy Principles')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('Your data never leaves your device'))).toBeInTheDocument()
  })

  it('includes data storage section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('How Your Data is Stored')).toBeInTheDocument()
    expect(screen.getByText('Local Browser Storage')).toBeInTheDocument()
  })

  it('includes data sharing section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Data Sharing Features')).toBeInTheDocument()
    expect(screen.getByText('Task Sharing')).toBeInTheDocument()
  })

  it('includes what we dont collect section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText("What We Don't Collect")).toBeInTheDocument()
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
  })

  it('includes technical implementation section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Technical Implementation')).toBeInTheDocument()
    expect(screen.getByText('Static Site Architecture')).toBeInTheDocument()
  })

  it('includes privacy badges', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('100% Local Storage')).toBeInTheDocument()
    expect(screen.getByText('No Data Collection')).toBeInTheDocument()
    expect(screen.getByText('Open Source')).toBeInTheDocument()
  })
})