"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { X, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Check if running in standalone mode (installed PWA)
const emptySubscribe = () => () => {};
const getStandaloneSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (window.navigator as any).standalone === true;
};
const getServerSnapshot = () => false;

// Detect browser type from user agent
type BrowserType = "chrome" | "safari" | "firefox" | "other";
const getBrowserTypeSnapshot = (): BrowserType => {
  if (typeof window === 'undefined') return "other";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("chrome") && !userAgent.includes("edg")) return "chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) return "safari";
  if (userAgent.includes("firefox")) return "firefox";
  return "other";
};
const getBrowserTypeServerSnapshot = (): BrowserType => "other";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Use useSyncExternalStore for hydration-safe detection
  const isStandalone = useSyncExternalStore(emptySubscribe, getStandaloneSnapshot, getServerSnapshot);
  const browserType = useSyncExternalStore(emptySubscribe, getBrowserTypeSnapshot, getBrowserTypeServerSnapshot);

  useEffect(() => {
    if (isStandalone) {
      return; // Don't show prompt if already installed
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For Safari/iOS, show prompt after a delay
    if (browserType === "safari" && !isStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [browserType, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no install prompt (e.g., Safari), redirect to instructions
      window.location.href = "/install";
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleLearnMore = () => {
    window.location.href = "/install";
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="install-pwa-title"
      aria-describedby="install-pwa-description"
      className="fixed inset-x-3 top-3 z-50 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>

        <div className="flex-1 space-y-2">
          <h3 id="install-pwa-title" className="font-semibold text-sm">
            Install Cascade
          </h3>
          <p id="install-pwa-description" className="text-sm text-muted-foreground">
            {browserType === "safari"
              ? "Install Cascade on your device for quick access and offline use. Tap the share button and select 'Add to Home Screen'."
              : "Install Cascade for quick access and offline use."}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {deferredPrompt ? (
              <Button
                type="button"
                size="sm"
                onClick={handleInstallClick}
                className="h-8"
              >
                Install Now
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleLearnMore}
                className="h-8 gap-1"
              >
                <Info className="h-3 w-3" aria-hidden="true" />
                How to Install
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8"
            >
              Not Now
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-md p-1 hover:bg-muted"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
