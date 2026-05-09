import type { Metadata } from "next";
import { KanbanBoard } from "@/components/KanbanBoard";
import { FirstVisitGate } from "@/components/about/FirstVisitRedirect";

export const metadata: Metadata = {
  title: "Cascade — Kanban tasks, fully local",
  description:
    "A privacy-first kanban task manager that runs entirely in your browser. No accounts, no servers, no tracking — your tasks stay on your device.",
};

export default function Home() {
  return (
    <FirstVisitGate>
      <main id="main-content" className="min-h-screen bg-background">
        <KanbanBoard />
      </main>
    </FirstVisitGate>
  );
}
