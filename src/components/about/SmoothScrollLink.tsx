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
    // Anchor semantics preserved for screen readers (announces target);
    // we override default jump-scroll with a smooth scroll instead.
    // react-doctor-disable-next-line react-doctor/no-prevent-default
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
