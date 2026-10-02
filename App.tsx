import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { NotificationProvider, NotificationNavigationProvider } from './src/context/NotificationProvider';
import { NotificationContextProvider } from './src/context/NotificationContext';
import { AppNavigator } from './src/navigation';

// Oculta todas las alertas y errores emergentes en la interfaz del cliente (Modo Presentación)
LogBox.ignoreAllLogs();

/**
 * Componente raíz de la aplicación.
 * Configura todos los providers de contexto y el navegador principal.
 */
const App: React.FC = () => (
  <SafeAreaProvider>
    <ThemeProvider>
      <SettingsProvider>
        <TaskProvider>
          <NotificationContextProvider>
            <NotificationNavigationProvider>
              <NotificationProvider>
                <AppNavigator />
              </NotificationProvider>
            </NotificationNavigationProvider>
          </NotificationContextProvider>
        </TaskProvider>
      </SettingsProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

export default App;