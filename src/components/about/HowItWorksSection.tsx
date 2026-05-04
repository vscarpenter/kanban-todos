function MockTaskCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-sm dark:bg-surface">
      {children}
    </div>
  );
}

function MockColumn({
  title,
  dotClass,
  children,
}: {
  title: string;
  dotClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-[140px] rounded-xl bg-muted/30 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-semibold text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MockProgressBar({ percent }: { percent: string }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{percent}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-2">
        <div className={`h-1.5 w-[60%] rounded-full bg-primary`} />
      </div>
    </div>
  );
}

function KanbanMock() {
  return (
    <div className="flex gap-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 shadow-sm">
      <MockColumn title="To Do" dotClass="bg-muted-2">
        <MockTaskCard>
          <p className="text-sm font-medium text-foreground">Plan Q3 report</p>
          <p className="mt-1 text-xs text-muted-foreground">Due: Mon</p>
        </MockTaskCard>
        <MockTaskCard>
          <p className="text-sm font-medium text-foreground">Schedule team 1:1</p>
        </MockTaskCard>
      </MockColumn>

      <MockColumn title="In Progress" dotClass="bg-warning">
        <MockTaskCard>
          <p className="text-sm font-medium text-foreground">Design hero section</p>
          <MockProgressBar percent="60%" />
        </MockTaskCard>
      </MockColumn>

      <MockColumn title="Done" dotClass="bg-success">
        <MockTaskCard>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-success">&#10003;</span>
            <p className="text-sm font-medium text-foreground line-through opacity-70">
              Write copy
            </p>
          </div>
        </MockTaskCard>
      </MockColumn>
    </div>
  );
}

const steps = [
  "Create a board for a project or area of work",
  "Add tasks to the To Do column",
  "Drag them right as you make progress",
  "Done tasks archive automatically or on demand",
];

function StepList() {
  return (
    <ol className="space-y-3 text-sm">
      {steps.map((text, index) => (
        <li key={text} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}

function Explanation() {
  return (
    <div className="order-1 lg:order-2">
      <span className="label-eyebrow block mb-3">How Cascade Works</span>
      <h2 className="mb-6">
        Three columns
        <span style={{ color: "var(--accent-500)" }}>.</span>
        <br />
        Total clarity
        <span style={{ color: "var(--accent-500)" }}>.</span>
      </h2>

      <div className="space-y-4 text-muted-foreground leading-7 mb-8">
        <p>
          Every task in Cascade moves through three stages: To Do, In
          Progress, and Done. That&apos;s it. Simple enough to actually use.
        </p>
        <p>
          Drag tasks between columns as work evolves. Add due dates, priority
          levels, and tags to keep everything findable. Track progress on
          in-flight work with a built-in percentage slider.
        </p>
        <p>
          Boards keep different projects separate. Create one per area of your
          work — or one per client, per sprint, per season.
        </p>
      </div>

      <StepList />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-surface/60 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <KanbanMock />
          </div>
          <Explanation />
        </div>
      </div>
    </section>
  );
}
