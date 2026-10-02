import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Claves de almacenamiento centralizadas.
 */
export const STORAGE_KEYS = {
  THEME: '@MiListaDeTareas:theme',
  TASKS: '@MiListaDeTareas:tasks',
  CATEGORIES: '@MiListaDeTareas:categories',
} as const;

/**
 * Wrapper tipado para AsyncStorage.getItem.
 * @returns Valor parseado como T o null si no existe/error.
 */
export const getStorageItem = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Wrapper tipado para AsyncStorage.setItem.
 * @returns true si tuvo éxito, false si falló.
 */
export const setStorageItem = async <T>(key: string, value: T): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Elimina una clave de AsyncStorage.
 */
export const removeStorageItem = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Limpia todo el storage de la app (útil para logout/reset).
 */
export const clearAppStorage = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtiene múltiples claves de una vez.
 */
export const getMultipleStorageItems = async <T extends Record<string, unknown>>(
  keys: string[],
): Promise<Partial<T>> => {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Partial<T> = {};
    pairs.forEach(([k, v]) => {
      if (v) {
        (result as Record<string, unknown>)[k] = JSON.parse(v);
      }
    });
    return result;
  } catch {
    return {};
  }
};

/**
 * Guarda múltiples claves de una vez.
 */
export const setMultipleStorageItems = async (
  entries: readonly [string, unknown][],
): Promise<boolean> => {
  try {
    const pairs: readonly [string, string][] = entries.map(
      ([k, v]) => [k, JSON.stringify(v)] as const,
    );
    await AsyncStorage.multiSet(pairs);
    return true;
  } catch {
    return false;
  }
};