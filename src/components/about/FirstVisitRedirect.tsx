"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VISITED_KEY } from "./visitedKey";

function hasVisitedBefore(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(VISITED_KEY) !== null;
  } catch {
    // localStorage unavailable (private browsing, disabled storage)
    // Default to "visited" so the user sees the main app
    return true;
  }
}

/**
 * Gates rendering of children until we confirm the user has visited before.
 * First-time visitors are redirected to /about; returning visitors see children immediately.
 */
export function FirstVisitGate({ children }: { children: React.ReactNode }) {
  const { replace } = useRouter();
  const visited = hasVisitedBefore();

  // Client-side gate: localStorage isn't available server-side, so we can't
  // do this redirect via middleware or a server component.
  // react-doctor-disable-next-line react-doctor/nextjs-no-client-side-redirect
  useEffect(() => {
    if (!visited) {
      replace("/about/");
    }
  }, [visited, replace]);

  if (!visited) return null;

  return <>{children}</>;
}
