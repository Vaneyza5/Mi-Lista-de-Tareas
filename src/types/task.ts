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
 * @property dueDate - Fecha de entrega en formato ISO (YYYY-MM-DD) - OBLIGATORIA, INMUTABLE.
 * @property dueTime - Hora de entrega en formato 24h (HH:mm) - OBLIGATORIA, INMUTABLE.
 * @property reminderDate - Fecha de recordatorio en formato ISO (YYYY-MM-DD) - OPCIONAL, EDITABLE.
 * @property reminderTime - Hora de recordatorio en formato 24h (HH:mm) - OPCIONAL, EDITABLE.
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
  dueDate: string; // ISO date string: YYYY-MM-DD (fecha de entrega - inmutable)
  dueTime: string; // 24h format: HH:mm (hora de entrega - inmutable)
  reminderDate?: string; // ISO date string: YYYY-MM-DD (fecha de recordatorio - opcional, editable)
  reminderTime?: string; // 24h format: HH:mm (hora de recordatorio - opcional, editable)
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
 * Formatea la fecha y hora de entrega para mostrar en UI.
 * Ejemplo: "Entrega: 18 Oct, 18:00"
 */
export const formatDueDateTime = (dueDate: string, dueTime: string): string => {
  try {
    const [, month, day] = dueDate.split('-').map(Number);
    const dayStr = day.toString().padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[month - 1];
    return `Entrega: ${dayStr} ${monthName}, ${dueTime}`;
  } catch {
    return `Entrega: ${dueDate} ${dueTime}`;
  }
};

/**
 * Formatea la fecha y hora de recordatorio para mostrar en UI.
 * Ejemplo: "Recordatorio: 18 Oct, 17:30"
 */
export const formatReminderDateTime = (reminderDate: string | undefined, reminderTime: string | undefined): string | null => {
  if (!reminderDate || !reminderTime) return null;
  try {
    const [month, day] = reminderDate.split('-').slice(1).map(Number);
    const dayStr = day.toString().padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[month - 1];
    return `Recordatorio: ${dayStr} ${monthName}, ${reminderTime}`;
  } catch {
    return `Recordatorio: ${reminderDate} ${reminderTime}`;
  }
};

/**
 * Crea una tarea con valores por defecto seguros.
 * Útil para formularios de creación.
 */
export const createEmptyTask = (overrides: Partial<Task> = {}): Task => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayISO = today.toISOString().split('T')[0];
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  const defaultTime = '09:00';
  const reminderTime = '08:00';

  return {
    id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    dueDate: tomorrowISO, // Entrega por defecto: mañana
    dueTime: defaultTime,
    reminderDate: todayISO, // Recordatorio por defecto: hoy
    reminderTime,
    categoria: { id: 'cat_personal', nombre: 'Personal' },
    inTrash: false,
    createdAt: Date.now(),
    notificationId: undefined,
    ...overrides,
  };
};

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) a Date object.
 * @returns Date object o null si los valores son inválidos.
 */
export const parseDateTime = (fecha: string, hora: string): Date | null => {
  try {
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);

    if (
      !year || !month || !day ||
      hours === undefined || minutes === undefined ||
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      hours < 0 || hours > 23 ||
      minutes < 0 || minutes > 59
    ) {
      return null;
    }

    // Mes en JS es 0-indexed
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Verificar que la fecha es válida (no 31 de febrero, etc.)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

/**
 * Verifica si una tarea tiene recordatorio configurado.
 */
export const hasReminder = (task: Task): boolean => {
  return !!task.reminderDate && !!task.reminderTime;
};

/**
 * Obtiene la fecha/hora del recordatorio como Date, o null si no hay.
 */
export const getReminderDateTime = (task: Task): Date | null => {
  if (!task.reminderDate || !task.reminderTime) return null;
  return parseDateTime(task.reminderDate, task.reminderTime);
};

/**
 * Obtiene la fecha/hora de entrega como Date.
 */
export const getDueDateTime = (task: Task): Date | null => {
  return parseDateTime(task.dueDate, task.dueTime);
};