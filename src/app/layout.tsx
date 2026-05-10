import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaUpdater from "@/components/PwaUpdater";
import InstallPWA from "@/components/InstallPWA";
import { IOSClassProvider } from "@/components/IOSClassProvider";
import { NotificationProvider } from "@/components/NotificationProvider";

// Inkwell rule #5: platform fonts only — no Google Fonts. The font stacks
// (--font-sans, --font-serif, --font-mono) are defined in globals.css.

export const metadata: Metadata = {
  metadataBase: new URL("https://cascade.vinny.dev"),
  title: "Cascade - Task Management",
  description: "Privacy-first, accessible kanban board task management system",
  keywords: ["kanban", "task management", "productivity", "privacy-first", "offline"],
  authors: [{ name: "Cascade" }],
  creator: "Cascade",
  publisher: "Cascade",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/images/cascade-icon.svg",
    shortcut: "/images/cascade-icon.svg",
    apple: "/images/cascade-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cascade",
    startupImage: [
      {
        url: "/images/cascade-icon.svg",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cascade.vinny.dev",
    siteName: "Cascade",
    title: "Cascade - Privacy-First Task Management",
    description: "A beautiful, accessible kanban board for managing your tasks. 100% client-side, privacy-first, and works offline.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cascade - Privacy-First Task Management",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cascade - Privacy-First Task Management",
    description: "A beautiful, accessible kanban board for managing your tasks. 100% client-side, privacy-first, and works offline.",
    images: ["/images/og-image.png"],
    creator: "@cascade",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Intentionally do NOT set maximumScale or userScalable: pinch-to-zoom is
  // an accessibility requirement (WCAG 2.2 SC 1.4.4 Resize Text) and the iOS
  // input-zoom annoyance is already handled by setting `font-size: 16px` on
  // the relevant inputs in globals.css.
  shrinkToFit: "no", // Prevent iOS Safari from shrinking viewport
  viewportFit: "cover", // For iOS notch handling
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B4A8C" },
    { media: "(prefers-color-scheme: dark)", color: "#7A8AD1" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/images/cascade-icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/cascade-icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cascade" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3B4A8C" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* disableTransitionOnChange is intentionally OFF — globals.css
            transitions background-color, color, and border-color over 200ms
            during the theme swap so light↔dark is a smooth crossfade. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <IOSClassProvider />
          <NotificationProvider />
          {children}
          <InstallPWA />
          <PwaUpdater />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
