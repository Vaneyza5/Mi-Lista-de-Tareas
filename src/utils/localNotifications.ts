import { Task } from '../types/task';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

/**
 * Clave de almacenamiento para notificaciones programadas localmente.
 */
const LOCAL_NOTIFICATIONS_KEY = '@MiListaDeTareas:localNotifications';

/**
 * Interfaz para una notificación local programada.
 */
export interface LocalNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  triggerDate: number; // timestamp en ms
  createdAt: number;
}

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) a timestamp.
 * @returns timestamp en ms o null si inválido.
 */
export const parseDateTimeToTimestamp = (fecha: string, hora: string): number | null => {
  try {
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);

    if (
      !year || !month || !day ||
      hours === undefined || minutes === undefined ||
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      hours < 0 || hours > 23 ||
      minutes < 0 || minutes > 59
    ) {
      return null;
    }

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date.getTime();
  } catch {
    return null;
  }
};

/**
 * Genera un ID único para notificación.
 */
const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Obtiene todas las notificaciones programadas del storage.
 */
export const getScheduledLocalNotifications = async (): Promise<LocalNotification[]> => {
  try {
    const stored = await getStorageItem<LocalNotification[]>(LOCAL_NOTIFICATIONS_KEY);
    return stored ?? [];
  } catch {
    return [];
  }
};

/**
 * Guarda la lista de notificaciones en storage.
 */
const saveScheduledNotifications = async (notifications: LocalNotification[]): Promise<void> => {
  await setStorageItem(LOCAL_NOTIFICATIONS_KEY, notifications);
};

/**
 * Programa una notificación local para una tarea.
 * Funciona en foreground (Expo Go compatible) usando timers.
 * @returns ID de la notificación o null si no procede/falló.
 */
export const scheduleLocalNotification = async (task: Task): Promise<string | null> => {
  try {
    // Solo programar si la tarea está pendiente o en curso y no en papelera
    const shouldSchedule = (task.estado === 'Pendiente' || task.estado === 'En curso') && !task.inTrash;
    if (!shouldSchedule) {
      return null;
    }

    const triggerTimestamp = parseDateTimeToTimestamp(task.fecha, task.hora);
    if (!triggerTimestamp) {
      return null;
    }

    const now = Date.now();
    if (triggerTimestamp <= now) {
      // La fecha/hora ya pasó
      return null;
    }

    const notificationId = generateNotificationId();
    const notification: LocalNotification = {
      id: notificationId,
      taskId: task.id,
      taskTitle: task.titulo,
      triggerDate: triggerTimestamp,
      createdAt: now,
    };

    const existing = await getScheduledLocalNotifications();
    existing.push(notification);
    await saveScheduledNotifications(existing);

    return notificationId;
  } catch {
    return null;
  }
};

/**
 * Cancela una notificación local por su ID.
 */
export const cancelLocalNotification = async (notificationId: string | null): Promise<boolean> => {
  if (!notificationId) return true;

  try {
    const existing = await getScheduledLocalNotifications();
    const filtered = existing.filter((n) => n.id !== notificationId);
    await saveScheduledNotifications(filtered);
    return true;
  } catch {
    return false;
  }
};

/**
 * Cancela todas las notificaciones de una tarea específica.
 */
export const cancelLocalNotificationsForTask = async (taskId: string): Promise<void> => {
  try {
    const existing = await getScheduledLocalNotifications();
    const filtered = existing.filter((n) => n.taskId !== taskId);
    await saveScheduledNotifications(filtered);
  } catch {
    // Silencioso
  }
};

/**
 * Cancela TODAS las notificaciones programadas.
 */
export const cancelAllLocalNotifications = async (): Promise<void> => {
  await removeStorageItem(LOCAL_NOTIFICATIONS_KEY);
};

/**
 * Obtiene notificaciones que deben dispararse ahora (para el checker).
 */
export const getDueLocalNotifications = async (): Promise<LocalNotification[]> => {
  const all = await getScheduledLocalNotifications();
  const now = Date.now();
  return all.filter((n) => n.triggerDate <= now);
};

/**
 * Elimina notificaciones ya disparadas del storage.
 */
export const removeFiredLocalNotifications = async (firedIds: string[]): Promise<void> => {
  if (firedIds.length === 0) return;
  try {
    const existing = await getScheduledLocalNotifications();
    const filtered = existing.filter((n) => !firedIds.includes(n.id));
    await saveScheduledNotifications(filtered);
  } catch {
    // Silencioso
  }
};

/**
 * Formatea la fecha/hora para mostrar en UI.
 */
export const formatNotificationDateTime = (fecha: string, hora: string): string => {
  try {
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    // const date = new Date(year, month - 1, day, hours, minutes); // unused

    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return `${dayStr}/${monthStr}/${year} ${timeStr}`;
  } catch {
    return `${fecha} ${hora}`;
  }
};

/**
 * Verifica si una tarea tiene notificación programada (busca en storage).
 */
export const hasLocalNotificationForTask = async (taskId: string): Promise<boolean> => {
  const all = await getScheduledLocalNotifications();
  return all.some((n) => n.taskId === taskId);
};