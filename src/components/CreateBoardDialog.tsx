"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useAsyncOperation } from "@/lib/hooks/useAsyncOperation";
import { BoardAppearancePicker } from "@/components/board/BoardAppearancePicker";
import {
  DEFAULT_DOT_COLOR,
  DEFAULT_ICON_KEY,
  getDotHex,
  type BoardIconKey,
  type DotColorKey,
} from "@/lib/utils/boardIcons";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const { addBoard } = useBoardStore();
  const { execute, isLoading } = useAsyncOperation({
    errorMessage: "Failed to create board",
  });
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    iconKey: BoardIconKey;
    dotColor: DotColorKey;
  }>({
    name: "",
    description: "",
    iconKey: DEFAULT_ICON_KEY,
    dotColor: DEFAULT_DOT_COLOR,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const result = await execute(async () => {
      await addBoard({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        // Keep `color` populated so legacy export/import flows still work,
        // but the new visual identity is iconKey + dotColor.
        color: getDotHex(formData.dotColor),
        iconKey: formData.iconKey,
        dotColor: formData.dotColor,
        isDefault: false,
        order: 0,
      });
    });

    if (result !== undefined) {
      setFormData({
        name: "",
        description: "",
        iconKey: DEFAULT_ICON_KEY,
        dotColor: DEFAULT_DOT_COLOR,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
