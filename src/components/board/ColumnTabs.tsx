"use client";

import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColumnTabsProps {
  activeColumn: Task['status'];
  onColumnChange: (column: Task['status']) => void;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

const COLUMNS = [
  { id: 'todo' as const, label: 'To Do' },
  { id: 'in-progress' as const, label: 'In Progress' },
  { id: 'done' as const, label: 'Done' },
];

export function ColumnTabs({
  activeColumn,
  onColumnChange,
  todoCount,
  inProgressCount,
  doneCount,
}: ColumnTabsProps) {
  const getCount = (columnId: Task['status']) => {
    switch (columnId) {
      case 'todo': return todoCount;
      case 'in-progress': return inProgressCount;
      case 'done': return doneCount;
    }
  };

  // Visibility (mobile only) is owned by the parent in KanbanBoard; this
  // component is layout only.
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {COLUMNS.map((column) => (
        <button
          key={column.id}
          onClick={() => onColumnChange(column.id)}
          aria-pressed={activeColumn === column.id}
          className={cn(
            "flex-1 min-h-[45px] min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
            activeColumn === column.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-2 text-foreground hover:bg-surface-2/80"
          )}
        >
          {column.label}
          <span className="ml-2 text-xs opacity-75 font-normal">
            ({getCount(column.id)})
          </span>
        </button>
      ))}
    </div>
  );
}
