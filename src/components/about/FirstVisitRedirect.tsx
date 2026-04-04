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
  const router = useRouter();
  const visited = hasVisitedBefore();

  useEffect(() => {
    if (!visited) {
      router.replace("/about/");
    }
  }, [visited, router]);

  if (!visited) return null;

  return <>{children}</>;
}
