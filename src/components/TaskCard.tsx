import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Task, formatDueDateTime } from '../types/task';

export interface TaskCardProps {
  task: Task;
  onEditPress?: () => void;
  onTrashPress?: () => void;
  onStatusPress?: () => void;
  testID?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEditPress,
  onTrashPress,
  onStatusPress,
  testID = 'task-card',
}) => {
  const { mode, colors } = useTheme();

  const isCompleted = task.estado === 'Listo' || task.estado === 'Cancelado';

  const getStatusColor = (status: Task['estado']): string => {
    const colors: Record<Task['estado'], string> = {
      Pendiente: mode === 'dark' ? '#FFB74D' : '#F57C00',
      'En curso': mode === 'dark' ? '#64B5F6' : '#1976D2',
      Listo: mode === 'dark' ? '#4DB6AC' : '#00897B',
      Cancelado: mode === 'dark' ? '#90A4AE' : '#78909C',
    };
    return colors[status] || colors.Pendiente;
  };

  const getPriorityColor = (priority: Task['prioridad']): string => {
    const colors: Record<Task['prioridad'], string> = {
      Alta: mode === 'dark' ? '#EF5350' : '#E53935',
      Media: mode === 'dark' ? '#FFB74D' : '#F57C00',
      Baja: mode === 'dark' ? '#4DB6AC' : '#00897B',
    };
    return colors[priority] || colors.Media;
  };

  const getCategoryColor = (): string => {
    return mode === 'dark' ? '#7E57C2' : '#5E35B1';
  };

  // Formatear fecha de entrega para mostrar
  const dueDateTime = formatDueDateTime(task.dueDate, task.dueTime);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: mode === 'dark' ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      textDecorationLine: isCompleted ? 'line-through' : 'none',
      color: isCompleted
        ? colors.textDisabled
        : colors.textPrimary,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    icon: {
      fontSize: 22,
      color: colors.textSecondary,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    priorityBadge: {
      backgroundColor: getPriorityColor(task.prioridad),
    },
    statusBadge: {
      backgroundColor: getStatusColor(task.estado),
    },
    categoryBadge: {
      backgroundColor: getCategoryColor(),
    },
    dueDateBadge: {
      backgroundColor: mode === 'dark' ? '#1E3A5F' : '#E8F0FE',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#BB86FC' : '#6200EE',
    },
    dueDateText: {
      fontSize: 11,
      fontWeight: '600',
      color: mode === 'dark' ? '#BB86FC' : '#1A73E8',
    },
  });

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {task.titulo}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onEditPress}
            style={styles.iconButton}
            accessibilityLabel="Editar tarea"
            testID={`${testID}-edit`}
          >
            <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onTrashPress}
            style={styles.iconButton}
            accessibilityLabel="Mover a papelera"
            testID={`${testID}-trash`}
          >
            <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.badgesRow}>
        <TouchableOpacity
          onPress={onStatusPress}
          style={[styles.badge, styles.priorityBadge]}
          accessibilityLabel={`Prioridad: ${task.prioridad}`}
          testID={`${testID}-priority`}
        >
          <Text style={styles.badgeText}>{task.prioridad}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onStatusPress}
          style={[styles.badge, styles.statusBadge]}
          accessibilityLabel={`Estado: ${task.estado}`}
          testID={`${testID}-status`}
        >
          <Text style={styles.badgeText}>{task.estado}</Text>
        </TouchableOpacity>
        <View style={[styles.badge, styles.categoryBadge]}>
          <Text style={styles.badgeText}>{task.categoria.nombre}</Text>
        </View>
        {/* Fecha de entrega junto a la categoría */}
        <View style={[styles.badge, styles.dueDateBadge]}>
          <Ionicons name="time-outline" size={14} color={mode === 'dark' ? '#BB86FC' : '#1A73E8'} style={{ marginRight: 4 }} />
          <Text style={styles.dueDateText}>{dueDateTime}</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;