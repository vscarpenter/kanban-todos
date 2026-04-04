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
    localStorage.setItem(VISITED_KEY, "true");
  }, []);

  return (
    <Link href="/" onClick={markVisited} className={className}>
      {children}
    </Link>
  );
}
