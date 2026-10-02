/**
 * Barrel exports para imports limpios desde 'src/'
 * Ejemplo: import { useTasks, useTheme } from 'src';
 */

// Types
export * from './types/task';

// Contexts
export { ThemeProvider, useTheme } from './context/ThemeContext';
export { TaskProvider, useTasks } from './context/TaskContext';
export type { ThemeContextType, ThemeMode, ThemeProviderProps } from './context/ThemeContext';
export type { TaskContextType, TaskProviderProps } from './context/TaskContext';