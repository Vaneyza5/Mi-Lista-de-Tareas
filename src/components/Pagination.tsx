import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings, ACCENT_COLOR_MAP } from '../context/SettingsContext';

/**
 * Props del componente Pagination.
 * @property currentPage - Página actual (base 1).
 * @property totalPages - Total de páginas.
 * @property onPageChange - Callback al cambiar de página.
 * @property maxVisiblePages - Máximo de botones numéricos visibles (default: 5).
 * @property testID - Para testing.
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  testID?: string;
}

/**
 * Controles de paginación accesibles y responsivos.
 * - Botones: Primera, Anterior, Números, Siguiente, Última.
 * - Se adapta a tema claro/oscuro y color de acento dinámico.
 * - No renderiza nada si totalPages <= 1.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  testID = 'pagination',
}) => {
  const { mode, colors } = useTheme();
  const { settings } = useSettings();
  const accentColor = mode === 'dark'
    ? ACCENT_COLOR_MAP[settings.accentColor]?.dark
    : ACCENT_COLOR_MAP[settings.accentColor]?.light;

  const pages = useMemo((): (number | 'ellipsis')[] => {
    if (totalPages <= 1) return [];
    const result: (number | 'ellipsis')[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    if (start > 1) {
      result.push(1);
      if (start > 2) result.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) result.push('ellipsis');
      result.push(totalPages);
    }

    return result;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Si solo hay 1 página, no mostrar paginación
  if (totalPages <= 1) return null;

  const createPageButton = (
    page: number,
    isActive: boolean,
    label?: string,
  ) => (
    <TouchableOpacity
      key={`page-${page}`}
      onPress={() => onPageChange(page)}
      disabled={isActive}
      style={[
        styles.pageButton,
        isActive && styles.pageButtonActive,
      ]}
      accessible
      accessibilityLabel={label ?? `Página ${page}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      testID={`${testID}-page-${page}`}
    >
      <Text
        style={[
          styles.pageText,
          isActive && styles.pageTextActive,
        ]}
      >
        {label ?? page}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    pageButton: {
      minWidth: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pageButtonActive: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    pageText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    pageTextActive: {
      color: colors.textOnAccent,
    },
    ellipsis: {
      paddingHorizontal: 8,
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    info: {
      marginLeft: 12,
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container} testID={testID} accessibilityLabel="Paginación">
      {createPageButton(1, currentPage === 1, '««')}
      {createPageButton(currentPage - 1, currentPage === 1, '«')}

      {pages.map((item, idx) =>
        item === 'ellipsis' ? (
          <Text key={`ellipsis-${idx}`} style={styles.ellipsis}>
            …
          </Text>
        ) : (
          createPageButton(item, currentPage === item)
        ),
      )}

      {createPageButton(currentPage + 1, currentPage === totalPages, '»')}
      {createPageButton(totalPages, currentPage === totalPages, '»')}

      <Text style={styles.info} accessibilityLiveRegion="polite">
        Página {currentPage} de {totalPages}
      </Text>
    </View>
  );
};