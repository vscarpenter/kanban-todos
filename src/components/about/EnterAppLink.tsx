"use client";

import Link from "next/link";
import { useCallback } from "react";
import { VISITED_KEY } from "./visitedKey";

interface EnterAppLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function EnterAppLink({ children, className }: EnterAppLinkProps) {
  const markVisited = useCallback(() => {
    try {
      localStorage.setItem(VISITED_KEY, "true");
    } catch {
      // localStorage unavailable — non-critical, skip silently
    }
  }, []);

  return (
    <Link href="/" onClick={markVisited} className={className}>
      {children}
    </Link>
  );
}
