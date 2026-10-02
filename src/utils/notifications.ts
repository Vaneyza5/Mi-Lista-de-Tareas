import { Platform, AppState } from 'react-native';
import { Task } from '../types/task';
import { getStorageItem, setStorageItem } from './storage';

/**
 * Notificaciones híbridas:
 * - Expo Go / Web: LocalNotifications (AsyncStorage + timers JS)
 * - Development build / Standalone: Expo Notifications (nativas)
 */

// ============================================
// TIPO COMÚN
// ============================================
export interface ScheduledNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  triggerDate: number; // timestamp ms
  createdAt: number;
  isNative?: boolean; // true = expo-notifications, false = local
}

// ============================================
// STORAGE KEYS
// ============================================
const LOCAL_NOTIFICATIONS_KEY = '@MiListaDeTareas:localNotifications';
const NATIVE_NOTIFICATION_IDS_KEY = '@MiListaDeTareas:nativeNotificationIds';

// ============================================
// UTILIDADES COMUNES
// ============================================
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

export const formatNotificationDateTime = (fecha: string, hora: string): string => {
  try {
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);

    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return `${dayStr}/${monthStr}/${year} ${timeStr}`;
  } catch {
    return `${fecha} ${hora}`;
  }
};

const generateId = (): string => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ============================================
// DETECCIÓN DE ENTORNO
// ============================================
let _isNativeAvailable: boolean | null = null;

export const isNativeNotificationsAvailable = async (): Promise<boolean> => {
  if (_isNativeAvailable !== null) return _isNativeAvailable;

  try {
    const Constants = await import('expo-constants');
    const appOwnership = (Constants.default?.appOwnership ?? null) as 'expo' | 'standalone' | 'guest' | null;
    const isExpoGo = appOwnership === 'expo';
    const isDevelopment = __DEV__ && !isExpoGo;
    const isStandalone = appOwnership === 'standalone';
    
    _isNativeAvailable = isDevelopment || isStandalone;
    return _isNativeAvailable;
  } catch {
    _isNativeAvailable = false;
    return false;
  }
};

// Forzar modo (útil para testing)
export const setNativeNotificationsAvailable = (value: boolean) => {
  _isNativeAvailable = value;
};

// ============================================
// NOTIFICACIONES LOCALES (AsyncStorage + timers)
// Funciona en Expo Go, Web, Development build
// ============================================
const getLocalNotifications = async (): Promise<ScheduledNotification[]> => {
  try {
    const stored = await getStorageItem<ScheduledNotification[]>(LOCAL_NOTIFICATIONS_KEY);
    return stored ?? [];
  } catch {
    return [];
  }
};

const saveLocalNotifications = async (notifications: ScheduledNotification[]): Promise<void> => {
  await setStorageItem(LOCAL_NOTIFICATIONS_KEY, notifications);
};

export const scheduleLocalNotification = async (task: Task): Promise<string | null> => {
  try {
    const shouldSchedule = (task.estado === 'Pendiente' || task.estado === 'En curso') && !task.inTrash;
    if (!shouldSchedule) return null;

    const triggerTimestamp = parseDateTimeToTimestamp(task.fecha, task.hora);
    if (!triggerTimestamp) return null;

    if (triggerTimestamp <= Date.now()) return null;

    const notificationId = generateId();
    const notification: ScheduledNotification = {
      id: notificationId,
      taskId: task.id,
      taskTitle: task.titulo,
      triggerDate: triggerTimestamp,
      createdAt: Date.now(),
      isNative: false,
    };

    const existing = await getLocalNotifications();
    existing.push(notification);
    await saveLocalNotifications(existing);

    return notificationId;
  } catch {
    return null;
  }
};

export const cancelLocalNotification = async (notificationId: string | null): Promise<boolean> => {
  if (!notificationId) return true;
  try {
    const existing = await getLocalNotifications();
    const filtered = existing.filter((n) => n.id !== notificationId);
    await saveLocalNotifications(filtered);
    return true;
  } catch {
    return false;
  }
};

export const cancelLocalNotificationsForTask = async (taskId: string): Promise<void> => {
  try {
    const existing = await getLocalNotifications();
    const filtered = existing.filter((n) => n.taskId !== taskId);
    await saveLocalNotifications(filtered);
  } catch { /* silencioso */ }
};

export const getDueLocalNotifications = async (): Promise<ScheduledNotification[]> => {
  const all = await getLocalNotifications();
  const now = Date.now();
  return all.filter((n) => n.triggerDate <= now);
};

export const removeFiredLocalNotifications = async (firedIds: string[]): Promise<void> => {
  if (firedIds.length === 0) return;
  try {
    const existing = await getLocalNotifications();
    const filtered = existing.filter((n) => !firedIds.includes(n.id));
    await saveLocalNotifications(filtered);
  } catch { /* silencioso */ }
};

// ============================================
// NOTIFICACIONES NATIVAS (expo-notifications)
// Solo en Development build / Standalone
// ============================================
let Notifications: any = null;
let _nativeInitialized = false;

const initNativeNotifications = async (): Promise<boolean> => {
  if (_nativeInitialized) return !!Notifications;
  
  try {
    const mod = await import('expo-notifications');
    Notifications = mod.default ?? mod;
    
    // Configurar handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Canal Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Recordatorios de Tareas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#BB86FC',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    }

    _nativeInitialized = true;
    return true;
  } catch (error) {
    console.warn('Native notifications not available:', error);
    Notifications = null;
    return false;
  }
};

