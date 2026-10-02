import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';

/** Forma del contexto de notificaciones. */
export interface NotificationContextType {
  /** Indica si los permisos fueron concedidos. */
  hasPermission: boolean;
  /** Solicita permisos al usuario. */
  requestPermissions: () => Promise<boolean>;
  /** Establece el estado de permisos (para sincronizar con settings). */
  setHasPermission: (value: boolean) => void;
}

/** Contexto interno. */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider simple para estado de permisos de notificación.
 * La lógica real de notificaciones está en NotificationProvider.tsx
 */
export const NotificationContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        return true;
      }

      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
        android: { channelId: 'task-reminders' },
      });

      const granted = newStatus === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const value: NotificationContextType = {
    hasPermission,
    requestPermissions,
    setHasPermission,
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
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext debe usarse dentro de un NotificationContextProvider.'
    );
  }
  return context;
};