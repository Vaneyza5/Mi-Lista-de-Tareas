import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { TrashScreen } from '../screens/TrashScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BottomTabBar, TabRoute } from '../components/BottomTabBar';
import { useRegisterNotificationNavigation } from '../context/NotificationProvider';

/**
 * Navegador principal de la aplicación.
 * Maneja el estado de la pestaña activa y renderiza la pantalla correspondiente.
 */
export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const [activeRoute, setActiveRoute] = useState<TabRoute>('home');

  // Registrar navegación para notificaciones
  const handleNavigateToTask = useCallback((taskId: string) => {
    setActiveRoute('home');
    // La HomeScreen debería manejar el taskId via props o contexto
    // Por ahora solo cambiamos a la pestaña home
    console.log('Navegar a tarea:', taskId);
  }, []);

  useRegisterNotificationNavigation(handleNavigateToTask);

  const handleRouteChange = useCallback((route: TabRoute) => {
    setActiveRoute(route);
  }, []);

  const renderScreen = () => {
    switch (activeRoute) {
      case 'trash':
        return <TrashScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'home':
      default:
        return <HomeScreen />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenContainer: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <BottomTabBar activeRoute={activeRoute} onRouteChange={handleRouteChange} />
    </View>
  );
};

export default AppNavigator;