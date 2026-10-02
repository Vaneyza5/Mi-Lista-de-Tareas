import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings, ACCENT_COLOR_MAP } from '../context/SettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Rutas disponibles en la navegación inferior. */
export type TabRoute = 'home' | 'trash' | 'settings';

/** Props del BottomTabBar. */
export interface BottomTabBarProps {
  /** Ruta actualmente activa. */
  activeRoute: TabRoute;
  /** Callback al cambiar de ruta. */
  onRouteChange: (route: TabRoute) => void;
  /** testID para testing. */
  testID?: string;
}

/**
 * Barra de navegación inferior con 3 pestañas: Home, Papelera, Configuración.
 * - Animación suave del indicador activo.
 * - Se adapta al tema claro/oscuro y color de acento dinámico desde Settings.
 * - Accesible (screen readers).
 * - Respeta SafeAreaInsets para no solaparse con la barra del sistema.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeRoute,
  onRouteChange,
  testID = 'bottom-tab-bar',
}) => {
  const { mode, colors } = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Color de acento dinámico desde SettingsContext
  const accentColor = mode === 'dark'
    ? ACCENT_COLOR_MAP[settings.accentColor]?.dark
    : ACCENT_COLOR_MAP[settings.accentColor]?.light;

  // Animación del indicador deslizante
  const indicatorPosition = React.useMemo(() => new Animated.Value(0), []);

  // Preparar interpolación para el indicador
  const indicatorTranslateX = indicatorPosition.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '100%', '200%'],
  });

  React.useEffect(() => {
    const routeIndex = { home: 0, trash: 1, settings: 2 }[activeRoute];
    Animated.timing(indicatorPosition, {
      toValue: routeIndex,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeRoute, indicatorPosition]);

  const tabs: readonly { route: TabRoute; label: string; icon: string; activeIcon: string }[] = [
    { route: 'home', label: 'Inicio', icon: 'home' as any, activeIcon: 'home' as any },
    { route: 'trash', label: 'Papelera', icon: 'trash' as any, activeIcon: 'trash' as any },
    { route: 'settings', label: 'Ajustes', icon: 'settings' as any, activeIcon: 'settings' as any },
  ];

  const activeColor = accentColor;
  const inactiveColor = mode === 'dark' ? '#757575' : '#9E9E9E';

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 84 + insets.bottom,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: mode === 'dark' ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 8,
      flexDirection: 'row',
      paddingBottom: insets.bottom,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      paddingBottom: 12,
    },
    iconWrapper: {
      position: 'relative',
      marginBottom: 4,
    },
    indicator: {
      position: 'absolute',
      top: 4,
      height: 4,
      width: '33.33%',
      borderRadius: 2,
      backgroundColor: activeColor,
    },
    icon: {
      fontSize: 26,
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container} testID={testID} accessible={false}>
      {/* Indicador animado deslizante */}
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [
              {
                translateX: indicatorTranslateX,
              },
            ],
          },
        ]}
      />

      {tabs.map((tab, index) => (
        <Pressable
          key={tab.route}
          style={styles.tab}
          onPress={() => onRouteChange(tab.route)}
          accessibilityLabel={tab.label}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeRoute === tab.route }}
          testID={`${testID}-${tab.route}`}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={(activeRoute === tab.route ? tab.activeIcon : tab.icon) as any}
              size={26}
              color={activeRoute === tab.route ? activeColor : inactiveColor}
              style={styles.icon}
            />
          </View>
          <Text
            style={[
              styles.label,
              {
                color: activeRoute === tab.route ? activeColor : inactiveColor,
                fontWeight: activeRoute === tab.route ? '600' : '500',
              },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};