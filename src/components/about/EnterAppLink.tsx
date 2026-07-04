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

  const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      markVisited();
      return;
    }

    event.preventDefault();
    markVisited();
    window.location.assign("/");
  }, [markVisited]);

  return (
    <Link href="/" prefetch={false} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
