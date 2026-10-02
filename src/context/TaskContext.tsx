import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  Task,
  Category,
  DEFAULT_CATEGORIES,
  isDefaultCategory,
} from '../types/task';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../utils/storage';
import {
  scheduleNotification,
  cancelNotificationsForTask,
} from '../utils/notifications';

/** Forma del contexto de tareas. */
export interface TaskContextType {
  /** Lista completa de tareas (incluye las en papelera). */
  tasks: Task[];
  /** Lista de categorías (predeterminadas + personalizadas). */
  categories: Category[];
  /** Indica si la carga inicial ya terminó. */
  isReady: boolean;

  // --- CRUD Tareas ---
  /** Crea una nueva tarea y la persiste. */
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  /** Actualiza una tarea existente por ID. */
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  /** Mueve una tarea a la papelera (soft delete). */
  moveToTrash: (id: string) => Promise<void>;
  /** Restaura una tarea desde la papelera. */
  restoreFromTrash: (id: string) => Promise<void>;
  /** Elimina una tarea permanentemente (hard delete). */
  permanentlyDeleteTask: (id: string) => Promise<void>;
  /** Vacía la papelera eliminando definitivamente sus tareas. */
  emptyTrash: () => Promise<void>;
  /** Obtiene una tarea por ID (undefined si no existe). */
  getTaskById: (id: string) => Task | undefined;
  /** Obtiene tareas filtradas por estado y papelera. */
  getTasks: (filters?: { status?: Task['estado']; inTrash?: boolean }) => Task[];

  // --- CRUD Categorías ---
  /** Añade una categoría personalizada. */
  addCategory: (nombre: string) => Promise<Category>;
  /** Actualiza el nombre de una categoría personalizada. */
  updateCategory: (id: string, nombre: string) => Promise<void>;
  /** Elimina una categoría personalizada (no permite borrar predeterminadas). */
  deleteCategory: (id: string) => Promise<void>;
  /** Obtiene una categoría por ID. */
  getCategoryById: (id: string) => Category | undefined;
}

/** Contexto interno (undefined antes del Provider). */
const TaskContext = createContext<TaskContextType | undefined>(undefined);

/** Props del TaskProvider. */
export interface TaskProviderProps {
  children: ReactNode;
}

