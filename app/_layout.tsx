import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { CartProvider } from "../src/context/CartContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { auth } from "../src/services/connectionFirebase";
import { registerPushForUser, subscribeNotificationListeners } from "../src/services/pushNotificationService";

function hasSessionLogin() {
  if (Platform.OS !== "web") return true;
  if (typeof globalThis.sessionStorage === "undefined") return true;
  return globalThis.sessionStorage.getItem("boer-session-login") === "true";
}

export default function RootLayout() {
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setLogado(!!user);
      setCarregando(false);

      if (user) {
        void registerPushForUser(user);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const unsubscribeListeners = subscribeNotificationListeners(() => {
      router.push("/(tabs)");
    });

    return () => unsubscribeListeners();
  }, [router]);

  useEffect(() => {
    if (carregando) return;

    const emTabs = segments[0] === "(tabs)";
    const emLogin = segments[0] === "login";
    const emRegister = segments[0] === "register";
    const emRotaPublica = emLogin || emRegister;
    const loginDaSessao = hasSessionLogin();

    if ((!logado || !loginDaSessao) && !emRotaPublica) {
      router.replace("/login");
    } else if (logado && loginDaSessao && !emTabs && !emRotaPublica) {
      router.replace("/(tabs)");
    }
  }, [logado, carregando, segments, router]);

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  return (
    <NotificationProvider>
      <CartProvider>
        <Slot />
      </CartProvider>
    </NotificationProvider>
  );
}
