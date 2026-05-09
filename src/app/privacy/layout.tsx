import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Cascade",
  description:
    "How Cascade handles your data: 100% local-first, no servers, no accounts, no analytics. Your tasks never leave your device.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
