import {
  Columns3,
  GripVertical,
  Share2,
  CalendarDays,
  BarChart2,
  Search,
  Archive,
  Lock,
  Keyboard,
  Palette,
  Download,
  Smartphone,
} from "@/lib/icons";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: Columns3,
    title: "Multiple Boards",
    description:
      "Separate boards for every project, client, or area of life. Unlimited.",
  },
  {
    icon: GripVertical,
    title: "Drag and Drop",
    description:
      "Move tasks between To Do, In Progress, and Done in one fluid gesture.",
  },
  {
    icon: Share2,
    title: "Task Sharing",
    description:
      "Share task details via email or clipboard — no app access required.",
  },
  {
    icon: CalendarDays,
    title: "Due Dates",
    description:
      "Smart date picker with Today, Tomorrow, and Next Week presets for faster scheduling.",
  },
  {
    icon: BarChart2,
    title: "Progress Tracking",
    description:
      "Slide a task to 60%, 80%, 100%. Progress bars show right on the card.",
  },
  {
    icon: Search,
    title: "Search and Filters",
    description:
      "Filter by text, tags, priority, status, or overdue. Find anything in seconds.",
  },
  {
    icon: Archive,
    title: "Archiving",
    description:
      "Keep boards clean. Archive completed tasks individually or in bulk.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "IndexedDB local storage. No account. No server. No tracking. Ever.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description:
      "Press H to see all shortcuts. Power users welcome.",
  },
  {
    icon: Palette,
    title: "Light and Dark Mode",
    description:
      "System preference detection or manual override. Looks great either way.",
  },
  {
    icon: Download,
    title: "Export and Import",
    description:
      "Back up everything as JSON. Restore with one click. Your data is yours.",
  },
  {
    icon: Smartphone,
    title: "PWA Ready",
    description:
      "Install on desktop or mobile. Offline support built in. No app store needed.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Features
          </p>
          <h2>
            Everything a task manager needs.
            <br />
            Nothing it doesn&apos;t.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
