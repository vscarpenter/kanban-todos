import { Task } from '@/lib/types';

export class NotificationManager {
  private static instance: NotificationManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private notifiedTasks = new Set<string>();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private showNotification(task: Task, type: 'due' | 'overdue') {
    if (Notification.permission !== 'granted') return;

    const title = type === 'due' ? '🔔 Task Due Soon' : '⚠️ Task Overdue';
    const body = `${task.title}${task.dueDate ? ` - Due: ${new Date(task.dueDate).toLocaleString()}` : ''}`;

    const notification = new Notification(title, {
      body,
      icon: '/images/cascade-icon.svg',
      badge: '/images/cascade-icon.svg',
      tag: `task-${task.id}`, // Prevent duplicate notifications
      requireInteraction: type === 'overdue',
    });

    // Auto-close after 5 seconds for due notifications
    if (type === 'due') {
      setTimeout(() => notification.close(), 5000);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  checkDueTasks(tasks: Task[]) {
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'done' || task.archivedAt) return;

      const dueDate = new Date(task.dueDate);
      const timeUntilDue = dueDate.getTime() - now.getTime();

      // Task is overdue
      if (timeUntilDue < 0 && !this.notifiedTasks.has(`${task.id}-overdue`)) {
        this.showNotification(task, 'overdue');
        this.notifiedTasks.add(`${task.id}-overdue`);
      }
      // Task is due within 1 hour
      else if (timeUntilDue > 0 && timeUntilDue <= oneHour && !this.notifiedTasks.has(`${task.id}-due`)) {
        this.showNotification(task, 'due');
        this.notifiedTasks.add(`${task.id}-due`);
      }
    });

    // Clean up old notifications for completed/deleted tasks
    const activeTaskIds = new Set(tasks.map(t => t.id));
    this.notifiedTasks.forEach(notificationKey => {
      const taskId = notificationKey.split('-')[0];
      if (!activeTaskIds.has(taskId)) {
        this.notifiedTasks.delete(notificationKey);
      }
    });
  }

  startPeriodicCheck(tasks: Task[]) {
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkDueTasks(tasks);
    }, 5 * 60 * 1000);

    // Initial check
    this.checkDueTasks(tasks);
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Reset notifications when task is updated
  resetTaskNotifications(taskId: string) {
    this.notifiedTasks.delete(`${taskId}-due`);
    this.notifiedTasks.delete(`${taskId}-overdue`);
  }
}

export const notificationManager = NotificationManager.getInstance();