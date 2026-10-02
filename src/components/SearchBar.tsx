import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Props del componente SearchBar.
 * @property value - Valor actual del input.
 * @property onChangeText - Callback al cambiar el texto.
 * @property placeholder - Texto de ayuda.
 * @property onClear - Callback al limpiar (opcional).
 * @property selectedFilterField - Campo seleccionado para filtrar.
 * @property onFilterPress - Callback al presionar el botón de filtro.
 * @property testID - Para testing.
 */
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  selectedFilterField: FilterField;
  onFilterPress: () => void;
  testID?: string;
}

/** Campos disponibles para filtrar. */
export type FilterField = 'titulo' | 'descripcion' | 'fecha' | 'hora' | 'prioridad';

/**
 * Barra de búsqueda reutilizable con soporte tema claro/oscuro y botón de filtro.
 * - Limpia el input con botón X cuando hay texto.
 * - Botón de filtro (3 puntos) abre menú externo.
 * - Accesible y tipada.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar por título o categoría…',
  onClear,
  selectedFilterField,
  onFilterPress,
  testID = 'search-bar',
}) => {
  const { mode } = useTheme();

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
  }, [onChangeText, onClear]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#F2F2F2',
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: mode === 'dark' ? 0.3 : 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      paddingVertical: 0,
    },
    filterButton: {
      padding: 8,
      marginLeft: 8,
      borderRadius: 8,
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#E8E8E8',
    },
    filterButtonActive: {
      backgroundColor: mode === 'dark' ? '#00332E' : '#E0F2F1',
    },
    filterIcon: {
      fontSize: 22,
      color: mode === 'dark' ? '#AAAAAA' : '#757575',
    },
    filterIconActive: {
      color: mode === 'dark' ? '#00BFA6' : '#00897B',
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    clearText: {
      fontSize: 18,
      fontWeight: '600',
      color: mode === 'dark' ? '#AAAAAA' : '#888888',
    },
    filterIndicator: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: mode === 'dark' ? '#00BFA6' : '#00897B',
    },
  });

  const isDefaultField = selectedFilterField === 'titulo';

  return (
    <View style={styles.container} testID={testID}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={mode === 'dark' ? '#888888' : '#999999'}
        clearButtonMode="never"
        autoCapitalize="none"
        autoCorrect={false}
        testID={`${testID}-input`}
        accessibilityLabel="Buscar tareas"
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessible
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
          testID={`${testID}-clear`}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.filterButton,
          !isDefaultField && styles.filterButtonActive,
        ]}
        onPress={onFilterPress}
        accessible
        accessibilityLabel={`Filtrar por: ${getFieldLabel(selectedFilterField)}`}
        accessibilityRole="button"
        testID={`${testID}-filter`}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={22}
          color={isDefaultField ? styles.filterIcon.color : styles.filterIconActive.color}
          style={[styles.filterIcon, !isDefaultField && styles.filterIconActive]}
        />
        {!isDefaultField && <View style={styles.filterIndicator} />}
      </TouchableOpacity>
    </View>
  );
};

/** Convierte el key del filtro a label legible. */
const getFieldLabel = (field: FilterField): string => {
  const labels: Record<FilterField, string> = {
    titulo: 'Título',
    descripcion: 'Descripción',
    fecha: 'Fecha',
    hora: 'Hora',
    prioridad: 'Prioridad',
  };
  return labels[field] ?? field;
};