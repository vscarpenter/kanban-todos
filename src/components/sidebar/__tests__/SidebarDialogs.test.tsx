import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarDialogs, type DialogType } from '@/components/sidebar/SidebarDialogs';

// SidebarDialogs' own job is routing: decide which single dialog is `open`
// for a given `activeDialog`, translate each dialog's onOpenChange back into
// onDialogChange, and forward the two global "show X dialog" custom events.
// The six feature dialogs it wraps (CreateBoardDialog, SettingsDialog, etc.)
// have their own dedicated tests elsewhere and pull in a lot of unrelated
// store/state machinery, so they're the real external boundary here.
//
// `next/dynamic` is mocked to unwrap synchronously instead of lazy-loading,
// resolving to a distinct stub per call in the exact order SidebarDialogs.tsx
// declares them (CreateBoardDialog, SettingsDialog, UserGuideDialog,
// ExportDialog, ImportDialog, ArchiveDialog) so each dialog's open/closed
// state can be asserted independently.
vi.mock('next/dynamic', () => {
  type DialogStubProps = { open: boolean; onOpenChange: (open: boolean) => void };

  const stubFor = (testId: string) =>
    function DialogStub({ open, onOpenChange }: DialogStubProps) {
      if (!open) return null;
      return (
        <div data-testid={testId}>
          <button onClick={() => onOpenChange(false)}>close-{testId}</button>
        </div>
      );
    };

  // Fixed order matching the `dynamic(...)` call sites in SidebarDialogs.tsx.
  const stubs = [
    stubFor('create-board-dialog'),
    stubFor('settings-dialog'),
    stubFor('user-guide-dialog'),
    stubFor('export-dialog'),
    stubFor('import-dialog'),
    stubFor('archive-dialog'),
  ];

  let callIndex = 0;
  return {
    default: () => stubs[callIndex++],
  };
});

const ALL_DIALOG_TESTIDS = [
  'create-board-dialog',
  'settings-dialog',
  'user-guide-dialog',
  'export-dialog',
  'import-dialog',
  'archive-dialog',
];

function expectOnlyOpen(testId: string | null) {
  for (const id of ALL_DIALOG_TESTIDS) {
    if (id === testId) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
  }
}

describe('SidebarDialogs', () => {
  it('renders no dialog when activeDialog is null', () => {
    render(<SidebarDialogs activeDialog={null} onDialogChange={vi.fn()} />);

    expectOnlyOpen(null);
  });

  it.each<[DialogType, string]>([
    ['createBoard', 'create-board-dialog'],
    ['settings', 'settings-dialog'],
    ['userGuide', 'user-guide-dialog'],
    ['export', 'export-dialog'],
    ['import', 'import-dialog'],
    ['archive', 'archive-dialog'],
  ])('opens only the %s dialog when activeDialog is "%s"', (activeDialog, testId) => {
    render(<SidebarDialogs activeDialog={activeDialog} onDialogChange={vi.fn()} />);

    expectOnlyOpen(testId);
  });

  it('calls onDialogChange(null) when the open dialog reports onOpenChange(false)', () => {
    const onDialogChange = vi.fn();
    render(<SidebarDialogs activeDialog="export" onDialogChange={onDialogChange} />);

    fireEvent.click(screen.getByText('close-export-dialog'));

    expect(onDialogChange).toHaveBeenCalledWith(null);
  });

  it('opens the settings dialog in response to the show-settings-dialog document event', () => {
    const onDialogChange = vi.fn();
    render(<SidebarDialogs activeDialog={null} onDialogChange={onDialogChange} />);

    document.dispatchEvent(new Event('show-settings-dialog'));

    expect(onDialogChange).toHaveBeenCalledWith('settings');
  });

  it('opens the user guide dialog in response to the show-help-dialog document event', () => {
    const onDialogChange = vi.fn();
    render(<SidebarDialogs activeDialog={null} onDialogChange={onDialogChange} />);

    document.dispatchEvent(new Event('show-help-dialog'));

    expect(onDialogChange).toHaveBeenCalledWith('userGuide');
  });

  it('stops listening for the global dialog events after unmount', () => {
    const onDialogChange = vi.fn();
    const { unmount } = render(<SidebarDialogs activeDialog={null} onDialogChange={onDialogChange} />);

    unmount();
    document.dispatchEvent(new Event('show-settings-dialog'));
    document.dispatchEvent(new Event('show-help-dialog'));

    expect(onDialogChange).not.toHaveBeenCalled();
  });
});
