import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

type NotificationType = "success" | "error" | "warning";

type NotificationState = {
  visible: boolean;
  message: string;
  type: NotificationType;
};

type NotificationContextData = {
  notify: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NotificationState>({
    visible: false,
    message: "",
    type: "success",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slide = useRef(new Animated.Value(-100)).current;

  const notify = (message: string, type: NotificationType = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ visible: true, message, type });
    Animated.timing(slide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== "web",
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slide, {
        toValue: -100,
        duration: 200,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        setState((prev) => ({ ...prev, visible: false }));
      });
    }, 2500);
  };

  const backgroundColor = useMemo(() => {
    if (state.type === "error") return "#dc2626";
    if (state.type === "warning") return "#f59e0b";
    return "#10b981";
  }, [state.type]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {state.visible && (
        <Animated.View style={[styles.toastWrap, { transform: [{ translateY: slide }] }]}>
          <View style={[styles.toast, { backgroundColor }]}>
            <Text style={styles.toastText}>{state.message}</Text>
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification deve ser usado dentro de NotificationProvider.");
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    maxWidth: "92%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)" as any }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 10,
        }),
    elevation: 8,
  },
  toastText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
