"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Move, 
  Search, 
  Settings,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Share
} from "lucide-react";

interface UserGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const guideSteps = [
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
            <li>• Progress tracking for in-progress tasks</li>
            <li>• Search and filtering capabilities</li>
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
    )
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
    )
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
    )
  },
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
              <p className="text-sm text-muted-foreground">Add title, description, priority, and tags</p>
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
    )
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
            <li>• Completion date (if finished)</li>
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
    )
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
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
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
            <Badge variant="outline" className="mt-1">💡</Badge>
            <div>
              <p className="font-medium">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                When you move a task to &ldquo;Done&rdquo;, it&rsquo;s automatically marked as 100% complete
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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
    )
  },
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
            <Badge variant="outline" className="mt-1">🔍</Badge>
            <div>
              <p className="font-medium">Search by text</p>
              <p className="text-sm text-muted-foreground">Search task titles and descriptions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">🏷️</Badge>
            <div>
              <p className="font-medium">Filter by tags</p>
              <p className="text-sm text-muted-foreground">Use tags to categorize and filter tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">⚡</Badge>
            <div>
              <p className="font-medium">Filter by priority</p>
              <p className="text-sm text-muted-foreground">Focus on high, medium, or low priority tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">📊</Badge>
            <div>
              <p className="font-medium">Filter by status</p>
              <p className="text-sm text-muted-foreground">View only tasks in specific columns</p>
            </div>
          </div>
        </div>
      </div>
    )
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
    )
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
            <h4 className="font-medium mb-2">📋 Task Organization</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Keep task titles clear and actionable</li>
              <li>• Use descriptions for additional context</li>
              <li>• Set appropriate priorities to focus on what matters</li>
              <li>• Use tags consistently for easy filtering</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 Workflow Management</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Limit work-in-progress tasks to stay focused</li>
              <li>• Update progress regularly for better tracking</li>
              <li>• Move tasks promptly as status changes</li>
              <li>• Archive completed tasks to reduce clutter</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎯 Productivity Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Create separate boards for different projects</li>
              <li>• Use the search function to quickly find tasks</li>
              <li>• Review your boards regularly</li>
              <li>• Take advantage of keyboard shortcuts</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
];

export function UserGuideDialog({ open, onOpenChange }: UserGuideDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {guideSteps[currentStep].icon}
            {guideSteps[currentStep].title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {guideSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-primary' 
                  : index < currentStep 
                    ? 'bg-primary/60' 
                    : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {currentStep + 1} of {guideSteps.length}
          </span>
        </div>

        <Separator />

        {/* Content */}
        <div className="py-4">
          {guideSteps[currentStep].content}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === guideSteps.length - 1 ? (
              <Button onClick={() => onOpenChange(false)}>
                Get Started
              </Button>
            ) : (
              <Button onClick={nextStep} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