/**
 * Proveedor global de tareas y categorías con persistencia en AsyncStorage.
 * - Carga datos al montar.
 * - Persiste cambios tras cada mutación.
 * - Expone API CRUD completa con soft-delete (papelera).
 * 
 * NOTA: Notificaciones deshabilitadas para compatibilidad con Expo Go.
 * Para habilitar: descomentar imports y lógica de notificationService.
 * Requiere development build: npx expo run:android / npx expo run:ios
 */
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isReady, setIsReady] = useState(false);

  /** Guarda tareas en AsyncStorage. */
  const persistTasks = useCallback(async (newTasks: Task[]) => {
    await setStorageItem(STORAGE_KEYS.TASKS, newTasks);
  }, []);

  /** Guarda categorías en AsyncStorage. */
  const persistCategories = useCallback(async (newCategories: Category[]) => {
    await setStorageItem(STORAGE_KEYS.CATEGORIES, newCategories);
  }, []);

  /** Carga inicial de tareas y categorías. */
  useEffect(() => {
    let mounted = true;
    Promise.all([
      getStorageItem<Task[]>(STORAGE_KEYS.TASKS),
      getStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES),
    ])
      .then(([parsedTasks, parsedCustomCategories]) => {
        if (!mounted) return;
        const tasks = parsedTasks ?? [];
        const customCategories = parsedCustomCategories ?? [];
        // Fusionar predeterminadas + personalizadas (evitar duplicados)
        const mergedCategories = [
          ...DEFAULT_CATEGORIES,
          ...customCategories.filter((c) => !isDefaultCategory(c.id)),
        ];
        setTasks(tasks);
        setCategories(mergedCategories);
      })
      .catch(() => {
        // Si falla, usar valores por defecto
        setTasks([]);
        setCategories([...DEFAULT_CATEGORIES]);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // --- Helpers de notificaciones (DESHABILITADOS para Expo Go) ---
  // Para habilitar: descomentar imports y reemplazar estas funciones con la lógica real

  /**
   * Cancela notificación de una tarea (NO-OP: notificaciones deshabilitadas).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _cancelNotificationForTask = useCallback(async (_id: string): Promise<void> => {
    // NO-OP: notificaciones deshabilitadas para Expo Go
    // Para habilitar: descomentar import cancelTaskNotification y lógica
  }, []);

  /**
   * Programa notificación para una tarea (NO-OP: notificaciones deshabilitadas).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _scheduleNotificationForTask = useCallback(async (_id: string): Promise<void> => {
    // NO-OP: notificaciones deshabilitadas para Expo Go
    // Para habilitar: descomentar import scheduleTaskNotification y lógica
  }, []);

  // --- CRUD Tareas ---

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
      const newTask: Task = {
        ...taskData,
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: Date.now(),
        notificationId: undefined,
      };

      // Programar notificación (híbrida: nativa si disponible, si no local)
      const result = await scheduleNotification(newTask);
      if (result) {
        newTask.notificationId = result.id;
      }

      setTasks((prev) => {
        const next = [...prev, newTask];
        persistTasks(next);
        return next;
      });
      return newTask;
    },
    [persistTasks],
  );

  const updateTask = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Task, 'id' | 'createdAt'>>,
    ): Promise<void> => {
      // Primero obtener la tarea actual
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const mergedTask = { ...task, ...updates };

      // Manejar notificaciones ANTES de actualizar el estado
      const statusChangedToDone = updates.estado === 'Listo' || updates.estado === 'Cancelado';
      const movedToTrash = updates.inTrash === true && task.inTrash === false;
      const restoredFromTrash = updates.inTrash === false && task.inTrash === true;
      const dateTimeChanged = (updates.fecha && updates.fecha !== task.fecha) || (updates.hora && updates.hora !== task.hora);
      const statusChangedToActive = (updates.estado === 'Pendiente' || updates.estado === 'En curso') && 
                                    task.estado !== 'Pendiente' && task.estado !== 'En curso';

      let finalNotificationId = task.notificationId;

      if (statusChangedToDone || movedToTrash) {
        if (task.notificationId) {
          await cancelNotificationsForTask(id);
        }
        finalNotificationId = undefined;
      } else if (restoredFromTrash || dateTimeChanged || statusChangedToActive) {
        if (task.notificationId) {
          await cancelNotificationsForTask(id);
        }
        const result = await scheduleNotification(mergedTask);
        if (result) {
          finalNotificationId = result.id;
        }
      }

      // Actualizar estado con el nuevo notificationId
      const taskWithNotification = { ...mergedTask, notificationId: finalNotificationId };
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? taskWithNotification : t));
        persistTasks(next);
        return next;
      });
    },
    [persistTasks, tasks],
  );

  /** Soft delete: mueve a papelera (inTrash = true). Cancela notificación. */
  const moveToTrash = useCallback(
    async (id: string): Promise<void> => {
      await cancelNotificationsForTask(id);
      await updateTask(id, { inTrash: true });
    },
    [updateTask],
  );

  /** Restaura desde papelera (inTrash = false). Reprograma notificación. */
  const restoreFromTrash = useCallback(
    async (id: string): Promise<void> => {
      // updateTask ya maneja la reprogramación al cambiar inTrash
      await updateTask(id, { inTrash: false });
    },
    [updateTask],
  );

  /** Hard delete: elimina permanentemente del estado y storage. Cancela notificación. */
  const permanentlyDeleteTask = useCallback(
    async (id: string): Promise<void> => {
      await cancelNotificationsForTask(id);
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        persistTasks(next);
        return next;
      });
    },
    [persistTasks],
  );

  /** Vacía la papelera eliminando definitivamente todas sus tareas. Cancela notificaciones. */
  const emptyTrash = useCallback(async (): Promise<void> => {
    setTasks((prev) => {
      const trashTasks = prev.filter((t) => t.inTrash);
      // Cancelar notificaciones de todas las tareas en papelera
      trashTasks.forEach((task) => {
        if (task.notificationId) {
          cancelNotificationsForTask(task.id);
        }
      });
      const next = prev.filter((t) => !t.inTrash);
      persistTasks(next);
      return next;
    });
  }, [persistTasks]);

  const getTaskById = useCallback(
    (id: string): Task | undefined => {
      return tasks.find((t) => t.id === id);
    },
    [tasks],
  );

  const getTasks = useCallback(
    (filters?: { status?: Task['estado']; inTrash?: boolean }): Task[] => {
      return tasks.filter((t) => {
        if (filters?.status && t.estado !== filters.status) return false;
        if (filters?.inTrash !== undefined && t.inTrash !== filters.inTrash)
          return false;
        return true;
      });
    },
    [tasks],
  );

  // --- CRUD Categorías ---

  const addCategory = useCallback(
    async (nombre: string): Promise<Category> => {
      const trimmed = nombre.trim();
      if (!trimmed) throw new Error('El nombre de la categoría no puede estar vacío');
      const newCategory: Category = {
        id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        nombre: trimmed,
        esPredeterminada: false,
      };
      setCategories((prev) => {
        const next = [...prev, newCategory];
        persistCategories(next);
        return next;
      });
      return newCategory;
    },
    [persistCategories],
  );

  const updateCategory = useCallback(
    async (id: string, nombre: string): Promise<void> => {
      if (isDefaultCategory(id)) {
        throw new Error('No se puede modificar una categoría predeterminada');
      }
      const trimmed = nombre.trim();
      if (!trimmed) throw new Error('El nombre de la categoría no puede estar vacío');
      setCategories((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, nombre: trimmed } : c,
        );
        persistCategories(next);
        return next;
      });
    },
    [persistCategories],
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (isDefaultCategory(id)) {
        throw new Error('No se puede eliminar una categoría predeterminada');
      }
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persistCategories(next);
        return next;
      });
      // Reasignar tareas de esa categoría a 'Personal'
      const personalCategory = categories.find((c) => c.id === 'cat_personal');
      if (personalCategory) {
        setTasks((prev) => {
          const next = prev.map((t) =>
            t.categoria.id === id
              ? { ...t, categoria: { id: personalCategory.id, nombre: personalCategory.nombre } }
              : t,
          );
          persistTasks(next);
          return next;
        });
      }
    },
    [persistCategories, persistTasks, categories],
  );

  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return categories.find((c) => c.id === id);
    },
    [categories],
  );

  const value: TaskContextType = {
    tasks,
    categories,
    isReady,
    addTask,
    updateTask,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteTask,
    emptyTrash,
    getTaskById,
    getTasks,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

/**
 * Hook para consumir el TaskContext de forma tipada.
 * Lanza error si se usa fuera del TaskProvider.
 */
export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error(
      'useTasks debe usarse dentro de un TaskProvider. Verifica que App.tsx envuelva la app con TaskProvider.',
    );
  }
  return context;
};