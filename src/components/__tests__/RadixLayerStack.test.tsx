import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Radix keeps one module-level stack of "layers that disabled outside pointer
// events" and restores `body.style.pointerEvents` when the last layer leaves.
// A task card's "..." menu and the Edit Task dialog it opens overlap: the menu
// item's onClick mounts the dialog (Radix flushes it synchronously) before the
// menu starts closing. So the two components must share that stack.
//
// When node_modules carried duplicate copies of the Radix internals (one
// hoisted, one nested under react-menu, react-popover and react-select) each
// copy kept its own stack. The menu's copy restored pointer events while the
// dialog was still open, and the dialog's copy had recorded "none" as the value
// to put back, so closing the dialog left the whole page unclickable
// (cascade.vinny.dev v5.3.0). These tests drive that overlap with controlled
// `open` props so they fail whenever the two stop sharing a stack.

const FOCUS_CALL_LIMIT = 200;

function MenuThenDialog({ menuOpen, dialogOpen }: { menuOpen: boolean; dialogOpen: boolean }) {
  return (
    <>
      <DropdownMenu open={menuOpen}>
        <DropdownMenuTrigger>Task options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit Task</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dialogOpen}>
        <DialogContent>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('DropdownMenu and Dialog share one Radix layer stack', () => {
  let focusSpy: ReturnType<typeof vi.spyOn> | undefined;
  let focusCalls = 0;

  beforeEach(() => {
    document.body.style.pointerEvents = '';

    // Duplicated Radix copies also split the focus-scope stack, and two trapped
    // scopes then steal focus from each other forever. jsdom runs that as a
    // synchronous loop, so stop focusing past the cap (which ends the loop) and
    // report it from afterEach instead of hanging the whole test run.
    const nativeFocus = HTMLElement.prototype.focus;
    focusCalls = 0;
    focusSpy = vi
      .spyOn(HTMLElement.prototype, 'focus')
      .mockImplementation(function focusWithLoopGuard(this: HTMLElement, options?: FocusOptions) {
        focusCalls += 1;
        if (focusCalls > FOCUS_CALL_LIMIT) return;
        nativeFocus.call(this, options);
      });
  });

  afterEach(() => {
    focusSpy?.mockRestore();
    if (focusCalls > FOCUS_CALL_LIMIT) {
      throw new Error(
        `focus() was called ${focusCalls}+ times: the menu and dialog focus scopes are fighting, ` +
          'so they do not share one Radix stack. node_modules probably holds duplicate ' +
          '@radix-ui copies; reinstall from the lockfile.'
      );
    }
  });

  it('keeps outside pointer events disabled while the dialog outlives the menu', () => {
    const { rerender } = render(<MenuThenDialog menuOpen dialogOpen={false} />);
    expect(document.body.style.pointerEvents).toBe('none');

    rerender(<MenuThenDialog menuOpen dialogOpen />);
    rerender(<MenuThenDialog menuOpen={false} dialogOpen />);

    expect(document.body.style.pointerEvents).toBe('none');
  });

  it('restores body pointer events once the dialog that outlived the menu closes', () => {
    const { rerender } = render(<MenuThenDialog menuOpen dialogOpen={false} />);
    rerender(<MenuThenDialog menuOpen dialogOpen />);
    rerender(<MenuThenDialog menuOpen={false} dialogOpen />);
    rerender(<MenuThenDialog menuOpen={false} dialogOpen={false} />);

    expect(document.body.style.pointerEvents).toBe('');
  });
});
