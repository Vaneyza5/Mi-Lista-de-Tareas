import React, { useEffect, createContext, useContext, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { configureNotifications, requestNotificationPermissions, addNotificationListeners } from '../utils/notifications';

/**
 * Contexto de navegación para notificaciones.
 * Permite navegar a una tarea cuando se toca una notificación.
 */
interface NotificationNavigationContextType {
  navigateToTask: (taskId: string) => void;
}

const NotificationNavigationContext = createContext<NotificationNavigationContextType | null>(null);

/**
 * Provider de navegación para notificaciones.
 * Envuélvelo alrededor de tu AppNavigator y usa useNotificationNavigation()
 * en el componente que maneja las pestañas para configurar la navegación real.
 */
export const NotificationNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigateRef = useRef<(taskId: string) => void>(() => {});

  const value: NotificationNavigationContextType = {
    navigateToTask: (taskId: string) => navigateRef.current(taskId),
  };

  return (
    <NotificationNavigationContext.Provider value={value}>
      {children}
    </NotificationNavigationContext.Provider>
  );
};

/**
 * Hook para obtener la función de navegación a tarea.
 * Debe usarse dentro de NotificationNavigationProvider.
 */
export const useNotificationNavigation = (): NotificationNavigationContextType => {
  const context = useContext(NotificationNavigationContext);
  if (!context) {
    throw new Error('useNotificationNavigation debe usarse dentro de NotificationNavigationProvider');
  }
  return context;
};

/**
 * Hook para registrar la función de navegación real.
 * Úsalo en tu AppNavigator o componente principal de pestañas.
 */
export const useRegisterNotificationNavigation = (navigate: (taskId: string) => void): void => {
  const navigateRef = useRef<(taskId: string) => void>(() => {});
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
};

/**
 * Provider de notificaciones nativas (expo-notifications).
 * - Configura handlers y canal de Android
 * - Solicita permisos al usuario
 * - Maneja notificaciones recibidas en foreground
 * - Navega a la tarea al tocar la notificación (via contexto)
 * 
 * FUNCIONA EN SEGUNDO PLANO en development build / standalone app.
 * En Expo Go: solo funciona en foreground.
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { navigateToTask } = useNotificationNavigation();

  useEffect(() => {
    // 1. Configurar comportamiento global
    configureNotifications();

    // 2. Solicitar permisos al montar
    requestNotificationPermissions();

    // 3. Configurar listeners para navegación
    const cleanup = addNotificationListeners(
      // Notificación recibida en foreground
      (notification) => {
        console.log('Notificación recibida (foreground):', notification);
      },
      // Usuario tocó la notificación (background o foreground)
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        const taskId = data?.taskId as string | undefined;
        if (taskId) {
          navigateToTask(taskId);
        }
      }
    );

    // 4. Badge count en iOS (opcional)
    if (Platform.OS === 'ios') {
      Notifications.setBadgeCountAsync(0).catch(() => {});
    }

    return cleanup;
  }, [navigateToTask]);

  return <>{children}</>;
};