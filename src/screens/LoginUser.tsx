import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
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
import { auth, database } from "../services/connectionFirebase";
import { colors } from "../theme/colors";

export default function RegisterUser({ navigation }: any) {
  const [name, setName] = useState<string>("");
  const [cellphone, setCellphone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [erroName, setErroName] = useState<string>("");
  const [erroCellphone, setErroCellphone] = useState<string>("");
  const [erroEmail, setErroEmail] = useState<string>("");
  const [erroPassword, setErroPassword] = useState<string>("");

  const [mensagem, setMensagem] = useState<string>("");

  function formatarCellphone(text: string): string {
    let cleaned = text.replace(/\D/g, "");

    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);

    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  function validarCadastro(): void {
    let valido = true;

    const nomeValido = /^[A-Za-zÀ-ÿ\s]+$/;
    const celularValido = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
    const emailValido = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    const senhaForte = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/;

    if (!name.trim()) {
      setErroName("Digite seu nome");
      valido = false;
    } else if (!nomeValido.test(name)) {
      setErroName("Nome inválido (sem números)");
      valido = false;
    } else {
      setErroName("");
    }

    if (!cellphone.trim()) {
      setErroCellphone("Digite seu celular");
      valido = false;
    } else if (!celularValido.test(cellphone)) {
      setErroCellphone("Formato inválido (11) 91234-5678");
      valido = false;
    } else {
      setErroCellphone("");
    }

    if (!email.trim()) {
      setErroEmail("Digite seu email");
      valido = false;
    } else if (!emailValido.test(email)) {
      setErroEmail("Email inválido");
      valido = false;
    } else {
      setErroEmail("");
    }

    if (!password.trim()) {
      setErroPassword("Digite sua senha");
      valido = false;
    } else if (!senhaForte.test(password)) {
      setErroPassword("Senha deve ter 6+ caracteres, com maiúscula, minúscula e número");
      valido = false;
    } else {
      setErroPassword("");
    }

    if (valido) {
      register();
    }
  }

  async function register(): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await set(ref(database, "users/" + user.uid), {
          uid: user.uid,
          name,
          cellphone,
          email,
          createdAt: new Date().toISOString(),
        });
      }

      if (Platform.OS === "web") {
        alert("Usuário cadastrado com sucesso!");
      } else {
        Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      }

      setMensagem("Usuário cadastrado com sucesso!");

      setName("");
      setCellphone("");
      setEmail("");
      setPassword("");

      setTimeout(() => navigation.navigate("LoginUser"), 1500);
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(error.message);
      } else {
        Alert.alert("Erro", error.message);
      }

      setMensagem("Erro ao cadastrar usuário");
    }
  }

  const formularioValido =
    name.trim() !== "" &&
    cellphone.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.wrapper}>
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>Cadastro</Text>
        </View>

        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Preencha seus dados para se cadastrar</Text>

        <View style={styles.card}>
          {mensagem ? (
            <Text
              style={[
                styles.mensagem,
                mensagem.includes("sucesso") ? styles.sucesso : styles.erroMensagem,
              ]}
            >
              {mensagem}
            </Text>
          ) : null}

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={[styles.input, erroName ? styles.inputErro : null]}
            placeholder="Digite seu nome completo"
            placeholderTextColor={colors.textSoft}
            value={name}
            onChangeText={(text) => setName(text.replace(/[^A-Za-zÀ-ÿ\s]/g, ""))}
          />
          {erroName ? <Text style={styles.erro}>{erroName}</Text> : null}

          <Text style={[styles.label, { marginTop: 12 }]}>Celular</Text>
          <TextInput
            style={[styles.input, erroCellphone ? styles.inputErro : null]}
            placeholder="(11) 91234-5678"
            placeholderTextColor={colors.textSoft}
            keyboardType="phone-pad"
            value={cellphone}
            onChangeText={(text) => setCellphone(formatarCellphone(text))}
          />
          {erroCellphone ? <Text style={styles.erro}>{erroCellphone}</Text> : null}

          <Text style={[styles.label, { marginTop: 12 }]}>E-mail</Text>
          <TextInput
            style={[styles.input, erroEmail ? styles.inputErro : null]}
            placeholder="Digite seu e-mail"
            placeholderTextColor={colors.textSoft}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          {erroEmail ? <Text style={styles.erro}>{erroEmail}</Text> : null}

          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={[styles.input, erroPassword ? styles.inputErro : null]}
            placeholder="Crie uma senha"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          {erroPassword ? <Text style={styles.erro}>{erroPassword}</Text> : null}

          <TouchableOpacity
            style={[styles.button, !formularioValido && styles.buttonDesabilitado]}
            disabled={!formularioValido}
            onPress={validarCadastro}
          >
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate("LoginUser")}
          >
            <Text style={styles.linkText}>Já tem conta? Entrar</Text>
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
    fontSize: 30,
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
    marginBottom: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  sucesso: {
    color: colors.success,
  },

  erroMensagem: {
    color: colors.danger,
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