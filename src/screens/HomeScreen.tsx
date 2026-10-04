import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { useSettings, ACCENT_COLOR_MAP } from '../context/SettingsContext';
import { Task } from '../types/task';
import { TaskFormModal } from '../components/TaskFormModal';
import { SearchBar, FilterField } from '../components/SearchBar';
import { FilterModal } from '../components/FilterModal';
import TaskCard from '../components/TaskCard';
import { normalizeForSearch } from '../utils/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tareas por página (requisito estricto: 4) */
const TASKS_PER_PAGE = 4;

const LoadingView: React.FC<{ mode: 'light' | 'dark'; colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors'] }> = ({ mode, colors }) => (
  <SafeAreaView
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    }}
  >
    <ActivityIndicator size="large" color={colors.info} />
    <Text
      style={{
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
      }}
    >
      Cargando tareas…
    </Text>
  </SafeAreaView>
);

export const HomeScreen: React.FC = () => {
  const { mode, colors } = useTheme();
  const { settings } = useSettings();
  const {
    isReady,
    getTasks,
    updateTask,
    moveToTrash,
  } = useTasks();

  // Safe Area insets for Android status bar
  const insets = useSafeAreaInsets();

  // Color de acento dinámico desde Settings
  const accentColor = mode === 'dark'
    ? ACCENT_COLOR_MAP[settings.accentColor]?.dark
    : ACCENT_COLOR_MAP[settings.accentColor]?.light;

  // Estado local UI
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  // Filtros avanzados
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField>('titulo');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Solo tareas activas (no en papelera)
  const activeTasks = useMemo(
    () => getTasks({ inTrash: false }),
    [getTasks],
  );

  // Filtrar por búsqueda según campo seleccionado - tolerante a tildes/ñ
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;
    const q = normalizeForSearch(searchQuery.trim());
    return activeTasks.filter((t) => {
      switch (selectedFilterField) {
        case 'titulo':
          return normalizeForSearch(t.titulo).includes(q);
        case 'descripcion':
          return normalizeForSearch(t.descripcion).includes(q);
        case 'fecha':
          return normalizeForSearch(t.dueDate).includes(q);
        case 'hora':
          return normalizeForSearch(t.dueTime).includes(q);
        case 'prioridad':
          return normalizeForSearch(t.prioridad).includes(q);
        default:
          return normalizeForSearch(t.titulo).includes(q) || normalizeForSearch(t.categoria.nombre).includes(q);
      }
    });
  }, [activeTasks, searchQuery, selectedFilterField]);

  // Aplicar ordenación según configuración
  const sortedTasks = useMemo(() => {
    const tasks = [...filteredTasks];
    switch (settings.sortOrder) {
      case 'fecha':
        return tasks.sort((a, b) => {
          const dateA = `${a.dueDate}T${a.dueTime}`;
          const dateB = `${b.dueDate}T${b.dueTime}`;
          return dateA.localeCompare(dateB);
        });
      case 'nombre':
        return tasks.sort((a, b) => a.titulo.localeCompare(b.titulo));
      case 'prioridad':
        const priorityOrder: Record<Task['prioridad'], number> = { Alta: 3, Media: 2, Baja: 1 };
        return tasks.sort((a, b) => priorityOrder[b.prioridad] - priorityOrder[a.prioridad]);
      default:
        return tasks;
    }
  }, [filteredTasks, settings.sortOrder]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / TASKS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return sortedTasks.slice(start, start + TASKS_PER_PAGE);
  }, [sortedTasks, currentPage]);

  // Reset página al cambiar filtro o búsqueda
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedFilterField]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleFilterFieldChange = useCallback((field: FilterField) => {
    setSelectedFilterField(field);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingTask(undefined);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingTask(undefined);
    Keyboard.dismiss();
  }, []);

  const openFilterModal = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const toggleTaskStatus = useCallback(
    async (task: Task) => {
      // Ciclo de estados: Pendiente → En curso → Listo → Cancelado → Pendiente
      const statusOrder: Task['estado'][] = ['Pendiente', 'En curso', 'Listo', 'Cancelado'];
      const currentIndex = statusOrder.indexOf(task.estado);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      const newStatus = statusOrder[nextIndex];
      await updateTask(task.id, { estado: newStatus });
    },
    [updateTask],
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      await moveToTrash(task.id);
    },
    [moveToTrash],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (!isReady) {
    return <LoadingView mode={mode} colors={colors} />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 0,
    },
    // HEADER
    header: {
      paddingHorizontal: 16,
      paddingTop: 44, // bajado para dar más espacio arriba
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: mode === 'dark' ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    // MAIN CONTENT AREA
    mainContent: {
      flex: 1,
      flexDirection: 'column',
    },
    listContent: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 100, // espacio para paginación + FAB
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyIcon: {
      fontSize: 80,
      marginBottom: 20,
      opacity: 0.4,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    // PAGINATION - fixed at bottom of content area
    paginationContainer: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      paddingBottom: 16,
      marginTop: 'auto', // Push to bottom of flex container
    },
    paginationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: mode === 'dark' ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pageButton: {
      minWidth: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageButtonActive: {
      backgroundColor: accentColor,
    },
    pageText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    pageTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    nextButton: {
      padding: 6,
      marginLeft: 4,
    },
    prevButton: {
      padding: 6,
      marginRight: 4,
    },
    // FAB - bottom se calcula dinámicamente en el render (100 + insets.bottom)
    fabContainer: {
      position: 'absolute',
      right: 20,
      zIndex: 999, // Asegura que flote por encima de cualquier otro contenedor
    },
    fab: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: accentColor,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    fabIcon: {
      fontSize: 28,
      color: '#FFFFFF',
      fontWeight: '300',
    },
  });

  const renderContent = () => {
    if (sortedTasks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={colors.textDisabled} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Sin coincidencias' : 'No hay tareas aun'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Intenta con otro termino de busqueda'
              : 'Presiona el boton + para crear tu primera tarea'}
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <FlatList
          data={paginatedTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onStatusPress={() => toggleTaskStatus(item)}
              onEditPress={() => openEditModal(item)}
              onTrashPress={() => handleDelete(item)}
              testID={`task-card-${item.id}`}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => null}
          ListFooterComponent={() => totalPages > 1 ? (
            <View style={styles.paginationContainer}>
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage <= 1}
                  accessibilityLabel="Pagina anterior"
                  testID="pagination-prev"
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={22}
                    color={
                      currentPage <= 1
                        ? mode === 'dark'
                          ? '#555555'
                          : '#BDBDBD'
                        : accentColor
                    }
                  />
                </TouchableOpacity>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <TouchableOpacity
                    key={pageNum}
                    style={[
                      styles.pageButton,
                      pageNum === currentPage && styles.pageButtonActive,
                    ]}
                    onPress={() => handlePageChange(pageNum)}
                    accessibilityLabel={`Pagina ${pageNum}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: pageNum === currentPage }}
                    testID={`pagination-page-${pageNum}`}
                  >
                    <Text
                      style={[
                        styles.pageText,
                        pageNum === currentPage && styles.pageTextActive,
                      ]}
                    >
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  accessibilityLabel="Pagina siguiente"
                  testID="pagination-next"
                >
                  <Ionicons
                    name="chevron-forward-outline"
                    size={22}
                    color={
                      currentPage >= totalPages
                        ? mode === 'dark'
                          ? '#555555'
                          : '#BDBDBD'
                        : accentColor
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tareas de {settings.userName}</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Buscar tarea"
          selectedFilterField={selectedFilterField}
          onFilterPress={openFilterModal}
          testID="home-search"
        />
      </View>

      {/* CONTENT - Flex layout with pagination always visible */}
      <View style={styles.mainContent}>
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.info]}
          progressViewOffset={20}
        />

        {renderContent()}

        {/* FAB - posicionado dinámicamente sobre la barra de navegación */}
        <View style={[styles.fabContainer, { bottom: 100 + insets.bottom }]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={openCreateModal}
            accessibilityLabel="Crear nueva tarea"
            testID="fab-create-task"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" style={styles.fabIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <TaskFormModal
        visible={modalVisible}
        onClose={closeModal}
        initialTask={editingTask}
        testID="home-task-modal"
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={closeFilterModal}
        selectedField={selectedFilterField}
        onSelectField={handleFilterFieldChange}
        testID="home-filter-modal"
      />
    </SafeAreaView>
  );
};