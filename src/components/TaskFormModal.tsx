import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Keyboard,
  ViewStyle,
  TextStyle,
  FlexAlignType,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { Task, Priority, TaskStatus } from '../types/task';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Props del TaskFormModal.
 * @property visible - Controla visibilidad del modal.
 * @property onClose - Callback al cerrar (cancelar).
 * @property initialTask - Tarea a editar (undefined = crear nueva).
 * @property testID - Para testing.
 */
export interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialTask?: Task;
  testID?: string;
}

interface FormField {
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  estado: TaskStatus;
  dueDate: string;
  dueTime: string;
  reminderDate?: string;
  reminderTime?: string;
  categoriaId: string;
  categoriaNombre: string;
}

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const STATUSES: TaskStatus[] = ['Pendiente', 'En curso', 'Listo', 'Cancelado'];

const todayISO = (): string => new Date().toISOString().split('T')[0];
const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  initialTask,
  testID = 'task-form-modal',
}) => {
  const { mode } = useTheme();
  const { categories, addTask, updateTask, addCategory, deleteCategory, isReady } = useTasks();

  const isEditing = !!initialTask;

  const [form, setForm] = useState<FormField>({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    dueDate: tomorrowISO(),
    dueTime: '09:00',
    reminderDate: todayISO(),
    reminderTime: '08:00',
    categoriaId: categories[0]?.id ?? 'cat_personal',
    categoriaNombre: categories[0]?.nombre ?? 'Personal',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  // Date/Time pickers
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const initializedRef = useRef(false);

  // Sincronizar form con initialTask al abrir/editar
  useEffect(() => {
    if (!visible) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        titulo: initialTask.titulo,
        descripcion: initialTask.descripcion,
        prioridad: initialTask.prioridad,
        estado: initialTask.estado,
        dueDate: initialTask.dueDate,
        dueTime: initialTask.dueTime,
        reminderDate: initialTask.reminderDate ?? todayISO(),
        reminderTime: initialTask.reminderTime ?? '08:00',
        categoriaId: initialTask.categoria.id,
        categoriaNombre: initialTask.categoria.nombre,
      });
    } else {
      // Reset para nueva tarea
      setForm({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        estado: 'Pendiente',
        dueDate: tomorrowISO(),
        dueTime: '09:00',
        reminderDate: todayISO(),
        reminderTime: '08:00',
        categoriaId: categories[0]?.id ?? 'cat_personal',
        categoriaNombre: categories[0]?.nombre ?? 'Personal',
      });
    }
    setErrors({});
  }, [visible, initialTask, categories]);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormField, string>> = {};

    if (!form.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    } else if (form.titulo.trim().length < 2) {
      newErrors.titulo = 'Mínimo 2 caracteres';
    }

    if (!form.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (!form.categoriaId) {
      newErrors.categoriaId = 'Selecciona una categoría';
    }

    // Validar que la fecha de recordatorio no sea posterior a la de entrega
    if (form.reminderDate && form.reminderTime && form.dueDate && form.dueTime) {
      const reminder = new Date(`${form.reminderDate}T${form.reminderTime}`);
      const due = new Date(`${form.dueDate}T${form.dueTime}`);
      if (reminder > due) {
        newErrors.reminderDate = 'El recordatorio debe ser anterior a la entrega';
        newErrors.reminderTime = 'El recordatorio debe ser anterior a la entrega';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const taskData = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        estado: form.estado,
        dueDate: form.dueDate,
        dueTime: form.dueTime,
        reminderDate: form.reminderDate || undefined,
        reminderTime: form.reminderTime || undefined,
        categoria: { id: form.categoriaId, nombre: form.categoriaNombre },
        inTrash: false,
      };

      if (isEditing && initialTask) {
        await updateTask(initialTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      onClose();
    } catch (e) {
      console.error('Error guardando tarea:', e);
    } finally {
      setSubmitting(false);
    }
  }, [form, isEditing, initialTask, addTask, updateTask, onClose, validate]);

  const updateField = useCallback(<K extends keyof FormField>(field: K, value: FormField[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const updateCategory = useCallback((id: string, nombre: string) => {
    updateField('categoriaId', id);
    updateField('categoriaNombre', nombre);
  }, [updateField]);

  const handleAddCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    try {
      const newCategory = await addCategory(trimmedName);
      updateField('categoriaId', newCategory.id);
      updateField('categoriaNombre', newCategory.nombre);
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }, [addCategory, newCategoryName, updateField]);

  // Date/Time picker handlers
  const handleDueDateChange = useCallback((event: any, date?: Date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      updateField('dueDate', `${year}-${month}-${day}`);
    }
    setShowDueDatePicker(false);
  }, [updateField]);

  const handleDueTimeChange = useCallback((event: any, date?: Date) => {
    if (date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      updateField('dueTime', `${hours}:${minutes}`);
    }
    setShowDueTimePicker(false);
  }, [updateField]);

  const handleReminderDateChange = useCallback((event: any, date?: Date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      updateField('reminderDate', `${year}-${month}-${day}`);
    }
    setShowReminderDatePicker(false);
  }, [updateField]);

  const handleReminderTimeChange = useCallback((event: any, date?: Date) => {
    if (date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      updateField('reminderTime', `${hours}:${minutes}`);
    }
    setShowReminderTimePicker(false);
  }, [updateField]);

  const openDueDatePicker = useCallback(() => setShowDueDatePicker(true), []);
  const openDueTimePicker = useCallback(() => setShowDueTimePicker(true), []);
  const openReminderDatePicker = useCallback(() => setShowReminderDatePicker(true), []);
  const openReminderTimePicker = useCallback(() => setShowReminderTimePicker(true), []);

  if (!visible) return null;

  // Si las categorías aún no están listas, mostrar loading
  if (!isReady) {
    const overlayStyle = {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      padding: 16,
    };
    const modalStyle = {
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      maxHeight: '90%' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    };
    const headerStyle = {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#333333' : '#EEEEEE',
    };
    const titleStyle = {
      fontSize: 20,
      fontWeight: '700' as const,
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
    };
    const closeButtonStyle = { padding: 4 };
    const closeIconColor = mode === 'dark' ? '#AAAAAA' : '#888888';

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
        testID={testID}
      >
        <Pressable onPress={onClose} style={overlayStyle} testID={`${testID}-overlay`}>
          <Pressable onPress={(e) => e.stopPropagation()} style={modalStyle} testID={`${testID}-content`}>
            <View style={headerStyle}>
              <Text style={titleStyle}>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</Text>
              <Pressable onPress={onClose} style={closeButtonStyle} testID={`${testID}-close`} accessibilityLabel="Cerrar" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-outline" size={24} color={closeIconColor} />
              </Pressable>
            </View>
            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />
              <Text style={{ marginTop: 12, fontSize: 16, color: mode === 'dark' ? '#AAAAAA' : '#757575' }}>
                Cargando categorías…
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 16,
    },
    modal: {
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#333333' : '#EEEEEE',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
    },
    closeButton: {
      padding: 4,
    },
    closeText: {
      fontSize: 24,
      color: mode === 'dark' ? '#AAAAAA' : '#888888',
    },
    content: {
      padding: 20,
    },
    fieldGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 6,
      color: mode === 'dark' ? '#DDDDDD' : '#333333',
    },
    input: {
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
    },
    inputError: {
      borderColor: '#CF6679',
    },
    errorText: {
      marginTop: 4,
      fontSize: 12,
      color: '#CF6679',
    },
    pickerContainer: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    pickerOption: {
      flex: 1,
      minWidth: 80,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    half: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: mode === 'dark' ? '#333333' : '#EEEEEE',
    },
    button: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: mode === 'dark' ? '#BB86FC' : '#6200EE',
    },
    buttonSecondary: {
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    buttonTextPrimary: { color: '#FFFFFF' },
    buttonTextSecondary: { color: mode === 'dark' ? '#DDDDDD' : '#333333' },
    buttonDisabled: { opacity: 0.6 },
    inputPressable: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputText: {
      fontSize: 16,
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      flex: 1,
    },
    inputTextDisabled: {
      fontSize: 16,
      color: mode === 'dark' ? '#888888' : '#999999',
      flex: 1,
    },
    reminderPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 12,
      padding: 14,
      borderRadius: 10,
      backgroundColor: mode === 'dark' ? '#1E3A5F' : '#E8F0FE',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#BB86FC' : '#6200EE',
    },
    reminderPreviewIcon: {
      padding: 2,
    },
    reminderPreviewContent: {
      flex: 1,
    },
    reminderPreviewTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: mode === 'dark' ? '#BB86FC' : '#1A73E8',
      marginBottom: 2,
    },
    reminderPreviewTime: {
      fontSize: 14,
      fontWeight: '700',
      color: mode === 'dark' ? '#E8E8E8' : '#1A1A1A',
    },
    disabledFieldOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    lockIcon: {
      marginLeft: 8,
    },
  });

  const getPickerButtonStyle = (selected: boolean): ViewStyle => ({
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center' as FlexAlignType,
    backgroundColor: selected
      ? mode === 'dark'
        ? '#BB86FC'
        : '#6200EE'
      : mode === 'dark'
      ? '#2C2C2C'
      : '#F5F5F5',
    borderWidth: 1,
    borderColor: selected
      ? mode === 'dark'
        ? '#BB86FC'
        : '#6200EE'
      : mode === 'dark'
      ? '#3A3A3A'
      : '#DDDDDD',
  });

  const getPickerTextStyle = (selected: boolean): TextStyle => ({
    fontSize: 14,
    fontWeight: '600' as const,
    color: selected ? '#FFFFFF' : mode === 'dark' ? '#DDDDDD' : '#333333',
  });

  const getCategoryButtonStyle = (selected: boolean): ViewStyle => ({
    ...getPickerButtonStyle(selected),
    flexDirection: 'row',
    alignItems: 'center' as FlexAlignType,
    justifyContent: 'space-between',
  });

  const renderPriorityPicker = () => (
    <View style={styles.pickerContainer}>
      {PRIORITIES.map((p) => (
        <Pressable
          key={p}
          style={getPickerButtonStyle(form.prioridad === p)}
          onPress={() => updateField('prioridad', p)}
          testID={`${testID}-priority-${p}`}
          accessibilityLabel={`Prioridad ${p}`}
          accessibilityRole="button"
          accessibilityState={{ selected: form.prioridad === p }}
        >
          <Text style={getPickerTextStyle(form.prioridad === p)}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderStatusPicker = () => (
    <View style={styles.pickerContainer}>
      {STATUSES.map((s) => (
        <Pressable
          key={s}
          style={getPickerButtonStyle(form.estado === s)}
          onPress={() => updateField('estado', s)}
          testID={`${testID}-status-${s}`}
          accessibilityLabel={`Estado ${s}`}
          accessibilityRole="button"
          accessibilityState={{ selected: form.estado === s }}
        >
          <Text style={getPickerTextStyle(form.estado === s)}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderCategoryPicker = () => (
    <View style={{ gap: 8 }}>
      {/* Header con toggle para expandir/contraer */}
      <Pressable
        onPress={() => setCategoryExpanded(!categoryExpanded)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}
        accessibilityLabel={categoryExpanded ? 'Ocultar categorías' : 'Mostrar categorías'}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: mode === 'dark' ? '#BB86FC' : '#6200EE' }}>
          Categorías disponibles
        </Text>
        <Ionicons name={categoryExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />
      </Pressable>

      {categoryExpanded && (
        <>
          {categories.map((cat) => {
            const isCustom = !cat.esPredeterminada;
            return (
              <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  style={getCategoryButtonStyle(form.categoriaId === cat.id)}
                  onPress={() => updateCategory(cat.id, cat.nombre)}
                  testID={`${testID}-category-${cat.id}`}
                  accessibilityLabel={`Categoría ${cat.nombre}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: form.categoriaId === cat.id }}
                >
                  <Text
                    style={[
                      getPickerTextStyle(form.categoriaId === cat.id),
                      { flex: 1 },
                    ]}
                  >
                    {cat.nombre}
                  </Text>
                  {cat.esPredeterminada && (
                    <Text
                      style={{
                        fontSize: 10,
                        marginLeft: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: mode === 'dark' ? '#3A3A3A' : '#EEEEEE',
                        color: mode === 'dark' ? '#AAAAAA' : '#666666',
                      }}
                    >
                      Sistema
                    </Text>
                  )}
                </Pressable>
                {isCustom && (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        'Eliminar categoría',
                        `¿Eliminar "${cat.nombre}"? Las tareas con esta categoría se moverán a "Personal".`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteCategory(cat.id);
                                // Si la categoría eliminada era la seleccionada, cambiar a Personal
                                if (form.categoriaId === cat.id) {
                                  const personalCat = categories.find((c) => c.id === 'cat_personal');
                                  if (personalCat) {
                                    updateCategory(personalCat.id, personalCat.nombre);
                                  }
                                }
                              } catch (error) {
                                console.error('Error deleting category:', error);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: mode === 'dark' ? '#3A3A3A' : '#F5F5F5',
                    }}
                    testID={`${testID}-delete-category-${cat.id}`}
                    accessibilityLabel={`Eliminar categoría ${cat.nombre}`}
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={mode === 'dark' ? '#EF5350' : '#E53935'} />
                  </Pressable>
                )}
              </View>
            );
          })}
          {/* Opción para agregar nueva categoría */}
          {!showNewCategoryInput ? (
            <Pressable
              style={[
                getCategoryButtonStyle(false),
                { backgroundColor: mode === 'dark' ? '#3A3A3A' : '#F0F0F0' },
              ]}
              onPress={() => setShowNewCategoryInput(true)}
              testID={`${testID}-add-category`}
              accessibilityLabel="Agregar nueva categoría"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={20} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} style={{ marginRight: 8 }} />
              <Text style={getPickerTextStyle(false)}>Nueva categoría</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, minWidth: 120 },
                ]}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Nombre de la categoría"
                autoCapitalize="words"
                autoCorrect={false}
                onSubmitEditing={handleAddCategory}
                testID={`${testID}-new-category-input`}
                accessibilityLabel="Nombre de la nueva categoría"
              />
              <Pressable
                onPress={handleAddCategory}
                style={getPickerButtonStyle(true)}
                testID={`${testID}-confirm-category`}
                accessibilityLabel="Guardar categoría"
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                }}
                style={[
                  getPickerButtonStyle(false),
                  { backgroundColor: mode === 'dark' ? '#CF6679' : '#E53935' },
                ]}
                testID={`${testID}-cancel-category`}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      {/* BACKDROP - Solo cierra al tocar fuera del modal */}
      <Pressable
        onPress={onClose}
        style={styles.overlay}
        testID={`${testID}-overlay`}
        accessibilityLabel="Cerrar modal"
      >
        {/* MODAL CONTENT - Detiene la propagación del toque */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.modal}
          testID={`${testID}-content`}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              testID={`${testID}-close`}
              accessibilityLabel="Cerrar"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-outline" size={24} color={styles.closeText.color} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Título */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.titulo && styles.inputError,
                ]}
                value={form.titulo}
                onChangeText={(v) => updateField('titulo', v)}
                placeholder="Título de la tarea"
                maxLength={100}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                testID={`${testID}-titulo`}
                accessibilityLabel="Título de la tarea"
              />
              {errors.titulo && (
                <Text style={styles.errorText}>{errors.titulo}</Text>
              )}
            </View>

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.descripcion && styles.inputError,
                  { minHeight: 80, textAlignVertical: 'top' },
                ]}
                value={form.descripcion}
                onChangeText={(v) => updateField('descripcion', v)}
                placeholder="Detalles de la tarea…"
                multiline
                maxLength={500}
                autoCapitalize="sentences"
                testID={`${testID}-descripcion`}
                accessibilityLabel="Descripción de la tarea"
              />
              {errors.descripcion && (
                <Text style={styles.errorText}>{errors.descripcion}</Text>
              )}
            </View>

            {/* Prioridad */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prioridad</Text>
              {renderPriorityPicker()}
            </View>

            {/* Estado */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Estado</Text>
              {renderStatusPicker()}
            </View>

            {/* Fecha y Hora de ENTREGA (inmutable si editando) */}
            <View style={styles.fieldGroup}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.label}>Fecha de entrega *</Text>
                    {isEditing && <Ionicons name="lock-closed-outline" size={18} color={mode === 'dark' ? '#888888' : '#999999'} style={styles.lockIcon} />}
                  </View>
                  <Pressable
                    onPress={isEditing ? undefined : openDueDatePicker}
                    style={[
                      styles.input,
                      styles.inputPressable,
                      isEditing && { opacity: 0.7 },
                    ]}
                    testID={`${testID}-due-date`}
                    accessibilityLabel={isEditing ? 'Fecha de entrega (no editable)' : 'Fecha de entrega'}
                    disabled={isEditing}
                  >
                    <Text style={isEditing ? styles.inputTextDisabled : styles.inputText}>
                      {form.dueDate}
                    </Text>
                    {!isEditing && <Ionicons name="calendar-outline" size={22} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />}
                  </Pressable>
                </View>
                <View style={styles.half}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.label}>Hora de entrega *</Text>
                    {isEditing && <Ionicons name="lock-closed-outline" size={18} color={mode === 'dark' ? '#888888' : '#999999'} style={styles.lockIcon} />}
                  </View>
                  <Pressable
                    onPress={isEditing ? undefined : openDueTimePicker}
                    style={[
                      styles.input,
                      styles.inputPressable,
                      isEditing && { opacity: 0.7 },
                    ]}
                    testID={`${testID}-due-time`}
                    accessibilityLabel={isEditing ? 'Hora de entrega (no editable)' : 'Hora de entrega'}
                    disabled={isEditing}
                  >
                    <Text style={isEditing ? styles.inputTextDisabled : styles.inputText}>
                      {form.dueTime}
                    </Text>
                    {!isEditing && <Ionicons name="time-outline" size={22} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />}
                  </Pressable>
                </View>
              </View>
              {isEditing && (
                <Text style={{ marginTop: 6, fontSize: 12, color: mode === 'dark' ? '#888888' : '#999999' }}>
                  La fecha y hora de entrega no se pueden modificar tras crear la tarea
                </Text>
              )}
            </View>

            {/* Fecha y Hora de RECORDATORIO (editable siempre) */}
            <View style={styles.fieldGroup}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Fecha de recordatorio (opcional)</Text>
                  <Pressable
                    onPress={openReminderDatePicker}
                    style={[styles.input, styles.inputPressable]}
                    testID={`${testID}-reminder-date`}
                    accessibilityLabel="Fecha de recordatorio"
                  >
                    <Text style={styles.inputText}>
                      {form.reminderDate || 'Seleccionar'}
                    </Text>
                    <Ionicons name={form.reminderDate ? 'calendar-outline' : 'calendar-outline'} size={22} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />
                  </Pressable>
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Hora de recordatorio (opcional)</Text>
                  <Pressable
                    onPress={openReminderTimePicker}
                    style={[styles.input, styles.inputPressable]}
                    testID={`${testID}-reminder-time`}
                    accessibilityLabel="Hora de recordatorio"
                  >
                    <Text style={styles.inputText}>
                      {form.reminderTime || 'Seleccionar'}
                    </Text>
                    <Ionicons name={form.reminderTime ? 'time-outline' : 'time-outline'} size={22} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />
                  </Pressable>
                </View>
              </View>
              {(errors.reminderDate || errors.reminderTime) && (
                <Text style={styles.errorText}>
                  {errors.reminderDate || errors.reminderTime}
                </Text>
              )}
              {(form.reminderDate && form.reminderTime) && (
                <View style={styles.reminderPreview}>
                  <View style={styles.reminderPreviewIcon}>
                    <Ionicons name="notifications-circle-outline" size={22} color={mode === 'dark' ? '#BB86FC' : '#6200EE'} />
                  </View>
                  <View style={styles.reminderPreviewContent}>
                    <Text style={styles.reminderPreviewTitle}>Recordatorio programado</Text>
                    <Text style={styles.reminderPreviewTime}>
                      {form.reminderDate.split('-').reverse().join('/')} a las {form.reminderTime}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Categoría */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoría *</Text>
              {renderCategoryPicker()}
              {errors.categoriaId && (
                <Text style={styles.errorText}>{errors.categoriaId}</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.button,
                styles.buttonSecondary,
                submitting && styles.buttonDisabled,
              ]}
              onPress={onClose}
              disabled={submitting}
              testID={`${testID}-cancel`}
              accessibilityLabel="Cancelar"
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              testID={`${testID}-save`}
              accessibilityLabel={isEditing ? 'Guardar cambios' : 'Crear tarea'}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      {/* Due Date Picker Modal */}
      <Modal visible={showDueDatePicker} animationType="slide" transparent onRequestClose={() => setShowDueDatePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, margin: 16, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: mode === 'dark' ? '#FFFFFF' : '#000000', marginBottom: 16 }}>
              Seleccionar fecha de entrega
            </Text>
            <DateTimePicker
              value={form.dueDate ? new Date(form.dueDate) : new Date()}
              mode="date"
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={handleDueDateChange}
              minimumDate={new Date()}
            />
            <Pressable
              onPress={() => setShowDueDatePicker(false)}
              style={{ marginTop: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: mode === 'dark' ? '#BB86FC' : '#6200EE', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Due Time Picker Modal */}
      <Modal visible={showDueTimePicker} animationType="slide" transparent onRequestClose={() => setShowDueTimePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, margin: 16, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: mode === 'dark' ? '#FFFFFF' : '#000000', marginBottom: 16 }}>
              Seleccionar hora de entrega
            </Text>
            <DateTimePicker
              value={form.dueTime ? new Date(`1970-01-01T${form.dueTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={handleDueTimeChange}
              is24Hour={true}
            />
            <Pressable
              onPress={() => setShowDueTimePicker(false)}
              style={{ marginTop: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: mode === 'dark' ? '#BB86FC' : '#6200EE', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Reminder Date Picker Modal */}
      <Modal visible={showReminderDatePicker} animationType="slide" transparent onRequestClose={() => setShowReminderDatePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, margin: 16, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: mode === 'dark' ? '#FFFFFF' : '#000000', marginBottom: 16 }}>
              Seleccionar fecha de recordatorio
            </Text>
            <DateTimePicker
              value={form.reminderDate ? new Date(form.reminderDate) : new Date()}
              mode="date"
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={handleReminderDateChange}
              minimumDate={new Date()}
            />
            <Pressable
              onPress={() => setShowReminderDatePicker(false)}
              style={{ marginTop: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: mode === 'dark' ? '#BB86FC' : '#6200EE', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Reminder Time Picker Modal */}
      <Modal visible={showReminderTimePicker} animationType="slide" transparent onRequestClose={() => setShowReminderTimePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, margin: 16, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: mode === 'dark' ? '#FFFFFF' : '#000000', marginBottom: 16 }}>
              Seleccionar hora de recordatorio
            </Text>
            <DateTimePicker
              value={form.reminderTime ? new Date(`1970-01-01T${form.reminderTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={handleReminderTimeChange}
              is24Hour={true}
            />
            <Pressable
              onPress={() => setShowReminderTimePicker(false)}
              style={{ marginTop: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: mode === 'dark' ? '#BB86FC' : '#6200EE', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </Modal>
  );
};