"use client";

import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Clock,
  Edit3,
  Lightbulb,
  Move,
  Share,
  Target,
  Zap,
} from "lucide-react";
import { GuideGlyph } from "./GuideGlyph";
import type { GuideStep } from "./guideStepTypes";

export const taskWorkflowSteps: GuideStep[] = [
  {
    title: "Adding and Managing Tasks",
    icon: <Edit3 className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Tasks are the core of your workflow. Each task moves through three columns: To Do, In Progress, and Done.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Click &ldquo;Add Task&rdquo; in any column</p>
              <p className="text-sm text-muted-foreground">Tasks start in &ldquo;To Do&rdquo; by default</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Fill in task details</p>
              <p className="text-sm text-muted-foreground">Add title, description, due date, priority, and tags</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Edit tasks anytime</p>
              <p className="text-sm text-muted-foreground">Click the three dots menu on any task card</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Sharing Tasks",
    icon: <Share className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Share task details with others via email or by copying formatted text, even if they don&apos;t have access to your Kanban app.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Access the share menu</p>
              <p className="text-sm text-muted-foreground">Click the three dots menu on any task card and select &ldquo;Share Task&rdquo;</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Choose your sharing method</p>
              <p className="text-sm text-muted-foreground">Email tab: Opens your email client with pre-filled details</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Or copy task details to clipboard</p>
              <p className="text-sm text-muted-foreground">Copy Details tab: Get plain text or Markdown formatted task information</p>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Shared Information Includes:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Task title and description</li>
            <li>• Status, priority, and creation date</li>
            <li>• Due date and completion date (if set)</li>
            <li>• Progress percentage (for in-progress tasks)</li>
            <li>• Tags for categorization</li>
            <li>• Link to your Kanban app</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Privacy First:</strong> Task sharing works completely offline - no data is sent to external servers.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Using Drag-and-Drop",
    icon: <Move className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Move tasks between columns by dragging and dropping them. This is the fastest way to update task status.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">The Three Columns:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-400 rounded"></div>
                <span className="font-medium">To Do:</span>
                <span className="text-muted-foreground">Tasks waiting to be started</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="font-medium">In Progress:</span>
                <span className="text-muted-foreground">Tasks currently being worked on</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="font-medium">Done:</span>
                <span className="text-muted-foreground">Completed tasks</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Lightbulb} /></Badge>
            <div>
              <p className="font-medium">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                When you move a task to &ldquo;Done&rdquo;, it&rsquo;s automatically marked as 100% complete
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Setting Due Dates",
    icon: <Calendar className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Set due dates for tasks to track deadlines and stay organized. The smart date picker makes scheduling easy.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Calendar} /></Badge>
            <div>
              <p className="font-medium">Smart date picker</p>
              <p className="text-sm text-muted-foreground">Click the due date field to open the interactive calendar</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Zap} /></Badge>
            <div>
              <p className="font-medium">Quick presets available</p>
              <p className="text-sm text-muted-foreground">Choose &ldquo;Today&rdquo;, &ldquo;Tomorrow&rdquo;, or &ldquo;Next Week&rdquo; for faster scheduling</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Clock} /></Badge>
            <div>
              <p className="font-medium">Set specific times</p>
              <p className="text-sm text-muted-foreground">Choose exact times in 15-minute intervals using the time dropdown</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Target} /></Badge>
            <div>
              <p className="font-medium">Clear due dates anytime</p>
              <p className="text-sm text-muted-foreground">Use the &ldquo;Clear&rdquo; button to remove due dates if plans change</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Smart Display:</strong> Due dates show as &ldquo;Today at 2:00 PM&rdquo; or &ldquo;Tomorrow at 9:00 AM&rdquo; for easy reading
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Progress Tracking",
    icon: <BarChart3 className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Track progress on tasks that are &ldquo;In Progress&rdquo; using the built-in progress slider.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Move a task to &ldquo;In Progress&rdquo;</p>
              <p className="text-sm text-muted-foreground">Progress tracking is only available for active tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Edit the task to see the progress slider</p>
              <p className="text-sm text-muted-foreground">The slider appears only for &ldquo;In Progress&rdquo; tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Adjust progress in 5% increments</p>
              <p className="text-sm text-muted-foreground">Progress bar shows on the task card</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Automatic Progress:</strong> When you move a task to &ldquo;Done&rdquo;, progress automatically becomes 100%
          </p>
        </div>
      </div>
    ),
  },
];
