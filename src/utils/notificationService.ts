import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types/task';

/**
 * Configura el comportamiento de las notificaciones en primer plano.
 * Llamar una vez al iniciar la app (ej. en App.tsx o _layout.tsx).
 */
export const configureNotifications = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Android: crear canal de notificaciones (requerido en Android 8+)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Recordatorios de Tareas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#BB86FC',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    }).catch(() => {
      // Silencioso: si falla el canal, la notificación igual puede mostrarse
    });
  }
};

/**
 * Solicita permisos de notificación al usuario.
 * @returns true si se concedió el permiso, false si se denegó o hubo error.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      android: {
        channelId: 'task-reminders',
      },
    });

    return status === 'granted';
  } catch {
    // Error al solicitar permisos (ej. sin acceso a API nativa)
    return false;
  }
};

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) a Date object.
 * @returns Date object o null si los valores son inválidos.
 */
const parseDateTime = (fecha: string, hora: string): Date | null => {
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

    // Mes en JS es 0-indexed
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Verificar que la fecha es válida (no 31 de febrero, etc.)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

/**
 * Programa una notificación local para una tarea.
 * @param task - Tarea con fecha, hora y título.
 * @returns ID de la notificación programada (string) o null si falló/no procede.
 */
export const scheduleTaskNotification = async (task: Task): Promise<string | null> => {
  try {
    // Solo programar si la tarea está pendiente o en curso y no en papelera
    // No programar para Listo o Cancelado
    const shouldSchedule = task.estado === 'Pendiente' || task.estado === 'En curso';
    if (!shouldSchedule || task.inTrash) {
      return null;
    }

    const triggerDate = parseDateTime(task.fecha, task.hora);
    if (!triggerDate) {
      return null;
    }

    const now = new Date();
    if (triggerDate <= now) {
      // La fecha/hora ya pasó, no programar
      return null;
    }

    // Verificar permisos antes de programar
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Recordatorio de tarea',
        body: task.titulo,
        data: { taskId: task.id },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'task-reminders',
      },
    });

    return notificationId;
  } catch {
    // Error al programar (ej. límites de notificaciones, permisos revocados)
    return null;
  }
};

/**
 * Cancela una notificación programada por su ID.
 * @param notificationId - ID devuelto por scheduleTaskNotification.
 * @returns true si se canceló correctamente, false si falló.
 */
export const cancelTaskNotification = async (notificationId: string | null): Promise<boolean> => {
  if (!notificationId) return true; // Nada que cancelar

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch {
    // Error al cancelar (ej. notificación ya no existe)
    return false;
  }
};

/**
 * Cancela TODAS las notificaciones programadas.
 * Útil para limpieza o logout.
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silencioso
  }
};

/**
 * Obtiene todas las notificaciones programadas (para debug).
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
};