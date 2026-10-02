import React, { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { 
  startNotificationChecker, 
  stopNotificationChecker,
  isNativeNotificationsAvailable,
} from '../utils/notifications';

/**
 * Provider híbrido de notificaciones.
 * - Inicializa notificaciones nativas si están disponibles (development build)
 * - Inicia checker de notificaciones locales (funciona en Expo Go y development build)
 * - Maneja notificaciones recibidas en foreground
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nativeReady, setNativeReady] = React.useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Verificar si notificaciones nativas están disponibles
        const nativeAvailable = await isNativeNotificationsAvailable();
        
        if (nativeAvailable) {
          // Configurar listeners nativos
          const Notifications = (await import('expo-notifications')).default;
          
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
          const { Platform } = await import('react-native');
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

          // Listeners
          const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
            console.log('Notificación nativa recibida (foreground):', notification);
          });

          const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('Respuesta a notificación nativa:', response);
            const taskId = response.notification.request.content.data?.taskId;
            if (taskId) {
              // TODO: Navegar a la tarea
            }
          });

          if (mounted) setNativeReady(true);

          return () => {
            receivedSub.remove();
            responseSub.remove();
          };
        }
      } catch (error) {
        console.warn('Native notifications init failed, using local only:', error);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Checker de notificaciones locales (para foreground en Expo Go / desarrollo)
  const handleLocalNotificationRef = useRef((notif: any) => {
    Alert.alert(
      '⏰ Recordatorio',
      notif.taskTitle,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  });

  useEffect(() => {
    const callback = handleLocalNotificationRef.current;
    startNotificationChecker(callback);

    return () => {
      stopNotificationChecker(callback);
    };
  }, []);

  // Verificar permisos al volver a foreground (para nativas)
  useEffect(() => {
    const handleAppStateChange = async (state: string) => {
      if (state === 'active' && nativeReady) {
        try {
          const Notifications = (await import('expo-notifications')).default;
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') {
            console.warn('Notification permissions revoked');
          }
        } catch { /* silencioso */ }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [nativeReady]);

  return <>{children}</>;
};