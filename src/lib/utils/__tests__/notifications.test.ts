import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationManager } from '@/lib/utils/notifications';
import type { Task } from '@/lib/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    status: 'todo',
    boardId: 'board-1',
    priority: 'medium',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('NotificationManager', () => {
  let manager: NotificationManager;
  let mockNotification: { permission: string; requestPermission: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Create fresh instance per test
    manager = new (NotificationManager as unknown as { new(): NotificationManager })();

    // Mock the Notification API
    mockNotification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };
    vi.stubGlobal('Notification', mockNotification);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    manager.stopPeriodicCheck();
  });

  describe('requestPermission', () => {
    it('returns true when permission is already granted', async () => {
      mockNotification.permission = 'granted';
      const result = await manager.requestPermission();
      expect(result).toBe(true);
      expect(mockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it('returns false when permission is denied', async () => {
      mockNotification.permission = 'denied';
      const result = await manager.requestPermission();
      expect(result).toBe(false);
    });

    it('requests permission when in default state', async () => {
      mockNotification.permission = 'default';
      mockNotification.requestPermission.mockResolvedValue('granted');
      const result = await manager.requestPermission();
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false when user denies from prompt', async () => {
      mockNotification.permission = 'default';
      mockNotification.requestPermission.mockResolvedValue('denied');
      const result = await manager.requestPermission();
      expect(result).toBe(false);
    });

    it('returns false when Notification API is not available', async () => {
      vi.stubGlobal('Notification', undefined);
      // window.location is present but Notification is not
      const result = await manager.requestPermission();
      expect(result).toBe(false);
      vi.stubGlobal('Notification', mockNotification);
    });
  });

  describe('checkDueTasks', () => {
    it('does not notify for tasks without due dates', () => {
      mockNotification.permission = 'granted';
      const showSpy = vi.spyOn(manager as unknown as { showNotification: () => void }, 'showNotification');
      const task = makeTask({ dueDate: undefined });
      manager.checkDueTasks([task]);
      expect(showSpy).not.toHaveBeenCalled();
    });

    it('does not notify for completed tasks', () => {
      mockNotification.permission = 'granted';
      const showSpy = vi.spyOn(manager as unknown as { showNotification: () => void }, 'showNotification');
      const task = makeTask({ status: 'done', dueDate: new Date(Date.now() - 1000) });
      manager.checkDueTasks([task]);
      expect(showSpy).not.toHaveBeenCalled();
    });

    it('does not notify for archived tasks', () => {
      mockNotification.permission = 'granted';
      const showSpy = vi.spyOn(manager as unknown as { showNotification: () => void }, 'showNotification');
      const task = makeTask({ archivedAt: new Date(), dueDate: new Date(Date.now() - 1000) });
      manager.checkDueTasks([task]);
      expect(showSpy).not.toHaveBeenCalled();
    });

    it('does not show duplicate notifications for the same task', () => {
      const notifInstance = { close: vi.fn(), onclick: null, permission: 'granted' };
      class MockNotification {
        static permission = 'granted';
        constructor() { return notifInstance; }
      }
      vi.stubGlobal('Notification', MockNotification);

      const task = makeTask({ dueDate: new Date(Date.now() - 1000) }); // overdue
      const showSpy = vi.spyOn(manager as unknown as { showNotification: () => void }, 'showNotification');
      manager.checkDueTasks([task]);
      manager.checkDueTasks([task]); // second call
      expect(showSpy).toHaveBeenCalledTimes(1); // only notified once
    });
  });

  describe('resetTaskNotifications', () => {
    it('allows re-notification after reset', () => {
      const showSpy = vi.spyOn(manager as unknown as { showNotification: () => void }, 'showNotification');
      const task = makeTask({ dueDate: new Date(Date.now() - 1000) }); // overdue
      manager.checkDueTasks([task]);
      expect(showSpy).toHaveBeenCalledTimes(1);

      manager.resetTaskNotifications(task.id);
      manager.checkDueTasks([task]);
      expect(showSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopPeriodicCheck', () => {
    it('clears the interval when stopped', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      manager.startPeriodicCheck([]);
      manager.stopPeriodicCheck();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('is safe to call when not running', () => {
      expect(() => manager.stopPeriodicCheck()).not.toThrow();
    });
  });
});
