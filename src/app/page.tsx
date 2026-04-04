import { KanbanBoard } from "@/components/KanbanBoard";
import { FirstVisitGate } from "@/components/about/FirstVisitRedirect";

export default function Home() {
  return (
    <FirstVisitGate>
      <main className="min-h-screen bg-background">
        <KanbanBoard />
      </main>
    </FirstVisitGate>
  );
}
