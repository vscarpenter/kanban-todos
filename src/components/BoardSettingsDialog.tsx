"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useAsyncOperation } from "@/lib/hooks/useAsyncOperation";
import { Board } from "@/lib/types";

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
}

const BOARD_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

function getInitialFormData(board: Board | null) {
  return {
    name: board?.name ?? "",
    description: board?.description ?? "",
    color: board?.color ?? BOARD_COLORS[0],
  };
}

export function BoardSettingsDialog({ open, onOpenChange, board }: BoardSettingsDialogProps) {
  const { updateBoard } = useBoardStore();
  const { execute, isLoading } = useAsyncOperation({
    errorMessage: "Failed to update board settings",
  });
  const [formData, setFormData] = useState(() => getInitialFormData(board));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFormData(getInitialFormData(board));
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !board) return;

    const result = await execute(async () => {
      await updateBoard(board.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
    });

    // Only close dialog on success
    if (result !== undefined) {
      handleOpenChange(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!board) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Board Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter board name"
              maxLength={100}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.name.length}/100
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter board description (optional)"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/200
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Board Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${formData.color === color
                      ? 'border-foreground scale-110'
                      : 'border-border hover:border-foreground/50'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange('color', color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Default Board Info */}
          {board.isDefault && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is your default board. It cannot be deleted but can be renamed and customized.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
