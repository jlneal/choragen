// ADR: ADR-011-web-api-architecture
"use client";

/**
 * Hook for managing task detail panel state
 *
 * Provides state and handlers for opening/closing the task detail panel
 * and tracking which task is currently selected.
 */
import { useState, useCallback } from "react";

export interface TaskDetailState {
  /** Currently selected chain ID */
  chainId: string | null;
  /** Currently selected task ID */
  taskId: string | null;
  /** Whether the panel is open */
  isOpen: boolean;
}

export interface UseTaskDetailReturn extends TaskDetailState {
  /** Open the panel for a specific task */
  openTask: (chainId: string, taskId: string) => void;
  /** Close the panel */
  closePanel: () => void;
  /** Set open state (for controlled Sheet component) */
  setIsOpen: (open: boolean) => void;
}

/**
 * useTaskDetail manages the state for the task detail slide-out panel.
 *
 * @example
 * ```tsx
 * const { chainId, taskId, isOpen, openTask, closePanel, setIsOpen } = useTaskDetail();
 *
 * // Open panel when task is clicked
 * <TaskRow onClick={(task) => openTask(chainId, task.id)} />
 *
 * // Pass to TaskDetailPanel
 * <TaskDetailPanel
 *   chainId={chainId}
 *   taskId={taskId}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function useTaskDetail(): UseTaskDetailReturn {
  const [state, setState] = useState<TaskDetailState>({
    chainId: null,
    taskId: null,
    isOpen: false,
  });

  const openTask = useCallback((chainId: string, taskId: string) => {
    setState({
      chainId,
      taskId,
      isOpen: true,
    });
  }, []);

  const closePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setIsOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      isOpen: open,
      // Clear selection when closing
      ...(open ? {} : { chainId: null, taskId: null }),
    }));
  }, []);

  return {
    ...state,
    openTask,
    closePanel,
    setIsOpen,
  };
}
