"use client";

import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, CheckCircle, Search, Settings, Tag, Target, Zap } from "lucide-react";
import { GuideGlyph } from "./GuideGlyph";
import type { GuideStep } from "./guideStepTypes";

export const productivitySteps: GuideStep[] = [
  {
    title: "Search and Filtering",
    icon: <Search className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Find tasks quickly using the search bar and filters at the top of the board.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Search} /></Badge>
            <div>
              <p className="font-medium">Search by text</p>
              <p className="text-sm text-muted-foreground">Search task titles and descriptions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Tag} /></Badge>
            <div>
              <p className="font-medium">Filter by tags</p>
              <p className="text-sm text-muted-foreground">Use tags to categorize and filter tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Zap} /></Badge>
            <div>
              <p className="font-medium">Filter by priority</p>
              <p className="text-sm text-muted-foreground">Focus on high, medium, or low priority tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={BarChart3} /></Badge>
            <div>
              <p className="font-medium">Filter by status</p>
              <p className="text-sm text-muted-foreground">View only tasks in specific columns</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1"><GuideGlyph icon={Calendar} /></Badge>
            <div>
              <p className="font-medium">View overdue tasks</p>
              <p className="text-sm text-muted-foreground">Tasks with past due dates are highlighted for easy identification</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Archiving and Settings",
    icon: <Settings className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Keep your workspace clean by archiving completed tasks and customizing your experience.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Archiving Tasks:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Archive individual tasks from the task menu</li>
              <li>• Set up automatic archiving in Settings</li>
              <li>• View archived tasks from the sidebar</li>
            </ul>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Customization Options:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Choose between light, dark, or system theme</li>
              <li>• Enable accessibility features</li>
              <li>• Configure automatic archiving</li>
              <li>• Enable keyboard shortcuts</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Best Practices",
    icon: <CheckCircle className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Follow these best practices to get the most out of Cascade Task Management.
        </p>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Task Organization</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Keep task titles clear and actionable</li>
              <li>• Use descriptions for additional context</li>
              <li>• Set appropriate priorities to focus on what matters</li>
              <li>• Use tags consistently for easy filtering</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Workflow Management</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Limit work-in-progress tasks to stay focused</li>
              <li>• Update progress regularly for better tracking</li>
              <li>• Move tasks promptly as status changes</li>
              <li>• Archive completed tasks to reduce clutter</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Productivity Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Create separate boards for different projects</li>
              <li>• Use the search function to quickly find tasks</li>
              <li>• Set due dates to track important deadlines</li>
              <li>• Review your boards regularly</li>
              <li>• Master keyboard shortcuts (press H to see all shortcuts)</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];
