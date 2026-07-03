import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NavigationMenu } from '@/components/sidebar/NavigationMenu';

function renderMenu(overrides: Partial<Parameters<typeof NavigationMenu>[0]> = {}) {
  const handlers = {
    onExport: vi.fn(),
    onImport: vi.fn(),
    onSettings: vi.fn(),
    onUserGuide: vi.fn(),
    onArchive: vi.fn(),
    ...overrides,
  };
  render(<NavigationMenu {...handlers} />);
  return handlers;
}

describe('NavigationMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every nav item label', () => {
    renderMenu();

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('User Guide')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('About Cascade')).toBeInTheDocument();
  });

  it('calls the matching callback prop for each callback-driven item, and no others', () => {
    const handlers = renderMenu();

    fireEvent.click(screen.getByText('Export Data'));
    expect(handlers.onExport).toHaveBeenCalledTimes(1);
    expect(handlers.onImport).not.toHaveBeenCalled();
    expect(handlers.onSettings).not.toHaveBeenCalled();
    expect(handlers.onUserGuide).not.toHaveBeenCalled();
    expect(handlers.onArchive).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Import Data'));
    expect(handlers.onImport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Archive'));
    expect(handlers.onArchive).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Settings'));
    expect(handlers.onSettings).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('User Guide'));
    expect(handlers.onUserGuide).toHaveBeenCalledTimes(1);

    // None of the callback props should ever be invoked by the two static
    // window.open links tested below.
    expect(handlers.onExport).toHaveBeenCalledTimes(1);
  });

  it('opens the privacy policy in a new tab instead of calling a prop', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const handlers = renderMenu();

    fireEvent.click(screen.getByText('Privacy Policy'));

    expect(openSpy).toHaveBeenCalledWith('/privacy/', '_blank');
    expect(handlers.onSettings).not.toHaveBeenCalled();
  });

  it('opens the about page in a new tab instead of calling a prop', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const handlers = renderMenu();

    fireEvent.click(screen.getByText('About Cascade'));

    expect(openSpy).toHaveBeenCalledWith('/about/', '_blank');
    expect(handlers.onUserGuide).not.toHaveBeenCalled();
  });
});
