import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task, getReminderDateTime } from '../types/task';

/**
 * Configura el comportamiento de las notificaciones en primer plano.
 * Llamar una vez al iniciar la app (ej. en App.tsx o _layout.tsx).
 */
export const configureNotifications = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
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
 * Programa una notificación nativa para una tarea usando la fecha de RECORDATORIO.
 * FUNCIONA EN SEGUNDO PLANO (incluso con la app cerrada) en development build / standalone.
 * @param task - Tarea con reminderDate, reminderTime y título.
 * @returns ID de la notificación programada (string) o null si falló/no procede.
 */
export const scheduleTaskNotification = async (task: Task): Promise<string | null> => {
  try {
    // Solo programar si la tarea está pendiente o en curso y no en papelera
    const shouldSchedule = task.estado === 'Pendiente' || task.estado === 'En curso';
    if (!shouldSchedule || task.inTrash) {
      return null;
    }

    // Usar fecha/hora de RECORDATORIO (no de entrega)
    const triggerDate = getReminderDateTime(task);
    if (!triggerDate) {
      return null; // No hay recordatorio configurado
    }

    const now = new Date();
    if (triggerDate <= now) {
      // La fecha/hora ya pasó, no programar
      return null;
    }

    // Verificar permisos YA concedidos (NO pedirlos aquí - eso bloquea la UI)
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permisos de notificación no concedidos');
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
  } catch (error) {
    console.error('Error programando notificación:', error);
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

/**
 * Agrega listeners para notificaciones recibidas y respuestas del usuario.
 * Útil para navegar a la tarea al tocar la notificación.
 */
export const addNotificationListeners = (
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
): (() => void) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

/**
 * Obtiene el token de push de Expo (para notificaciones remotas desde servidor).
 * Requiere development build y configuración en app.json con googleServicesFile.
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '98e27cdf-8ca3-4fac-b947-5a3296d7f837', // Tu projectId de EAS
    });
    return token.data;
  } catch {
    return null;
  }
};