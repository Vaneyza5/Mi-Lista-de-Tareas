import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../utils/storage';

/** Modos de tema disponibles. */
export type ThemeMode = 'light' | 'dark';

/** Paleta de colores por modo de tema. */
export interface ThemeColors {
  // Fondos
  background: string;        // Fondo general de la app
  surface: string;           // Fondo de tarjetas, modales, inputs
  surfaceVariant: string;    // Fondo secundario (hover, disabled)
  
  // Textos
  textPrimary: string;       // Texto principal
  textSecondary: string;     // Texto secundario
  textDisabled: string;      // Texto deshabilitado
  textOnAccent: string;      // Texto sobre color de acento
  
  // Bordes y divisores
  border: string;
  divider: string;
  
  // Estados
  error: string;
  success: string;
  warning: string;
  info: string;
}

/** Colores para modo claro. */
export const LIGHT_COLORS: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnAccent: '#FFFFFF',
  border: '#E8E8E8',
  divider: '#EEEEEE',
  error: '#E53935',
  success: '#00C853',
  warning: '#F57C00',
  info: '#1976D2',
};

/** Colores para modo oscuro. */
export const DARK_COLORS: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textDisabled: '#666666',
  textOnAccent: '#FFFFFF',
  border: '#2C2C2C',
  divider: '#2A2A2A',
  error: '#EF5350',
  success: '#03DAC6',
  warning: '#FFB74D',
  info: '#64B5F6',
};

/** Forma del contexto de tema. */
export interface ThemeContextType {
  /** Modo actual: 'light' | 'dark'. */
  mode: ThemeMode;
  /** Colores actuales según el modo. */
  colors: ThemeColors;
  /** Alterna entre modo claro y oscuro. */
  toggleTheme: () => void;
  /** Establece un modo específico. */
  setTheme: (mode: ThemeMode) => void;
  /** Indica si la carga inicial ya terminó. */
  isReady: boolean;
}

/** Contexto interno (puede ser undefined antes del Provider). */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props del ThemeProvider.
 * @property children - Subárbol de la aplicación.
 * @property defaultMode - Tema por defecto si no hay valor guardado (default: 'light').
 */
export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Proveedor de tema con persistencia en AsyncStorage.
 * - Carga el tema guardado al montar.
 * - Persiste cambios automáticamente.
 * - Expone `toggleTheme`, `setTheme`, `mode` y `colors`.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [isReady, setIsReady] = useState(false);

  /** Colores actuales según el modo. */
  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  /** Carga el tema persistido al iniciar. */
  useEffect(() => {
    let mounted = true;
    getStorageItem<'light' | 'dark'>(STORAGE_KEYS.THEME)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      })
      .catch(() => {
        // Silencioso: usa defaultMode si falla la lectura
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  /** Persiste el tema en AsyncStorage. */
  const persistTheme = useCallback(async (newMode: ThemeMode) => {
    await setStorageItem(STORAGE_KEYS.THEME, newMode);
  }, []);

  /** Alterna entre light y dark. */
  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  /** Establece un modo específico. */
  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      persistTheme(newMode);
    },
    [persistTheme],
  );

  const value: ThemeContextType = {
    mode,
    colors,
    toggleTheme,
    setTheme,
    isReady,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Hook para consumir el ThemeContext de forma tipada.
 * Lanza error si se usa fuera del ThemeProvider.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      'useTheme debe usarse dentro de un ThemeProvider. Verifica que App.tsx envuelva la app con ThemeProvider.',
    );
  }
  return context;
};