"use client";

import { createContext, useContext } from "react";

/**
 * Cross-board navigation: jump to a task on another board (used by task cards
 * shown in cross-board search results).
 *
 * This lives in context rather than being prop-drilled BoardView → KanbanBoard
 * → KanbanColumn → TaskCard. Only BoardView knows how to navigate; the columns
 * in between were pure forwarders. The default is a no-op so a TaskCard rendered
 * outside a provider (e.g. the drag overlay) simply doesn't navigate.
 */
type NavigateToBoard = (boardId: string, taskId: string) => void;

const BoardNavigationContext = createContext<NavigateToBoard>(() => {});

interface BoardNavigationProviderProps {
  value: NavigateToBoard;
  children: React.ReactNode;
}

export function BoardNavigationProvider({ value, children }: BoardNavigationProviderProps) {
  return (
    <BoardNavigationContext.Provider value={value}>
      {children}
    </BoardNavigationContext.Provider>
  );
}

export function useBoardNavigation(): NavigateToBoard {
  return useContext(BoardNavigationContext);
}
