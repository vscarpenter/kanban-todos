"use client";

import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ColumnData {
  title: string;
  tasks: Task[];
  count: number;
  status: Task['status'];
}

interface ColumnNavigatorProps {
  columns: ColumnData[];
  activeIndex: number;
  onSelectColumn: (index: number) => void;
}

export function ColumnNavigator({ columns, activeIndex, onSelectColumn }: ColumnNavigatorProps) {
  return (
    <nav
      className="flex items-center justify-between gap-2 px-4 py-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg"
      role="navigation"
      aria-label="Column navigation"
    >
      {columns.map((column, index) => {
        const isActive = activeIndex === index;
        const taskText = column.count === 1 ? 'task' : 'tasks';

        return (
          <Button
            key={column.status}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectColumn(index)}
            className="flex-1 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={`${column.title} column, ${column.count} ${taskText}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="truncate">{column.title}</span>
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="text-xs"
              aria-hidden="true"
            >
              {column.count}
            </Badge>
          </Button>
        );
      })}
    </nav>
  );
}
