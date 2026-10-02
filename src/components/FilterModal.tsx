import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Campos disponibles para filtrar/buscar.
 */
export type FilterField = 'titulo' | 'descripcion' | 'fecha' | 'hora' | 'prioridad';

export interface FilterOption {
  key: FilterField;
  label: string;
  icon: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { key: 'titulo', label: 'Nombre (Título)', icon: 'text-outline' },
  { key: 'descripcion', label: 'Descripción', icon: 'document-text-outline' },
  { key: 'fecha', label: 'Fecha', icon: 'calendar-outline' },
  { key: 'hora', label: 'Hora', icon: 'time-outline' },
  { key: 'prioridad', label: 'Prioridad', icon: 'flag-outline' },
];

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedField: FilterField;
  onSelectField: (field: FilterField) => void;
  testID?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedField,
  onSelectField,
  testID = 'filter-modal',
}) => {
  const { mode } = useTheme();

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 10,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#333333' : '#EEEEEE',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
    },
    closeButton: {
      padding: 8,
    },
    closeIcon: {
      fontSize: 24,
      color: mode === 'dark' ? '#AAAAAA' : '#757575',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? '#2C2C2C' : '#F0F0F0',
    },
    optionIcon: {
      fontSize: 22,
      color: mode === 'dark' ? '#00BFA6' : '#00897B',
      marginRight: 16,
      width: 28,
      textAlign: 'center',
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
    },
    checkIcon: {
      fontSize: 22,
      color: mode === 'dark' ? '#00BFA6' : '#00897B',
    },
    cancelButton: {
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: mode === 'dark' ? '#DDDDDD' : '#333333',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable onPress={onClose} style={styles.overlay} testID={`${testID}-overlay`}>
        <View style={styles.container} testID={`${testID}-container`}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtrar por</Text>
            <Pressable onPress={onClose} style={styles.closeButton} testID={`${testID}-close`}>
              <Ionicons name="close-outline" size={24} color={styles.closeIcon.color} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={styles.option}
                onPress={() => {
                  onSelectField(option.key);
                  onClose();
                }}
                testID={`${testID}-option-${option.key}`}
                accessibilityLabel={`Filtrar por ${option.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedField === option.key }}
              >
                <Ionicons name={option.icon as any} size={22} color={styles.optionIcon.color} style={styles.optionIcon} />
                <Text style={styles.optionText}>{option.label}</Text>
                {selectedField === option.key && (
                  <Ionicons name="checkmark-circle" size={22} color={styles.checkIcon.color} style={styles.checkIcon} />
                )}
              </Pressable>
            ))}

            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              testID={`${testID}-cancel`}
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};