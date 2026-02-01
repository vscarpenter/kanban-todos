"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { keyboardManager, type KeyboardShortcut } from "@/lib/utils/keyboard";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  // Derive shortcuts from manager when dialog is open
  const shortcuts: KeyboardShortcut[] = useMemo(() => {
    if (!open) return [];
    return keyboardManager.getShortcuts();
  }, [open]);

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {categories.map((category, index) => {
            const categoryShortcuts = keyboardManager.getShortcutsByCategory(category);
            
            return (
              <div key={category}>
                {index > 0 && <Separator className="my-4" />}
                
                <h3 className="font-semibold text-lg mb-3">{category}</h3>
                
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, shortcutIndex) => (
                    <div 
                      key={shortcutIndex}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {keyboardManager.formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {shortcuts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No keyboard shortcuts available.</p>
              <p className="text-sm mt-2">Enable keyboard shortcuts in Settings to see available shortcuts.</p>
            </div>
          )}

        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Press <Badge variant="outline" className="mx-1 font-mono">H</Badge> to show this dialog anytime, or{' '}
            <Badge variant="outline" className="mx-1 font-mono">Esc</Badge> to close it.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}