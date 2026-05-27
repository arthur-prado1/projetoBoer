import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../services/connectionFirebase";
import { colors } from "../theme/colors";

export default function LoginUser({ navigation }: any) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [erroEmail, setErroEmail] = useState<string>("");
  const [erroPassword, setErroPassword] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");

  function validarLogin(): void {
    let valido = true;

    if (!email.trim()) {
      setErroEmail("Digite seu email");
      valido = false;
    } else {
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailValido.test(email)) {
        setErroEmail("Email inválido");
        valido = false;
      } else {
        setErroEmail("");
      }
    }

    if (!password.trim()) {
      setErroPassword("Digite sua senha");
      valido = false;
    } else {
      setErroPassword("");
    }

    if (valido) {
      login();
    }
  }

  async function login(): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("Dashboard");
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(error.message);
      } else {
        Alert.alert("Erro", error.message);
      }

      setMensagem("Erro ao realizar login");
    }
  }

  const formularioValido = email.trim() !== "" && password.trim() !== "";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.wrapper}>
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>Acesso</Text>
        </View>

        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Entre com seu e-mail e senha</Text>

        <View style={styles.card}>
          {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, erroEmail ? styles.inputErro : null]}
            placeholder="Digite seu e-mail"
            placeholderTextColor={colors.textSoft}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text: string) => setEmail(text)}
          />
          {erroEmail ? <Text style={styles.erro}>{erroEmail}</Text> : null}

          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={[styles.input, erroPassword ? styles.inputErro : null]}
            placeholder="Digite sua senha"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            value={password}
            onChangeText={(text: string) => setPassword(text)}
          />
          {erroPassword ? <Text style={styles.erro}>{erroPassword}</Text> : null}

          <TouchableOpacity
            style={[styles.button, !formularioValido && styles.buttonDesabilitado]}
            disabled={!formularioValido}
            onPress={validarLogin}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate("RegisterUser")}
          >
            <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  wrapper: {
    width: "100%",
  },

  topBadge: {
    alignSelf: "center",
    backgroundColor: colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 18,
  },

  topBadgeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  mensagem: {
    color: colors.danger,
    marginBottom: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },

  input: {
    width: "100%",
    backgroundColor: colors.inputBg,
    color: colors.text,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inputErro: {
    borderColor: colors.danger,
  },

  erro: {
    color: colors.danger,
    marginTop: 6,
    fontSize: 12,
  },

  button: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  buttonDesabilitado: {
    backgroundColor: "#475569",
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  linkContainer: {
    marginTop: 18,
    alignItems: "center",
  },

  linkText: {
    color: colors.textSoft,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});