"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons";

interface AppResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function AppResetDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  loading = false
}: AppResetDialogProps) {
  const [step, setStep] = useState<'first' | 'second'>('first');

  const handleFirstConfirm = () => {
    setStep('second');
  };

  const handleFinalConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
      setStep('first'); // Reset for next time
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep('first'); // Reset for next time
  };

  const handleBack = () => {
    setStep('first');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleCancel();
      } else {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'first' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Reset Application
              </DialogTitle>
              <DialogDescription className="text-left">
                This will completely reset the application to its default state.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>ALL DATA</strong> will be permanently deleted including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All boards and tasks</li>
                    <li>All settings and preferences</li>
                    <li>All stored data</li>
                  </ul>
                  <p className="font-medium">This action cannot be undone.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFirstConfirm}
                disabled={loading}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Final Confirmation
              </DialogTitle>
              <DialogDescription className="text-left">
                Are you absolutely sure? This will delete everything and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">
                  This is your last chance to cancel. All your data will be permanently lost.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleFinalConfirm}
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Everything"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}