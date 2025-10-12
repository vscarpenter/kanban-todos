import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Install Cascade - PWA Installation Guide",
  description: "Learn how to install Cascade as a Progressive Web App on your device for offline access and quick launch.",
};

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Title Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Install Cascade
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Install Cascade on your device for quick access and offline use. The app works fully offline once installed.
            </p>
          </div>

          {/* Desktop Instructions */}
          <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Desktop</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Chrome, Edge, or Brave</h3>
                <ol className="ml-5 space-y-2 text-muted-foreground list-decimal">
                  <li>Open Cascade in Chrome, Edge, or Brave browser</li>
                  <li>Look for the <strong>install icon</strong> in the address bar (looks like a computer monitor with a download arrow)</li>
                  <li>Click the install icon or use the browser menu:
                    <ul className="ml-5 mt-1 list-disc">
                      <li>Chrome: Menu (⋮) → &quot;Install Cascade...&quot;</li>
                      <li>Edge: Menu (⋯) → &quot;Apps&quot; → &quot;Install Cascade&quot;</li>
                    </ul>
                  </li>
                  <li>Click <strong>&quot;Install&quot;</strong> in the popup dialog</li>
                  <li>Launch the app from your Start Menu (Windows), Applications (macOS), or App Menu (Linux)</li>
                </ol>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <strong>Quick tip:</strong> Press <kbd className="rounded border bg-background px-2 py-0.5 font-mono text-xs">Ctrl+Shift+A</kbd> (Windows/Linux) or <kbd className="rounded border bg-background px-2 py-0.5 font-mono text-xs">Cmd+Shift+A</kbd> (macOS) to open the install dialog
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Firefox</h3>
                <p className="text-sm text-muted-foreground">
                  Firefox doesn&apos;t support automatic PWA installation. For the best experience, use Chrome or Edge.
                </p>
              </div>
            </div>
          </section>

          {/* iOS Instructions */}
          <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">iOS (iPhone & iPad)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Safari (Required)</h3>
                <ol className="ml-5 space-y-2 text-muted-foreground list-decimal">
                  <li>Open Cascade in <strong>Safari</strong> browser (must be Safari, not Chrome)</li>
                  <li>Tap the <strong>Share button</strong> (square with arrow pointing up) at the bottom of the screen</li>
                  <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                  <li>Edit the name if desired (default: &quot;Cascade&quot;)</li>
                  <li>Tap <strong>&quot;Add&quot;</strong> in the top-right corner</li>
                  <li>Find the app on your home screen with the Cascade icon</li>
                </ol>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <strong>Note:</strong> iOS requires Safari for PWA installation. Once installed, the app opens in its own window without browser UI.
              </div>
            </div>
          </section>

          {/* Android Instructions */}
          <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Android</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Chrome (Recommended)</h3>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-sm font-medium">Method 1: Install Banner</p>
                    <ol className="ml-5 space-y-2 text-muted-foreground list-decimal text-sm">
                      <li>Open Cascade in Chrome browser</li>
                      <li>Wait for the install banner to appear at the bottom</li>
                      <li>Tap <strong>&quot;Install&quot;</strong> on the banner</li>
                      <li>Confirm installation in the dialog</li>
                      <li>Find the app in your app drawer</li>
                    </ol>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Method 2: Browser Menu</p>
                    <ol className="ml-5 space-y-2 text-muted-foreground list-decimal text-sm">
                      <li>Open Cascade in Chrome</li>
                      <li>Tap the menu (⋮) in the top-right corner</li>
                      <li>Select <strong>&quot;Install app&quot;</strong> or &quot;Add to Home screen&quot;</li>
                      <li>Tap <strong>&quot;Install&quot;</strong> in the dialog</li>
                      <li>Find the app in your app drawer or home screen</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <strong>Tip:</strong> The installed app appears in your app drawer just like any other app and can be uninstalled from Settings.
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Why Install?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <h3 className="font-semibold">Quick Access</h3>
                <p className="text-sm text-muted-foreground">
                  Launch from your home screen, dock, or start menu
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Offline Support</h3>
                <p className="text-sm text-muted-foreground">
                  Access your tasks without an internet connection
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Native Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Runs in its own window without browser UI
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Better Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Optimized startup and faster load times
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Troubleshooting</h2>
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-sm font-semibold">Install button not appearing?</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure you&apos;re using Chrome or Edge on desktop. The app may already be installed.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">&quot;Add to Home Screen&quot; not available on iOS?</h3>
                <p className="text-sm text-muted-foreground">
                  You must use Safari browser (not Chrome or Firefox). Also check if you&apos;re in private browsing mode.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">App won&apos;t work offline?</h3>
                <p className="text-sm text-muted-foreground">
                  Open the app while online at least once to download all necessary files.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                For more help, check the{" "}
                <a
                  href="/docs/installation-guide.md"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  detailed installation guide
                </a>
                .
              </p>
            </div>
          </section>

          {/* Back to App */}
          <div className="flex justify-center pt-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Cascade
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
          <p>
            Cascade is a privacy-first task management system. All data stays on your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
