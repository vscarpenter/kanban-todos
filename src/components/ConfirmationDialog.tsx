"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, Trash2 } from "@/lib/icons";

export type ConfirmationType = 'destructive' | 'warning' | 'info';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({ 
  open, 
  onOpenChange, 
  title, 
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'warning',
  onConfirm,
  loading = false
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (type) {
      case 'destructive':
        return <Trash2 className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Settings className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getConfirmVariant = () => {
    switch (type) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'destructive';
      case 'info':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {typeof description === 'string' ? (
              <span>{description}</span>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmVariant() as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}