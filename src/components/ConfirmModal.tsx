import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Props del ConfirmModal.
 * @property visible - Controla visibilidad del modal.
 * @property title - Título del modal.
 * @property message - Mensaje descriptivo.
 * @property onConfirm - Callback al confirmar (acción destructiva).
 * @property onCancel - Callback al cancelar.
 * @property confirmText - Texto del botón confirmar (default: "Eliminar").
 * @property cancelText - Texto del botón cancelar (default: "Cancelar").
 * @property isDestructive - Si true, el botón confirmar es rojo (default: true).
 * @property testID - Para testing.
 */
export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  testID?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDestructive = true,
  testID = 'confirm-modal',
}) => {
  const { mode } = useTheme();

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modal: {
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: mode === 'dark' ? '#DDDDDD' : '#333333',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
    },
    button: {
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: isDestructive
        ? mode === 'dark'
          ? '#CF6679'
          : '#E53935'
        : mode === 'dark'
        ? '#BB86FC'
        : '#6200EE',
    },
    buttonSecondary: {
      backgroundColor: mode === 'dark' ? '#2C2C2C' : '#F5F5F5',
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#3A3A3A' : '#DDDDDD',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    buttonTextSecondary: {
      color: mode === 'dark' ? '#DDDDDD' : '#333333',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
      testID={testID}
    >
      <TouchableOpacity onPress={onCancel} style={styles.overlay} testID={`${testID}-overlay`}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onCancel}
              testID={`${testID}-cancel`}
              accessibilityLabel="Cancelar"
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onConfirm}
              testID={`${testID}-confirm`}
              accessibilityLabel={confirmText}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};