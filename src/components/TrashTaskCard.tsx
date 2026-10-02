import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Task } from '../types/task';

export interface TrashTaskCardProps {
  task: Task;
  onRestore: () => void;
  onDelete: () => void;
  onViewMore: () => void;
  testID?: string;
}

const TrashTaskCard: React.FC<TrashTaskCardProps> = ({
  task,
  onRestore,
  onDelete,
  onViewMore,
  testID = 'trash-task-card',
}) => {
  const { mode, colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: Task['estado']): string => {
    const statusColors: Record<Task['estado'], string> = {
      Pendiente: mode === 'dark' ? '#FFB74D' : '#F57C00',
      'En curso': mode === 'dark' ? '#64B5F6' : '#1976D2',
      Listo: mode === 'dark' ? '#4DB6AC' : '#00897B',
      Cancelado: mode === 'dark' ? '#90A4AE' : '#78909C',
    };
    return statusColors[status] || statusColors.Pendiente;
  };

  const getPriorityColor = (priority: Task['prioridad']): string => {
    const priorityColors: Record<Task['prioridad'], string> = {
      Alta: mode === 'dark' ? '#EF5350' : '#E53935',
      Media: mode === 'dark' ? '#FFB74D' : '#F57C00',
      Baja: mode === 'dark' ? '#4DB6AC' : '#00897B',
    };
    return priorityColors[priority] || priorityColors.Media;
  };

  const getCategoryColor = (): string => {
    return mode === 'dark' ? '#7E57C2' : '#5E35B1';
  };

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
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
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
      // backgroundColor se asigna dinámicamente
    },
    statusBadge: {
      // backgroundColor se asigna dinámicamente
    },
    categoryBadge: {
      // backgroundColor se asigna dinámicamente
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    leftActions: {
      flexDirection: 'row',
      gap: 6,
      flex: 1,
      flexWrap: 'wrap',
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
    },
    restoreButton: {
      backgroundColor: colors.success,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    viewMoreButton: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
    restoreText: { color: '#000000' },
    deleteText: { color: '#FFFFFF' },
    viewMoreText: { color: colors.textSecondary },
    descriptionContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {task.titulo}
          </Text>
        </View>
      </View>

      <View style={styles.badgesRow}>
        <TouchableOpacity
          style={[styles.badge, styles.priorityBadge, { backgroundColor: getPriorityColor(task.prioridad) }]}
          accessibilityLabel={`Prioridad: ${task.prioridad}`}
          testID={`trash-priority-${task.id}`}
        >
          <Text style={styles.badgeText}>{task.prioridad}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.badge, styles.statusBadge, { backgroundColor: getStatusColor(task.estado) }]}
          accessibilityLabel={`Estado: ${task.estado}`}
          testID={`trash-status-${task.id}`}
        >
          <Text style={styles.badgeText}>{task.estado}</Text>
        </TouchableOpacity>
        <View style={[styles.badge, styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
          <Text style={styles.badgeText}>{task.categoria.nombre}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={onRestore}
            style={[styles.actionButton, styles.restoreButton]}
            accessibilityLabel="Restaurar tarea"
            testID={`trash-restore-${task.id}`}
          >
            <Ionicons name="refresh-outline" size={16} color="#000000" />
            <Text style={[styles.actionButtonText, styles.restoreText]} numberOfLines={1}>Restaurar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.actionButton, styles.deleteButton]}
            accessibilityLabel="Eliminar permanentemente"
            testID={`trash-delete-${task.id}`}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.deleteText]} numberOfLines={1}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={[styles.actionButton, styles.viewMoreButton]}
            accessibilityLabel={expanded ? 'Ver menos' : 'Ver mas'}
            testID={`trash-viewmore-${task.id}`}
          >
            <Text style={[styles.actionButtonText, styles.viewMoreText]} numberOfLines={1}>Ver mas</Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && task.descripcion && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{task.descripcion}</Text>
        </View>
      )}
    </View>
  );
};

export default TrashTaskCard;