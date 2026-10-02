/**
 * Tipos centrales de la aplicación de tareas.
 * Define las interfaces para tareas, categorías, prioridades y estados.
 */

/** Niveles de prioridad disponibles para una tarea. */
export type Priority = 'Alta' | 'Media' | 'Baja';

/** Estados posibles de una tarea. */
export type TaskStatus = 'Pendiente' | 'En curso' | 'Listo' | 'Cancelado';

/**
 * Representa una categoría de tareas.
 * @property id - Identificador único de la categoría.
 * @property nombre - Nombre visible de la categoría.
 * @property esPredeterminada - Indica si es una categoría del sistema (no editable por el usuario).
 */
export interface Category {
  id: string;
  nombre: string;
  esPredeterminada: boolean;
}

/**
 * Representa una tarea individual.
 * @property id - Identificador único (UUID recomendado).
 * @property titulo - Título breve de la tarea.
 * @property descripcion - Detalle opcional de la tarea.
 * @property prioridad - Nivel de prioridad: 'Alta' | 'Media' | 'Baja'.
 * @property estado - Estado actual: 'Pendiente' | 'En curso' | 'Listo' | 'Cancelado'.
 * @property fecha - Fecha programada en formato ISO (YYYY-MM-DD).
 * @property hora - Hora programada en formato 24h (HH:mm).
 * @property categoria - Categoría asociada (referencia por id y nombre).
 * @property inTrash - Indica si la tarea está en la papelera (eliminación suave).
 * @property createdAt - Timestamp de creación en milisegundos (epoch).
 * @property notificationId - ID de la notificación local programada (opcional).
 */
export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  estado: TaskStatus;
  fecha: string; // ISO date string: YYYY-MM-DD
  hora: string; // 24h format: HH:mm
  categoria: {
    id: string;
    nombre: string;
  };
  inTrash: boolean;
  createdAt: number;
  notificationId?: string; // ID de notificación local (expo-notifications)
}

/**
 * Categorías predeterminadas del sistema.
 * Estas categorías no pueden ser eliminadas ni modificadas por el usuario.
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'cat_trabajo', nombre: 'Trabajo', esPredeterminada: true },
  { id: 'cat_personal', nombre: 'Personal', esPredeterminada: true },
  { id: 'cat_casa', nombre: 'Casa', esPredeterminada: true },
  { id: 'cat_universidad', nombre: 'Universidad', esPredeterminada: true },
] as const;

/**
 * IDs de las categorías predeterminadas para validaciones rápidas.
 */
export const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

/**
 * Verifica si una categoría es del sistema (predeterminada).
 */
export const isDefaultCategory = (categoryId: string): boolean =>
  DEFAULT_CATEGORY_IDS.includes(categoryId);

/**
 * Crea una tarea con valores por defecto seguros.
 * Útil para formularios de creación.
 */
export const createEmptyTask = (overrides: Partial<Task> = {}): Task => ({
  id: '',
  titulo: '',
  descripcion: '',
  prioridad: 'Media',
  estado: 'Pendiente',
  fecha: new Date().toISOString().split('T')[0],
  hora: '09:00',
  categoria: { id: 'cat_personal', nombre: 'Personal' },
  inTrash: false,
  createdAt: Date.now(),
  notificationId: undefined,
  ...overrides,
});