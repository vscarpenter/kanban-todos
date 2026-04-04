import { Shield, Check } from "@/lib/icons";

const privacyPoints = [
  "No account required",
  "All data in local IndexedDB",
  "No external server calls for task data",
  "Export to JSON anytime",
  "Works fully offline",
  "MIT licensed — audit the code yourself",
];

export function PrivacySection() {
  return (
    <section className="bg-surface/60 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Shield className="size-7 text-primary" />
        </div>

        <h2 className="mb-6">Your tasks never leave your device.</h2>

        <div className="space-y-4 text-muted-foreground leading-7 text-left mb-10">
          <p>
            Cascade stores everything in your browser&apos;s IndexedDB.
            There&apos;s no account to create, no server receiving your
            keystrokes, and no analytics watching what you type.
          </p>
          <p>
            This isn&apos;t a privacy policy. It&apos;s an architectural fact.
            The server that hosts this page has never seen a single task
            you&apos;ve written.
          </p>
          <p>
            If your browser data clears, your tasks clear too. Export regularly
            as JSON to keep a backup. It&apos;s your data — treat it that way.
          </p>
        </div>

        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {privacyPoints.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-success" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
