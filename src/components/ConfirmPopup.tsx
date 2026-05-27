import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ConfirmPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmPopup({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popup: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
  },
});
