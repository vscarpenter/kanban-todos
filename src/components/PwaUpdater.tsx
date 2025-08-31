"use client";

import { useEffect, useMemo, useState } from "react";

export default function PwaUpdater() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  // Only attempt to register in supported browsers
  const canUseSW = useMemo(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production",
    []
  );

  useEffect(() => {
    if (!canUseSW) return;
    let mounted = true;

    // Register the service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (!mounted) return;

        const onUpdateFound = () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") {
              // controller exists => this is an update
              if (navigator.serviceWorker.controller) {
                setWaiting(registration.waiting);
                setShow(true);
              }
            }
          });
        };

        registration.addEventListener("updatefound", onUpdateFound);

        // If there's already a waiting worker (e.g., returned to app)
        if (registration.waiting) {
          setWaiting(registration.waiting);
          setShow(true);
        }

        // Check for updates whenever the app becomes visible
        const onVisibility = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Cleanup
        return () => {
          registration.removeEventListener("updatefound", onUpdateFound);
          document.removeEventListener("visibilitychange", onVisibility);
        };
      })
      .catch(() => {});

    // Reload the page when the new SW takes control
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [canUseSW]);

  const reload = () => {
    try {
      waiting?.postMessage({ type: "SKIP_WAITING" });
    } catch {}
  };

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>Update available. Reload to apply.</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShow(false)}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            Later
          </button>
          <button
            type="button"
            onClick={reload}
            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
