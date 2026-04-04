"use client";

interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SmoothScrollLink({
  href,
  children,
  className,
}: SmoothScrollLinkProps) {
  const targetId = href.replace("#", "");

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}
