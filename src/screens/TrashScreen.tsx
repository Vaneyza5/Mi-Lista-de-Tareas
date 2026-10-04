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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types/task';
import { SearchBar, FilterField } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { ConfirmModal } from '../components/ConfirmModal';
import { FilterModal } from '../components/FilterModal';
import TrashTaskCard from '../components/TrashTaskCard';
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
      Cargando papelera…
    </Text>
  </SafeAreaView>
);

export const TrashScreen: React.FC = () => {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isReady,
    getTasks,
    restoreFromTrash,
    permanentlyDeleteTask,
    emptyTrash,
  } = useTasks();

  // Estado local UI
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
  // Filtros avanzados
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField>('titulo');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Solo tareas en papelera
  const trashTasks = useMemo(
    () => getTasks({ inTrash: true }),
    [getTasks],
  );

  // Filtrar por búsqueda según campo seleccionado - tolerante a tildes/ñ
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return trashTasks;
    const q = normalizeForSearch(searchQuery.trim());
    return trashTasks.filter((t) => {
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
  }, [trashTasks, searchQuery, selectedFilterField]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  // Reset página al cambiar filtro
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

  const openFilterModal = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRestore = useCallback(
    (task: Task) => {
      setTaskToRestore(task);
      setConfirmVisible(true);
    },
    [],
  );

  const confirmRestore = useCallback(async () => {
    if (taskToRestore) {
      await restoreFromTrash(taskToRestore.id);
      setTaskToRestore(null);
      setConfirmVisible(false);
    }
  }, [taskToRestore, restoreFromTrash]);

  const cancelRestore = useCallback(() => {
    setTaskToRestore(null);
    setConfirmVisible(false);
  }, []);

  const handlePermanentDelete = useCallback(
    async (task: Task) => {
      setTaskToDelete(task);
      setConfirmVisible(true);
    },
    [],
  );

  const confirmPermanentDelete = useCallback(async () => {
    if (taskToDelete) {
      await permanentlyDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
      setConfirmVisible(false);
    }
  }, [taskToDelete, permanentlyDeleteTask]);

  const cancelPermanentDelete = useCallback(() => {
    setTaskToDelete(null);
    setConfirmVisible(false);
  }, []);

  const handleEmptyTrash = useCallback(() => {
    if (filteredTasks.length > 0) {
      setTaskToDelete(null); // null means empty trash
      setConfirmVisible(true);
    }
  }, [filteredTasks.length]);

  const confirmEmptyTrash = useCallback(async () => {
    await emptyTrash();
    setConfirmVisible(false);
    setTaskToDelete(null);
  }, [emptyTrash]);

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
      paddingTop: insets.top,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerActionButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    headerActionIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    emptyTrashButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.error,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    emptyTrashText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: 20,
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
    paginationContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
  });

  const renderTask = ({ item }: { item: Task }) => (
    <TrashTaskCard
      task={item}
      onRestore={() => handleRestore(item)}
      onDelete={() => handlePermanentDelete(item)}
      onViewMore={() => {}}
      testID={`trash-card-${item.id}`}
    />
  );

  const isRestore = !!taskToRestore;
  const isDelete = !!taskToDelete;

  const confirmTitle = isRestore
    ? 'Restaurar tarea'
    : isDelete
    ? 'Eliminar permanentemente'
    : 'Vaciar papelera';

  const confirmMessage = isRestore
    ? `¿Restaurar "${taskToRestore?.titulo}"? Volverá a la lista principal.`
    : isDelete
    ? `Eliminar definitivamente "${taskToDelete?.titulo}"? Esta acción no se puede deshacer.`
    : `Eliminar permanentemente las ${filteredTasks.length} tarea${filteredTasks.length !== 1 ? 's' : ''} de la papelera? Esta acción no se puede deshacer.`;

  const confirmText = isRestore ? 'Restaurar' : isDelete ? 'Eliminar' : 'Vaciar';
  const onConfirmAction = isRestore ? confirmRestore : isDelete ? confirmPermanentDelete : confirmEmptyTrash;
  const onCancelAction = isRestore ? cancelRestore : cancelPermanentDelete;
  const isDestructive = !isRestore; // Restaurar no es destructivo

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Papelera</Text>
          <View style={styles.headerActions}>
            {filteredTasks.length > 0 && (
              <TouchableOpacity
                style={styles.emptyTrashButton}
                onPress={handleEmptyTrash}
                testID="empty-trash-button"
                accessibilityLabel="Vaciar papelera"
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.emptyTrashText}>Vaciar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Buscar en papelera…"
            selectedFilterField={selectedFilterField}
            onFilterPress={openFilterModal}
            testID="trash-search"
          />
        </View>
      </View>

      {/* CONTENT */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trash-outline" size={64} color={colors.textDisabled} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Papelera vacia</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'No hay coincidencias en la papelera'
              : 'Las tareas eliminadas aparecera aqui'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.info]}
                progressViewOffset={20}
              />
            }
            ListEmptyComponent={() => null}
            showsVerticalScrollIndicator={false}
          />

          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                testID="trash-pagination"
              />
            </View>
          )}
        </>
      )}

      <ConfirmModal
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={onConfirmAction}
        onCancel={onCancelAction}
        confirmText={confirmText}
        isDestructive={isDestructive}
        testID="trash-confirm-modal"
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={closeFilterModal}
        selectedField={selectedFilterField}
        onSelectField={handleFilterFieldChange}
        testID="trash-filter-modal"
      />
    </SafeAreaView>
  );
};