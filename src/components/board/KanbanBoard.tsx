"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Task } from "@/lib/types";
import KanbanColumn from "../kanban/KanbanColumn";
import { ColumnNavigator } from "./ColumnNavigator";
import { useSettingsStore } from "@/lib/stores/settingsStore";

// Lazy load drag-and-drop functionality
const DragDropProvider = dynamic(() => import("../DragDropProvider").then(mod => ({ default: mod.DragDropProvider })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading board...</div></div>,
  ssr: false
});

interface KanbanBoardProps {
  tasks: Task[];
  onNavigateToBoard: (boardId: string, taskId: string) => void;
}

export function KanbanBoard({ tasks, onNavigateToBoard }: KanbanBoardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { settings } = useSettingsStore();

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

  // Announce column changes to screen readers
  const announceColumnChange = useCallback((columnTitle: string, columnCount: number) => {
    const announcement = `Viewing ${columnTitle} column with ${columnCount} task${columnCount !== 1 ? 's' : ''}`;
    const liveRegion = document.getElementById('mobile-column-announcer');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  }, []);

  // Track scroll position to update active column indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const columnWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / columnWidth);

      // Only update if index changed
      if (newIndex !== activeColumnIndex) {
        setActiveColumnIndex(newIndex);

        // Announce to screen readers
        const column = columns[newIndex];
        if (column) {
          announceColumnChange(column.title, column.count);
        }
      }

      // Track scrolling state for visual feedback
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeColumnIndex, columns, announceColumnChange]);

  // Handle column navigation with smooth animations
  const handleColumnSelect = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const columnWidth = container.offsetWidth;

    // Use smooth scrolling unless user has reduced motion preference
    const scrollBehavior = settings.accessibility.reduceMotion ? 'auto' : 'smooth';

    container.scrollTo({
      left: columnWidth * index,
      behavior: scrollBehavior
    });

    // Announce navigation to screen readers
    const column = columns[index];
    if (column) {
      announceColumnChange(column.title, column.count);
    }
  }, [columns, announceColumnChange, settings.accessibility.reduceMotion]);

  // Handle drag start - disable scrolling
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    // Disable scroll snap during drag
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = 'none';
      scrollContainerRef.current.style.overflow = 'hidden';
    }
  }, []);

  // Handle drag end - re-enable scrolling
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    // Re-enable scroll snap after drag
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = '';
      scrollContainerRef.current.style.overflow = '';
    }
  }, []);

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          <ColumnNavigator
            columns={columns}
            activeIndex={activeColumnIndex}
            onSelectColumn={handleColumnSelect}
          />
        </div>

        {/* Kanban Columns Container */}
        <div
          ref={scrollContainerRef}
          className={`flex md:grid md:grid-cols-3 gap-6 min-h-full overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide mobile-scroll-container transition-all duration-150 ${
            isScrolling ? 'opacity-95' : 'opacity-100'
          } ${
            isDragging ? 'md:grid-cols-3 !grid grid-cols-3 !overflow-visible !gap-2 scale-[0.85]' : ''
          }`}
          role="region"
          aria-label="Kanban board columns"
        >
          <KanbanColumn
            title="To Do"
            tasks={todoTasks}
            status="todo"
            color="bg-blue-50 dark:bg-blue-950/20"
            borderColor="border-blue-200 dark:border-blue-800"
            onNavigateToBoard={onNavigateToBoard}
          />

          <KanbanColumn
            title="In Progress"
            tasks={inProgressTasks}
            status="in-progress"
            color="bg-yellow-50 dark:bg-yellow-950/20"
            borderColor="border-yellow-200 dark:border-yellow-800"
            onNavigateToBoard={onNavigateToBoard}
          />

          <KanbanColumn
            title="Done"
            tasks={doneTasks}
            status="done"
            color="bg-green-50 dark:bg-green-950/20"
            borderColor="border-green-200 dark:border-green-800"
            onNavigateToBoard={onNavigateToBoard}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}