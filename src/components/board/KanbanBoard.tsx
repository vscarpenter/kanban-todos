"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Task } from "@/lib/types";
import KanbanColumn from "../kanban/KanbanColumn";
import { ColumnTabs } from "./ColumnTabs";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useDragLifecycle } from "@/hooks/useDragLifecycle";

// Lazy load drag-and-drop functionality
const DragDropProvider = dynamic(() => import("../DragDropProvider").then(mod => ({ default: mod.DragDropProvider })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading board…</div></div>,
  ssr: false
});

interface KanbanBoardProps {
  tasks: Task[];
  onAddTask?: (status: Task['status']) => void;
}

export function KanbanBoard({ tasks, onAddTask }: KanbanBoardProps) {
  // Board/search context lives here, in the orchestrator, and flows to the
  // columns as props — the columns themselves stay presentation-only.
  const { boards, currentBoardId } = useBoardStore();
  const {
    filters: { search, crossBoardSearch },
    searchState: { highlightedTaskId },
    moveTask,
  } = useTaskStore();
  const isCrossBoardSearch = crossBoardSearch && search.length > 0;

  // Mobile: which column is currently visible. Desktop ignores this — the grid
  // always shows all three columns side-by-side.
  const [activeColumn, setActiveColumn] = useState<Task['status']>('todo');
  // One seam owns the whole drag interaction: the overlay task, the mobile
  // scaled-down layout flag (drag.isDragging), persistence, and the completion
  // celebration. The columns just render; DragDropProvider just wires sensors.
  const drag = useDragLifecycle(tasks, moveTask);

  // Memoize filtered tasks to avoid unnecessary recalculations
  const todoTasks = useMemo(() => tasks.filter(task => task.status === 'todo'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(task => task.status === 'in-progress'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter(task => task.status === 'done'), [tasks]);

  // Memoize columns array to prevent unnecessary re-renders
  const columns = useMemo(() => [
    { title: "To Do", tasks: todoTasks, count: todoTasks.length, status: 'todo' as const },
    { title: "In Progress", tasks: inProgressTasks, count: inProgressTasks.length, status: 'in-progress' as const },
    { title: "Done", tasks: doneTasks, count: doneTasks.length, status: 'done' as const }
  ], [todoTasks, inProgressTasks, doneTasks]);

  // Announce column changes to screen readers via a polite aria-live region.
  // The region is rendered below the tabs.
  const announceColumnChange = useCallback((columnTitle: string, columnCount: number) => {
    const announcement = `Viewing ${columnTitle} column with ${columnCount} task${columnCount !== 1 ? 's' : ''}`;
    const liveRegion = document.getElementById('mobile-column-announcer');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  }, []);

  // Handle column tab change on mobile. Announces the change so screen readers
  // pick it up — without this, tapping a tab is silent for assistive tech.
  const handleColumnTabChange = useCallback((column: Task['status']) => {
    setActiveColumn(column);
    const target = columns.find(col => col.status === column);
    if (target) {
      announceColumnChange(target.title, target.count);
    }
  }, [columns, announceColumnChange]);

  return (
    <DragDropProvider
      activeTask={drag.activeTask}
      onDragStart={drag.handleDragStart}
      onDragEnd={drag.handleDragEnd}
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Screen reader announcer for column navigation */}
        <div
          id="mobile-column-announcer"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Column Navigator - Mobile Only */}
        <div className="md:hidden">
          <ColumnTabs
            activeColumn={activeColumn}
            onColumnChange={handleColumnTabChange}
            todoCount={todoTasks.length}
            inProgressCount={inProgressTasks.length}
            doneCount={doneTasks.length}
          />
        </div>

        {/* Kanban Columns Container.
            Mobile default: flex with one visible column (others get `hidden`).
            Mobile during drag: forced 3-col grid with scale-[0.85] so the user
            can drop into another column without needing to tab first.
            Desktop: 3-col grid always. */}
        <div
          className={`flex md:grid md:grid-cols-3 gap-6 min-h-full board-animate-in ${
            drag.isDragging ? 'md:grid-cols-3 !grid grid-cols-3 !gap-2 scale-[0.85]' : ''
          }`}
          role="region"
          aria-label="Kanban board columns"
        >
          <KanbanColumn
            title="To Do"
            tasks={todoTasks}
            status="todo"
            boards={boards}
            currentBoardId={currentBoardId}
            highlightedTaskId={highlightedTaskId}
            isCrossBoardSearch={isCrossBoardSearch}
            onAddTask={onAddTask}
            className={activeColumn === 'todo' ? 'flex' : 'hidden md:flex'}
          />

          <KanbanColumn
            title="In Progress"
            tasks={inProgressTasks}
            status="in-progress"
            boards={boards}
            currentBoardId={currentBoardId}
            highlightedTaskId={highlightedTaskId}
            isCrossBoardSearch={isCrossBoardSearch}
            onAddTask={onAddTask}
            className={activeColumn === 'in-progress' ? 'flex' : 'hidden md:flex'}
          />

          <KanbanColumn
            title="Done"
            tasks={doneTasks}
            status="done"
            boards={boards}
            currentBoardId={currentBoardId}
            highlightedTaskId={highlightedTaskId}
            isCrossBoardSearch={isCrossBoardSearch}
            onAddTask={onAddTask}
            className={activeColumn === 'done' ? 'flex' : 'hidden md:flex'}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}
