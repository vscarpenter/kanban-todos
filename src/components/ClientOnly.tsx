"use client";

import { useSyncExternalStore } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Simple subscription that never changes - we just need the initial server vs client state
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // useSyncExternalStore is the recommended way to handle hydration-safe client detection
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
