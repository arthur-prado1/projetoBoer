import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, updateProfile, User } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useNotification } from "../../src/context/NotificationContext";
import { auth, database } from "../../src/services/connectionFirebase";

export default function ProfileUser() {
  const router = useRouter();
  const { notify } = useNotification();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const [name, setName] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setEmail(currentUser.email || "");

    const userRef = ref(database, "users/" + currentUser.uid);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setName(data.name || currentUser.displayName || "");
        setCellphone(formatCellphone(data.cellphone || ""));
      } else {
        setName(currentUser.displayName || "");
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  function formatCellphone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleUpdate() {
    if (!name.trim() || !cellphone.trim()) {
      notify("Preencha todos os campos.", "warning");
      return;
    }

    if (!currentUser) {
      notify("Usuario nao autenticado.", "error");
      return;
    }

    try {
      const formattedCellphone = formatCellphone(cellphone);

      await update(ref(database, "users/" + currentUser.uid), {
        name: name.trim(),
        cellphone: formattedCellphone,
      });

      await updateProfile(currentUser, {
        displayName: name.trim(),
      });

      setCellphone(formattedCellphone);
      notify("Perfil alterado com sucesso!", "success");
    } catch (error: any) {
      if (error?.code === "PERMISSION_DENIED") {
        notify("Sem permissao para atualizar perfil no Firebase (users/{uid}).", "error");
        return;
      }
      notify(`Nao foi possivel atualizar o perfil. ${error?.message || ""}`.trim(), "error");
    }
  }

  async function handleSair() {
    if (typeof globalThis.sessionStorage !== "undefined") {
      globalThis.sessionStorage.removeItem("boer-session-login");
    }
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#94a3b8"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        placeholderTextColor="#94a3b8"
        value={cellphone}
        onChangeText={(value) => setCellphone(formatCellphone(value))}
        keyboardType="phone-pad"
      />

      <TextInput
        style={[styles.input, styles.inputDisabled]}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        editable={false}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Salvar Alteracoes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSair} onPress={handleSair}>
        <Text style={styles.buttonSairText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: "#38bdf8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonSair: {
    borderWidth: 1.5,
    borderColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonSairText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});
