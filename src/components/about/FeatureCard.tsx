import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="transition-shadow duration-200"
      style={{
        background: "var(--paper-card)",
        // 1.5px --hairline-strong is the system's card rule; this was 1px
        // --hairline, a lighter divider token used for a bounded surface.
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-xs)",
        padding: "20px 18px 18px",
      }}
    >
      <div
        className="flex size-9 items-center justify-center rounded-md mb-3"
        style={{
          background: "var(--paper-1)",
          border: "1px solid var(--hairline)",
          color: "var(--accent-500)",
        }}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </div>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "-0.005em",
          color: "var(--ink-1)",
          marginBottom: "4px",
        }}
      >
        {title}
      </h3>
      <p
        className="leading-relaxed"
        style={{ fontSize: "13px", color: "var(--ink-3)" }}
      >
        {description}
      </p>
    </div>
  );
}
