"use client";

import { Button } from "@/components/ui/button";
import { Task, Board } from "@/lib/types";

interface BoardGroup {
  board: Board;
  tasks: Task[];
}

interface CrossBoardGroupsProps {
  boardGroups: Record<string, BoardGroup>;
  onNavigateToBoard: (boardId: string, taskId: string) => void;
}

export function CrossBoardGroups({ boardGroups, onNavigateToBoard }: CrossBoardGroupsProps) {
  if (Object.keys(boardGroups).length <= 1) return null;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Tasks by Board</h3>
      <div className="space-y-6">
        {Object.entries(boardGroups).map(([boardId, { board, tasks }]) => (
          <div key={boardId} className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: board.color }}
              />
              <h4 className="font-medium text-foreground">{board.name}</h4>
              <span className="text-sm text-muted-foreground">({tasks.length} tasks)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToBoard(boardId, tasks[0]?.id || '')}
                className="ml-auto"
              >
                View Board
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['todo', 'in-progress', 'done'].map((status) => {
                const statusTasks = tasks.filter(t => t.status === status);
                return (
                  <div key={status} className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground capitalize">
                      {status.replace('-', ' ')} ({statusTasks.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {statusTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="text-sm p-2 bg-accent/30 rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => onNavigateToBoard(boardId, task.id)}
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          {task.description && (
                            <div className="text-muted-foreground text-xs truncate mt-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      ))}
                      {statusTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{statusTasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}