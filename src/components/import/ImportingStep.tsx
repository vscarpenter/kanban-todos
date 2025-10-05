"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ImportingStepProps {
  progress: number;
}

/**
 * Importing progress step
 */
export function ImportingStep({ progress }: ImportingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Importing Data</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we process your import...
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-muted-foreground">{progress}% complete</p>
      </div>
    </div>
  );
}
