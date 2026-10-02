import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { TrashScreen } from '../screens/TrashScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BottomTabBar, TabRoute } from '../components/BottomTabBar';

/**
 * Navegador principal de la aplicación.
 * Maneja el estado de la pestaña activa y renderiza la pantalla correspondiente.
 */
export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const [activeRoute, setActiveRoute] = useState<TabRoute>('home');

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