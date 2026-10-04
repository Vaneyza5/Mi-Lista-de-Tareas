import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Keyboard,
  Alert,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { useSettings, AccentColor, SortOrder, ACCENT_COLORS, AccentColorConfig, ACCENT_COLOR_MAP } from '../context/SettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationContext } from '../context/NotificationContext';

const SettingsScreen: React.FC = () => {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, isReady, setUserName, setTimeFormat, setThemeMode, setAccentColor, setSortOrder } = useSettings();
  const { emptyTrash } = useTasks();
  const { hasPermission, requestPermissions, setHasPermission, syncPermissions } = useNotificationContext();

  // Estado local para inputs
  const [userNameInput, setUserNameInput] = useState(settings.userName);

  // Sincronizar input con settings al cargar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserNameInput(settings.userName);
  }, [settings.userName]);

  const handleUserNameChange = useCallback((text: string) => {
    setUserNameInput(text);
  }, []);

  const handleUserNameSubmit = useCallback(() => {
    Keyboard.dismiss();
    setUserName(userNameInput.trim() || 'Usuario');
  }, [userNameInput, setUserName]);

  const handleTimeFormatChange = useCallback(() => {
    setTimeFormat(settings.timeFormat === '24h' ? '12h' : '24h');
  }, [settings.timeFormat, setTimeFormat]);

  const handleThemeModeChange = useCallback(() => {
    setThemeMode(settings.themeMode === 'light' ? 'dark' : 'light');
  }, [settings.themeMode, setThemeMode]);

  const handleAccentColorChange = useCallback((color: AccentColor) => {
    setAccentColor(color);
  }, [setAccentColor]);

  const handleSortOrderChange = useCallback((order: SortOrder) => {
    setSortOrder(order);
  }, [setSortOrder]);

  // Sincronizar permisos reales cuando la app vuelve a primer plano
  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') {
        syncPermissions();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [syncPermissions]);

  if (!isReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="settings-outline" size={48} color={colors.textPrimary} />
      </SafeAreaView>
    );
  }

  const activeColor = mode === 'dark' ? ACCENT_COLOR_MAP[settings.accentColor].dark : ACCENT_COLOR_MAP[settings.accentColor].light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 32,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sectionContent: {
      padding: 16,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    settingSubLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: '70%',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switchLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 12,
    },
    colorOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
      borderWidth: 3,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOptionSelected: {
      borderColor: colors.textPrimary,
      transform: [{ scale: 1.1 }],
    },
    colorCheck: {
      color: colors.textOnAccent,
      fontSize: 20,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    sortOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
      marginBottom: 8,
    },
    sortOptionSelected: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: activeColor,
    },
    sortRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textDisabled,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sortRadioSelected: {
      borderColor: activeColor,
      backgroundColor: activeColor,
    },
    sortRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.textOnAccent,
    },
    sortLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    dangerZone: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.error,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.error,
    },
    dangerButtonText: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 8,
    },
    versionInfo: {
      textAlign: 'center',
      color: colors.textDisabled,
      fontSize: 12,
      marginTop: 24,
      paddingBottom: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PERFIL DE USUARIO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="person-outline" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              Perfil
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={userNameInput}
                onChangeText={handleUserNameChange}
                onSubmitEditing={handleUserNameSubmit}
                placeholder="Tu nombre"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                testID="settings-name-input"
              />
            </View>
          </View>
        </View>

        {/* APARIENCIA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="brush-outline" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              Apariencia
            </Text>
          </View>
          <View style={styles.sectionContent}>
            {/* Modo de tema */}
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Modo del tema</Text>
                <Text style={styles.settingSubLabel}>
                  {settings.themeMode === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado'}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>{settings.themeMode === 'dark' ? 'Oscuro' : 'Claro'}</Text>
                <Switch
                  value={settings.themeMode === 'dark'}
                  onValueChange={handleThemeModeChange}
                  thumbColor={activeColor}
                  trackColor={{ false: '#E0E0E0', true: activeColor }}
                  testID="settings-theme-switch"
                />
              </View>
            </View>

            {/* Color de acento */}
            <Text style={{ ...styles.settingLabel, marginTop: 16, marginBottom: 12 }}>Color de tema</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ACCENT_COLORS.map((color: AccentColorConfig) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    settings.accentColor === color.id && styles.colorOptionSelected,
                    { backgroundColor: mode === 'dark' ? color.dark : color.light },
                  ]}
                  onPress={() => handleAccentColorChange(color.id)}
                  testID={`settings-accent-${color.id}`}
                  accessibilityLabel={`Color ${color.label}${settings.accentColor === color.id ? ', seleccionado' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.accentColor === color.id }}
                >
                  {settings.accentColor === color.id && (
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" style={styles.colorCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* PREFERENCIAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              Preferencias
            </Text>
          </View>
          <View style={styles.sectionContent}>
            {/* Formato de hora */}
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Formato de hora</Text>
                <Text style={styles.settingSubLabel}>
                  {settings.timeFormat === '24h' ? 'Formato 24 horas (14:30)' : 'Formato 12 horas (2:30 PM)'}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>{settings.timeFormat === '24h' ? '24h' : '12h'}</Text>
                <Switch
                  value={settings.timeFormat === '12h'}
                  onValueChange={handleTimeFormatChange}
                  thumbColor={activeColor}
                  trackColor={{ false: '#E0E0E0', true: activeColor }}
                  testID="settings-timeformat-switch"
                />
              </View>
            </View>

            {/* Ordenación por defecto */}
            <Text style={{ ...styles.settingLabel, marginTop: 16, marginBottom: 12 }}>Ordenación por defecto (Home)</Text>
            {(['fecha', 'nombre', 'prioridad'] as SortOrder[]).map((order) => {
              const isSelected = settings.sortOrder === order;
              const optionStyle = [
                styles.sortOption,
                isSelected && styles.sortOptionSelected,
              ];
              const radioStyle = [
                styles.sortRadio,
                isSelected && styles.sortRadioSelected,
              ];
              const labelStyle = [
                styles.sortLabel,
                isSelected && { color: activeColor },
              ];
              return (
                <TouchableOpacity
                  key={order}
                  style={optionStyle}
                  onPress={() => handleSortOrderChange(order)}
                  testID={`settings-sort-${order}`}
                  accessibilityLabel={`Ordenar por ${order}${isSelected ? ', seleccionado' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={radioStyle}>
                    {isSelected && <View style={styles.sortRadioInner} />}
                  </View>
                  <Text style={labelStyle}>
                    {order === 'fecha' ? 'Por fecha' : order === 'nombre' ? 'Por nombre (A-Z)' : 'Por prioridad'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* NOTIFICACIONES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              Notificaciones
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Notificaciones de recordatorio</Text>
                <Text style={styles.settingSubLabel}>
                  {hasPermission
                    ? 'Activadas - Recibirás avisos en la bandeja del sistema'
                    : 'Desactivadas - No recibirás avisos'}
                </Text>
              </View>
              <Switch
                value={hasPermission}
                onValueChange={async (enabled) => {
                  if (enabled) {
                    const granted = await requestPermissions();
                    setHasPermission(granted);
                    if (!granted && Platform.OS === 'android') {
                      Alert.alert(
                        'Permisos necesarios',
                        'Para recibir notificaciones, concede el permiso en la configuración de la app.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
                        ]
                      );
                    }
                  } else {
                    setHasPermission(false);
                  }
                }}
                thumbColor={activeColor}
                trackColor={{ false: '#E0E0E0', true: activeColor }}
                testID="settings-notifications-switch"
              />
            </View>
            {!hasPermission && (
              <Text style={{ ...styles.settingSubLabel, marginTop: 8, color: colors.textSecondary }}>
                Las notificaciones funcionan en segundo plano solo en development build (npx expo run:android).
                En Expo Go solo aparecen con la app abierta.
              </Text>
            )}
          </View>
        </View>

        {/* ZONA PELIGROSA */}
        <View style={[styles.section, styles.dangerZone]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="warning-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
              Zona peligrosa
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => Alert.alert(
                'Vaciar papelera',
                'Eliminar permanentemente todas las tareas de la papelera. Esta accion no se puede deshacer.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Vaciar', style: 'destructive', onPress: () => emptyTrash() },
                ]
              )}
              testID="settings-empty-trash"
            >
              <Ionicons name="trash-outline" size={22} color={colors.textOnAccent} />
              <Text style={styles.dangerButtonText}>Vaciar papelera definitivamente</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO DE VERSION */}
        <Text style={styles.versionInfo}>Mi Lista de Tareas v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;