const getNativeNotificationIds = async (): Promise<Record<string, string>> => {
  try {
    const stored = await getStorageItem<Record<string, string>>(NATIVE_NOTIFICATION_IDS_KEY);
    return stored ?? {};
  } catch {
    return {};
  }
};

const saveNativeNotificationIds = async (ids: Record<string, string>): Promise<void> => {
  await setStorageItem(NATIVE_NOTIFICATION_IDS_KEY, ids);
};

export const scheduleNativeNotification = async (task: Task): Promise<string | null> => {
  try {
    if (!(await initNativeNotifications())) return null;
    
    const shouldSchedule = (task.estado === 'Pendiente' || task.estado === 'En curso') && !task.inTrash;
    if (!shouldSchedule) return null;

    const triggerDate = parseDateTimeToTimestamp(task.fecha, task.hora);
    if (!triggerDate) return null;

    if (triggerDate <= Date.now()) return null;

    // Verificar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
        android: { channelId: 'task-reminders' },
      });
      if (status !== 'granted') return null;
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
        date: new Date(triggerDate),
        channelId: 'task-reminders',
      },
    });

    // Guardar mapeo taskId -> notificationId para poder cancelar después
    const ids = await getNativeNotificationIds();
    ids[task.id] = notificationId;
    await saveNativeNotificationIds(ids);

    return notificationId;
  } catch (error) {
    console.error('Error scheduling native notification:', error);
    return null;
  }
};

export const cancelNativeNotification = async (notificationId: string | null): Promise<boolean> => {
  if (!notificationId) return true;
  try {
    if (!(await initNativeNotifications())) return false;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch {
    return false;
  }
};

export const cancelNativeNotificationsForTask = async (taskId: string): Promise<void> => {
  try {
    const ids = await getNativeNotificationIds();
    const notificationId = ids[taskId];
    if (notificationId) {
      await cancelNativeNotification(notificationId);
      delete ids[taskId];
      await saveNativeNotificationIds(ids);
    }
  } catch { /* silencioso */ }
};

// ============================================
// API UNIFICADA (usa la mejor disponible)
// ============================================

/**
 * Programa una notificación para una tarea.
 * Usa nativas si están disponibles, sino locales.
 * @returns {Promise<{id: string, isNative: boolean} | null>} 
 */
export const scheduleNotification = async (task: Task): Promise<{id: string; isNative: boolean} | null> => {
  const nativeAvailable = await isNativeNotificationsAvailable();
  
  if (nativeAvailable) {
    const id = await scheduleNativeNotification(task);
    if (id) return { id, isNative: true };
    // Si falla nativa, intentar local como fallback
  }
  
  const id = await scheduleLocalNotification(task);
  if (id) return { id, isNative: false };
  
  return null;
};

/**
 * Cancela notificaciones de una tarea.
 */
export const cancelNotificationsForTask = async (taskId: string): Promise<void> => {
  await Promise.all([
    cancelLocalNotificationsForTask(taskId),
    cancelNativeNotificationsForTask(taskId),
  ]);
};

/**
 * Cancela una notificación específica por ID (intenta ambas).
 */
export const cancelNotification = async (notificationId: string | null): Promise<boolean> => {
  if (!notificationId) return true;
  const [local, native] = await Promise.all([
    cancelLocalNotification(notificationId),
    cancelNativeNotification(notificationId),
  ]);
  return local || native;
};

/**
 * Obtiene notificaciones vencidas (para el checker).
 * Combina locales y nativas (aunque nativas se manejan solas por el SO).
 */
export const getDueNotifications = async (): Promise<ScheduledNotification[]> => {
  // Las nativas las maneja el SO, solo necesitamos checkear las locales
  return getDueLocalNotifications();
};

/**
 * Limpia notificaciones ya disparadas.
 */
export const cleanupFiredNotifications = async (firedIds: string[]): Promise<void> => {
  await removeFiredLocalNotifications(firedIds);
  // Las nativas se limpian solas al dispararse
};

// ============================================
// CHECKER PARA NOTIFICACIONES LOCALES (foreground)
// ============================================
let _checkerInterval: ReturnType<typeof setInterval> | null = null;
let _checkerCallbacks: ((notif: ScheduledNotification) => void)[] = [];

export const startNotificationChecker = (onNotification: (notif: ScheduledNotification) => void): void => {
  if (!_checkerCallbacks.includes(onNotification)) {
    _checkerCallbacks.push(onNotification);
  }
  
  if (_checkerInterval) return; // Ya corriendo
  
  const check = async () => {
    try {
      const due = await getDueLocalNotifications();
      for (const notif of due) {
        _checkerCallbacks.forEach(cb => cb(notif));
        await removeFiredLocalNotifications([notif.id]);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };
  
  // Verificación inmediata
  check();
  
  // Cada minuto
  _checkerInterval = setInterval(check, 60 * 1000);
  
  // Verificar al volver a foreground
  AppState.addEventListener('change', (state) => {
    if (state === 'active') check();
  });
};

export const stopNotificationChecker = (callback?: (notif: ScheduledNotification) => void): void => {
  if (callback) {
    _checkerCallbacks = _checkerCallbacks.filter(cb => cb !== callback);
  }
  
  if (_checkerCallbacks.length === 0 && _checkerInterval) {
    clearInterval(_checkerInterval);
    _checkerInterval = null;
  }
};