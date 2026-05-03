import { Button } from "@/components/ui/button";
import { Lock, Monitor, Code2, ArrowRight } from "@/lib/icons";
import { EnterAppLink } from "./EnterAppLink";
import { SmoothScrollLink } from "./SmoothScrollLink";

export function HeroSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Privacy-First Task Management
        </p>

        <h1 className="mb-6">
          Organize your work
          <span style={{ color: "var(--accent-500)" }}>.</span>
          <br />
          Own your data
          <span style={{ color: "var(--accent-500)" }}>.</span>
        </h1>

        <p className="mx-auto max-w-[52ch] text-lg text-muted-foreground mb-10">
          Cascade is a Kanban board that keeps everything in your browser.
          No account. No server. No surveillance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Button asChild size="lg">
            <EnterAppLink>
              Open Cascade
              <ArrowRight className="ml-1 size-4" />
            </EnterAppLink>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <SmoothScrollLink href="#how-it-works">
              See how it works
            </SmoothScrollLink>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-4" />
            Local storage only
          </span>
          <span className="flex items-center gap-1.5">
            <Monitor className="size-4" />
            Works offline
          </span>
          <span className="flex items-center gap-1.5">
            <Code2 className="size-4" />
            MIT open source
          </span>
        </div>
      </div>
    </section>
  );
}
