import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/about/HeroSection";
import { HowItWorksSection } from "@/components/about/HowItWorksSection";
import { FeaturesSection } from "@/components/about/FeaturesSection";
import { PrivacySection } from "@/components/about/PrivacySection";
import { FooterCTA } from "@/components/about/FooterCTA";
import { ScrollReveal } from "@/components/about/ScrollReveal";
import { EnterAppLink } from "@/components/about/EnterAppLink";

export const metadata: Metadata = {
  title: "About Cascade — Privacy-First Kanban Task Management",
  description:
    "Cascade is a privacy-first Kanban board that stores all your tasks locally. No account required. No server. Works offline. Free and open source.",
  openGraph: {
    title: "Cascade Task Management",
    description: "Organize your work. Own your data.",
    url: "https://cascade.vinny.dev/about",
    siteName: "Cascade",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cascade Task Management",
    description: "Organize your work. Own your data.",
    creator: "@vscarpenter",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm dark:bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/about" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cascade-icon.svg"
              alt="Cascade Logo"
              className="size-8"
            />
            <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Cascade
            </span>
          </Link>
          <Button asChild size="sm">
            <EnterAppLink>Open App</EnterAppLink>
          </Button>
        </div>
      </nav>

      <main>
        <HeroSection />

        <ScrollReveal>
          <HowItWorksSection />
        </ScrollReveal>

        <ScrollReveal>
          <FeaturesSection />
        </ScrollReveal>

        <ScrollReveal>
          <PrivacySection />
        </ScrollReveal>
      </main>

      <ScrollReveal>
        <FooterCTA />
      </ScrollReveal>
    </>
  );
}
