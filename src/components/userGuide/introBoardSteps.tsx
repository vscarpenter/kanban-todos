"use client";

import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, Settings } from "lucide-react";
import type { GuideStep } from "./guideStepTypes";

export const introBoardSteps: GuideStep[] = [
  {
    title: "Welcome to Cascade Task Management",
    icon: <Lightbulb className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Cascade is a privacy-first Kanban task management application that helps you organize your work efficiently.
          All your data stays on your device - nothing is sent to external servers.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Key Features:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Multiple boards for different projects</li>
            <li>• Drag-and-drop task management</li>
            <li>• Due dates with smart date picker</li>
            <li>• Progress tracking for in-progress tasks</li>
            <li>• Search and filtering capabilities</li>
            <li>• Comprehensive keyboard shortcuts</li>
            <li>• Privacy-first - all data stored locally</li>
            <li>• Task sharing without compromising privacy</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Privacy Guarantee:</strong> Your data never leaves your device.
            For complete details, see our Privacy Policy in the sidebar.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Creating Your First Board",
    icon: <Plus className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Boards help you organize different projects or areas of work. You can create unlimited boards.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Click &ldquo;New Board&rdquo; in the sidebar</p>
              <p className="text-sm text-muted-foreground">Look for the plus icon next to &ldquo;Boards&rdquo;</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Give your board a name and description</p>
              <p className="font-medium">Choose a descriptive name like &ldquo;Website Project&rdquo; or &ldquo;Personal Tasks&rdquo;</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Select a color for easy identification</p>
              <p className="text-sm text-muted-foreground">Colors help you quickly identify different boards</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Managing Your Boards",
    icon: <Settings className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Once you have boards, you can easily manage them with editing, duplication, and deletion options.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Access board options</p>
              <p className="text-sm text-muted-foreground">Hover over any board in the sidebar to see the menu (⋯) button</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Edit board settings</p>
              <p className="text-sm text-muted-foreground">Change name, description, or color anytime</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Duplicate boards</p>
              <p className="text-sm text-muted-foreground">Create copies of boards for similar projects</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">4</Badge>
            <div>
              <p className="font-medium">Delete boards safely</p>
              <p className="text-sm text-muted-foreground">Confirmation required - default boards cannot be deleted</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Safety First:</strong> Deleting a board will permanently remove all its tasks. You&apos;ll need to type the board name to confirm deletion.
          </p>
        </div>
      </div>
    ),
  },
];
