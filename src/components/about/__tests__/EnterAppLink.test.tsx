import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VISITED_KEY } from "../visitedKey";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href: string;
    className?: string;
  }) => (
    <a {...props} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { EnterAppLink } from "../EnterAppLink";

describe("EnterAppLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets visited key in localStorage on click", () => {
    const { getByText } = render(
      <EnterAppLink>Open App</EnterAppLink>
    );

    fireEvent.click(getByText("Open App"));
    expect(localStorage.getItem(VISITED_KEY)).toBe("true");
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { getByText } = render(
      <EnterAppLink>Open App</EnterAppLink>
    );

    expect(() => fireEvent.click(getByText("Open App"))).not.toThrow();
  });
});
