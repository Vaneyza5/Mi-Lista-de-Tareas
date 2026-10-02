import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  useState,
} from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { getDueLocalNotifications, removeFiredLocalNotifications, LocalNotification } from '../utils/localNotifications';

/** Forma del contexto de notificaciones locales. */
export interface NotificationContextType {
  /** Indica si el checker está activo. */
  isRunning: boolean;
  /** Inicia el checker de notificaciones (llamar al montar la app). */
  startChecker: () => void;
  /** Detiene el checker. */
  stopChecker: () => void;
  /** Notificación actualmente mostrada (para UI). */
  currentNotification: LocalNotification | null;
  /** Cierra la notificación actual. */
  dismissNotification: () => void;
}

/** Contexto interno. */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/** Intervalo de verificación en ms (1 minuto). */
const CHECK_INTERVAL = 60 * 1000;

/**
 * Provider de notificaciones locales (foreground).
 * - Verifica cada minuto si hay notificaciones pendientes.
 * - Muestra Alert nativo cuando le toca.
 * - Funciona en Expo Go sin módulos nativos.
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<LocalNotification | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /** Verifica y dispara notificaciones vencidas. */
  const checkNotifications = useCallback(async () => {
    try {
      const due = await getDueLocalNotifications();
      if (due.length > 0) {
        // Tomar la más antigua
        const notification = due[0];
        setCurrentNotification(notification);
        
        // Eliminar del storage para que no se repita
        await removeFiredLocalNotifications([notification.id]);
      }
    } catch (error) {
      console.error('Error checking local notifications:', error);
    }
  }, []);

  /** Inicia el loop de verificación. */
  const startChecker = useCallback(() => {
    if (intervalRef.current) return; // Ya corriendo
    
    setIsRunning(true);
    // Verificación inmediata
    checkNotifications();
    
    // Loop cada minuto
    intervalRef.current = setInterval(checkNotifications, CHECK_INTERVAL);
    
    // Listener de AppState para verificar al volver a foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkNotifications();
      }
      appStateRef.current = nextState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Guardar subscription en ref para cleanup
    (intervalRef.current as any)._appStateSubscription = subscription;
  }, [checkNotifications]);

  /** Detiene el loop. */
  const stopChecker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      // Remover listener de AppState
      const subscription = (intervalRef.current as any)._appStateSubscription;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  /** Cierra la notificación mostrada. */
  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopChecker();
    };
  }, [stopChecker]);

  // Renderizar Alert cuando hay notificación pendiente
  useEffect(() => {
    if (currentNotification) {
      Alert.alert(
        '⏰ Recordatorio',
        currentNotification.taskTitle,
        [
          {
            text: 'OK',
            onPress: dismissNotification,
          },
        ],
        { cancelable: false },
      );
    }
  }, [currentNotification, dismissNotification]);

  const value: NotificationContextType = {
    isRunning,
    startChecker,
    stopChecker,
    currentNotification,
    dismissNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para usar el contexto de notificaciones.
 */
export const useLocalNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useLocalNotifications debe usarse dentro de un NotificationProvider. Verifica que App.tsx envuelva la app con NotificationProvider.',
    );
  }
  return context;
};