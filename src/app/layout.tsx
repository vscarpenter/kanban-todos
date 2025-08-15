import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
