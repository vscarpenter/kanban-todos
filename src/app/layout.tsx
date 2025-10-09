import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaUpdater from "@/components/PwaUpdater";
import { IOSClassProvider } from "@/components/IOSClassProvider";

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "600"],
});

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
  maximumScale: 1,
  userScalable: false, // Prevent zoom on iOS for better touch UX
  shrinkToFit: "no", // Prevent iOS Safari from shrinking viewport
  viewportFit: "cover", // For iOS notch handling
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B5CF6" },
    { media: "(prefers-color-scheme: dark)", color: "#6D28D9" },
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
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IOSClassProvider />
          {children}
          <PwaUpdater />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
