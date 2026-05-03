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
import { BoardAppearancePicker } from "@/components/board/BoardAppearancePicker";
import {
  DEFAULT_DOT_COLOR,
  DEFAULT_ICON_KEY,
  getDotHex,
  type BoardIconKey,
  type DotColorKey,
} from "@/lib/utils/boardIcons";

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
}

function getInitialFormData(board: Board | null) {
  return {
    name: board?.name ?? "",
    description: board?.description ?? "",
    iconKey: (board?.iconKey ?? DEFAULT_ICON_KEY) as BoardIconKey,
    dotColor: (board?.dotColor ?? DEFAULT_DOT_COLOR) as DotColorKey,
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
        color: getDotHex(formData.dotColor),
        iconKey: formData.iconKey,
        dotColor: formData.dotColor,
      });
    });

    if (result !== undefined) {
      handleOpenChange(false);
    }
  };

  if (!board) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter board name"
              maxLength={100}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.name.length}/100
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Enter board description (optional)"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/200
            </div>
          </div>

          <BoardAppearancePicker
            iconKey={formData.iconKey}
            dotColor={formData.dotColor}
            onIconChange={(iconKey) => setFormData((p) => ({ ...p, iconKey }))}
            onDotChange={(dotColor) => setFormData((p) => ({ ...p, dotColor }))}
          />

          {board.isDefault && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is your default board. It cannot be deleted but can be renamed and customized.
              </p>
            </div>
          )}

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
