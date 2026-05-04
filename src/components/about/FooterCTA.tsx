import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "@/lib/icons";
import { EnterAppLink } from "./EnterAppLink";

export function FooterCTA() {
  return (
    <footer className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4">
          Ready to get organized
          <span style={{ color: "var(--accent-500)" }}>?</span>
        </h2>

        <p className="text-lg text-muted-foreground mb-10">
          Free. Private. No sign-up. Open your browser and start.
        </p>

        <Button asChild size="lg" className="mb-12">
          <EnterAppLink>
            Open Cascade
            <ArrowRight className="ml-1 size-4" />
          </EnterAppLink>
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>Built by Vinny Carpenter</span>
          <span aria-hidden="true">&middot;</span>
          <span>MIT License</span>
          <span aria-hidden="true">&middot;</span>
          <span>cascade.vinny.dev</span>
          <span aria-hidden="true">&middot;</span>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/vscarpenter/kanban-todos"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
