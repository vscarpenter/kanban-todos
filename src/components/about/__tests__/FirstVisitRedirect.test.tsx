import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VISITED_KEY } from "../visitedKey";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Must import after mocks are set up
import { FirstVisitGate } from "../FirstVisitRedirect";

describe("FirstVisitGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when user has visited before", () => {
    localStorage.setItem(VISITED_KEY, "true");

    const { getByText } = render(
      <FirstVisitGate>
        <p>App Content</p>
      </FirstVisitGate>
    );

    expect(getByText("App Content")).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /about/ when user has not visited", () => {
    render(
      <FirstVisitGate>
        <p>App Content</p>
      </FirstVisitGate>
    );

    expect(mockReplace).toHaveBeenCalledWith("/about/");
  });

  it("does not render children for first-time visitors", () => {
    const { queryByText } = render(
      <FirstVisitGate>
        <p>App Content</p>
      </FirstVisitGate>
    );

    expect(queryByText("App Content")).toBeNull();
  });

  it("defaults to visited when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    const { getByText } = render(
      <FirstVisitGate>
        <p>App Content</p>
      </FirstVisitGate>
    );

    expect(getByText("App Content")).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
