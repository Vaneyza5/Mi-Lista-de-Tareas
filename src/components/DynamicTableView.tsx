import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Task, TaskStatus } from '../types/task';

/**
 * Props del DynamicTableView.
 * @property tasks - Array de tareas a mostrar.
 * @property onToggleStatus - Callback al cambiar estado.
 * @property onEdit - Callback al editar.
 * @property onDelete - Callback al mover a papelera.
 * @property testID - Para testing.
 */
export interface DynamicTableViewProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  testID?: string;
}

/** Definición de columnas para la tabla. */
interface Column {
  key: string;
  header: string;
  flex: number; // proporción flex (ej: 3 = 30%)
  render: (task: Task) => React.ReactNode;
}

/**
 * Vista de tabla responsiva para tareas.
 * - En móvil: tabla con scroll horizontal.
 * - Columnas: Título, Categoría, Prioridad, Estado, Fecha/Hora, Acciones.
 * - Accesible y adaptada a tema claro/oscuro.
 */
export const DynamicTableView: React.FC<DynamicTableViewProps> = ({
  tasks,
  onToggleStatus,
  onEdit,
  onDelete,
  testID = 'dynamic-table',
}) => {
  const { mode } = useTheme();

  const columns: Column[] = [
    {
      key: 'titulo',
      header: 'Título',
      flex: 30,
      render: (task) => (
        <Text
          style={{
            fontWeight: task.estado === 'Listo' ? '400' : '700',
            color: task.estado === 'Listo'
              ? mode === 'dark'
                ? '#888888'
                : '#999999'
              : mode === 'dark'
              ? '#FFFFFF'
              : '#000000',
            textDecorationLine: task.estado === 'Listo' ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          {task.titulo}
        </Text>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      flex: 18,
      render: (task) => (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F0F0F0',
            borderLeftWidth: 3,
            borderLeftColor:
              task.prioridad === 'Alta'
                ? '#CF6679'
                : task.prioridad === 'Media'
                ? '#FFAB00'
                : '#03DAC6',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: mode === 'dark' ? '#DDDDDD' : '#444444',
            }}
          >
            {task.categoria.nombre}
          </Text>
        </View>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      flex: 14,
      render: (task) => {
        const colors: Record<Task['prioridad'], string> = {
          Alta: '#CF6679',
          Media: '#FFAB00',
          Baja: '#03DAC6',
        };
        return (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: colors[task.prioridad],
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
              {task.prioridad}
            </Text>
          </View>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      flex: 14,
      render: (task) => {
        const statusColors: Record<TaskStatus, string> = {
          Pendiente: '#FFAB00',
          'En curso': '#2196F3',
          Listo: '#03DAC6',
          Cancelado: '#9E9E9E',
        };
        const color = statusColors[task.estado] || '#FFAB00';
        return (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: color,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
              {task.estado}
            </Text>
          </View>
        );
      },
    },
    {
      key: 'fechaHora',
      header: 'Fecha / Hora',
      flex: 16,
      render: (task) => (
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 12,
              color: mode === 'dark' ? '#BBBBBB' : '#555555',
            }}
          >
            📅 Entrega: {task.dueDate} {task.dueTime}
          </Text>
          {task.reminderDate && task.reminderTime && (
            <Text
              style={{
                fontSize: 11,
                color: mode === 'dark' ? '#BB86FC' : '#6200EE',
              }}
            >
              🔔 Recordatorio: {task.reminderDate} {task.reminderTime}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      flex: 18,
      render: (task) => (
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => onToggleStatus(task)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                task.estado === 'Pendiente'
                  ? mode === 'dark'
                    ? '#BB86FC'
                    : '#6200EE'
                  : mode === 'dark'
                  ? '#2C2C2C'
                  : '#F5F5F5',
              borderWidth: task.estado === 'Pendiente' ? 0 : 1,
              borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
            }}
            accessibilityLabel={
              task.estado === 'Pendiente' ? 'Marcar como Listo' : 'Marcar como Pendiente'
            }
            testID={`${testID}-toggle-${task.id}`}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color:
                  task.estado === 'Pendiente'
                    ? '#FFFFFF'
                    : mode === 'dark'
                    ? '#DDDDDD'
                    : '#333333',
              }}
            >
              {task.estado === 'Pendiente' ? '✓ Listo' : '↻'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onEdit(task)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
              borderWidth: 1,
              borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
            }}
            accessibilityLabel="Editar"
            testID={`${testID}-edit-${task.id}`}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: mode === 'dark' ? '#DDDDDD' : '#333333',
              }}
            >
              ✎
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(task)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: mode === 'dark' ? '#CF6679' : '#E53935',
            }}
            accessibilityLabel="Mover a papelera"
            testID={`${testID}-delete-${task.id}`}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#2A2A2A' : '#EEEEEE',
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
    },
    headerCell: {
      fontSize: 11,
      fontWeight: '700',
      color: mode === 'dark' ? '#AAAAAA' : '#666666',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#2A2A2A' : '#EEEEEE',
      alignItems: 'center',
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    cell: {
      flex: 1,
      paddingHorizontal: 4,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: mode === 'dark' ? '#888888' : '#999999',
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
  });

  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { minHeight: 200 }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📭 No hay tareas para mostrar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Encabezado fijo */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View key={col.key} style={{ flex: col.flex / 100, paddingHorizontal: 4 }}>
            <Text style={styles.headerCell}>{col.header}</Text>
          </View>
        ))}
      </View>

      {/* Contenido con scroll horizontal si hace falta */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ minWidth: '100%' }}
      >
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.row,
                index === tasks.length - 1 && styles.rowLast,
              ]}
              testID={`${testID}-row-${item.id}`}
            >
              {columns.map((col) => (
                <View
                  key={col.key}
                  style={{
                    flex: col.flex / 100,
                    paddingHorizontal: 4,
                  }}
                >
                  <View style={styles.cell}>{col.render(item)}</View>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={() => null}
        />
      </ScrollView>
    </View>
  );
};