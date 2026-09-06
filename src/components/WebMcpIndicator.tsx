"use client";

import { useWebMcpStatusStore, type WebMcpStatus } from "@/lib/webmcp/status";

interface IndicatorCopy {
  on: boolean;
  title: string;
}

function describeStatus(status: WebMcpStatus, toolCount: number): IndicatorCopy {
  switch (status) {
    case "registered":
      return { on: true, title: `${toolCount} WebMCP tools registered for browser agents` };
    case "unsupported":
      return { on: false, title: "This browser does not expose WebMCP (document.modelContext)" };
    case "error":
      return { on: false, title: "WebMCP tool registration failed; see the console" };
    default:
      return { on: false, title: "WebMCP tools are not registered" };
  }
}

/**
 * One line under the build date in the sidebar footer: a dot and "Agent
 * tools on" or "Agent tools off". The title carries the reason, so the
 * footer stays quiet and the detail is one hover away.
 */
export function WebMcpIndicator() {
  const status = useWebMcpStatusStore((state) => state.status);
  const toolCount = useWebMcpStatusStore((state) => state.toolCount);
  const { on, title } = describeStatus(status, toolCount);

  return (
    <span
      role="status"
      title={title}
      className="font-mono mt-1 inline-flex items-center gap-1.5"
      style={{ fontSize: "10.5px", color: "var(--ink-4)" }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: on ? "var(--ok-500)" : "var(--ink-5)" }}
      />
      {on ? "Agent tools on" : "Agent tools off"}
    </span>
  );
}
