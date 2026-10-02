import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { useTheme } from './ThemeContext';

/** Formatos de hora disponibles. */
export type TimeFormat = '12h' | '24h';

/** Modos de tema disponibles. */
export type ThemeMode = 'light' | 'dark';

/** Colores de acento disponibles. */
export type AccentColor = 'turquesa' | 'azul' | 'purpura' | 'verde' | 'rojo' | 'negro';

/** Criterios de ordenación disponibles. */
export type SortOrder = 'fecha' | 'nombre' | 'prioridad';

/** Configuración de un color de acento. */
export interface AccentColorConfig {
  id: AccentColor;
  label: string;
  light: string;
  dark: string;
}

/** Paletas de colores de acento disponibles. */
export const ACCENT_COLORS: readonly AccentColorConfig[] = [
  { id: 'turquesa', label: 'Turquesa', light: '#00897B', dark: '#00BFA6' },
  { id: 'azul', label: 'Azul', light: '#1976D2', dark: '#64B5F6' },
  { id: 'purpura', label: 'Púrpura', light: '#7B1FA2', dark: '#BA68C8' },
  { id: 'verde', label: 'Verde', light: '#388E3C', dark: '#81C784' },
  { id: 'rojo', label: 'Rojo', light: '#E53935', dark: '#EF5350' },
  { id: 'negro', label: 'Negro', light: '#212121', dark: '#424242' },
] as const;

/** Mapeo rápido de ID a configuración. */
export const ACCENT_COLOR_MAP: Record<AccentColor, AccentColorConfig> = {
  turquesa: ACCENT_COLORS[0],
  azul: ACCENT_COLORS[1],
  purpura: ACCENT_COLORS[2],
  verde: ACCENT_COLORS[3],
  rojo: ACCENT_COLORS[4],
  negro: ACCENT_COLORS[5],
};

/** Forma del estado de configuración. */
export interface SettingsState {
  userName: string;
  timeFormat: TimeFormat;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  sortOrder: SortOrder;
}

/** Valores por defecto de la configuración. */
export const DEFAULT_SETTINGS: SettingsState = {
  userName: 'Usuario',
  timeFormat: '24h',
  themeMode: 'light',
  accentColor: 'turquesa',
  sortOrder: 'fecha',
};

/** Clave de almacenamiento para settings. */
const SETTINGS_STORAGE_KEY = '@MiListaDeTareas:settings';

/** Forma del contexto de configuración. */
export interface SettingsContextType {
  /** Estado actual de configuración. */
  settings: SettingsState;
  /** Indica si la carga inicial ya terminó. */
  isReady: boolean;
  /** Actualiza el nombre de usuario. */
  setUserName: (name: string) => Promise<void>;
  /** Actualiza el formato de hora. */
  setTimeFormat: (format: TimeFormat) => Promise<void>;
  /** Actualiza el modo de tema. */
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  /** Actualiza el color de acento. */
  setAccentColor: (color: AccentColor) => Promise<void>;
  /** Actualiza el criterio de ordenación. */
  setSortOrder: (order: SortOrder) => Promise<void>;
  /** Resetea la configuración a valores por defecto. */
  resetSettings: () => Promise<void>;
}

/** Contexto interno (undefined antes del Provider). */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/** Props del SettingsProvider. */
export interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Proveedor global de configuración con persistencia en AsyncStorage.
 * - Carga configuración al montar.
 * - Persiste cambios tras cada mutación.
 * - Expone API para modificar cada preferencia.
 * - Sincroniza themeMode con ThemeContext (única fuente de verdad).
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const { setTheme: setThemeContext } = useTheme();

  /** Carga configuración persistida al iniciar y sincroniza themeMode con ThemeContext. */
  useEffect(() => {
    let mounted = true;
    getStorageItem<SettingsState>(SETTINGS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          // Validar que todos los campos existan (migración futura)
          const merged: SettingsState = {
            userName: stored.userName ?? DEFAULT_SETTINGS.userName,
            timeFormat: stored.timeFormat ?? DEFAULT_SETTINGS.timeFormat,
            themeMode: stored.themeMode ?? DEFAULT_SETTINGS.themeMode,
            accentColor: stored.accentColor ?? DEFAULT_SETTINGS.accentColor,
            sortOrder: stored.sortOrder ?? DEFAULT_SETTINGS.sortOrder,
          };
          setSettings(merged);
          // Sincronizar ThemeContext con el themeMode guardado en settings
          setThemeContext(merged.themeMode);
        }
      })
      .catch(() => {
        // Silencioso: usa defaults si falla
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [setThemeContext]);

  /** Persiste configuración en AsyncStorage. */
  const persistSettings = useCallback(async (newSettings: SettingsState) => {
    await setStorageItem(SETTINGS_STORAGE_KEY, newSettings);
  }, []);

  /** Actualiza nombre de usuario. */
  const setUserName = useCallback(async (name: string) => {
    const trimmed = name.trim() || DEFAULT_SETTINGS.userName;
    setSettings((prev) => {
      const next = { ...prev, userName: trimmed };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  /** Actualiza formato de hora. */
  const setTimeFormat = useCallback(async (format: TimeFormat) => {
    setSettings((prev) => {
      const next = { ...prev, timeFormat: format };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  /** Actualiza modo de tema (sincroniza con ThemeContext). */
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, themeMode: mode };
      persistSettings(next);
      return next;
    });
    // Sincronizar con ThemeContext (única fuente de verdad para colores)
    await setThemeContext(mode);
  }, [persistSettings, setThemeContext]);

  /** Actualiza color de acento. */
  const setAccentColor = useCallback(async (color: AccentColor) => {
    setSettings((prev) => {
      const next = { ...prev, accentColor: color };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  /** Actualiza criterio de ordenación. */
  const setSortOrder = useCallback(async (order: SortOrder) => {
    setSettings((prev) => {
      const next = { ...prev, sortOrder: order };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  /** Resetea a valores por defecto. */
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const value: SettingsContextType = {
    settings,
    isReady,
    setUserName,
    setTimeFormat,
    setThemeMode,
    setAccentColor,
    setSortOrder,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

/**
 * Hook para consumir el SettingsContext de forma tipada.
 * Lanza error si se usa fuera del SettingsProvider.
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettings debe usarse dentro de un SettingsProvider. Verifica que App.tsx envuelva la app con SettingsProvider.',
    );
  }
  return context;
};

/**
 * Hook para obtener el color de acento actual como objeto con light/dark.
 */
export const useAccentColor = () => {
  const { settings } = useSettings();
  return ACCENT_COLOR_MAP[settings.accentColor];
};