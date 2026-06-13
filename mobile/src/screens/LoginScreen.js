import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { API_CONFIG_WARNING, isApiConfigured } from "../config/env";
import { colors, shadow } from "../styles/theme";

export default function LoginScreen({ navigation }) {
  const { isAuthenticated, loading, error, handleLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace("AdminHome");
    }
  }, [isAuthenticated, navigation]);

  const submit = async () => {
    setLocalError("");

    if (!isApiConfigured) {
      setLocalError(API_CONFIG_WARNING);
      return;
    }

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      setLocalError("Ingresa usuario y contraseña.");
      return;
    }

    const success = await handleLogin(normalizedUsername, password);
    if (!success && !error) {
      setLocalError("No se pudo iniciar sesion.");
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Panel admin</Text>
        <Text style={styles.title}>Iniciar sesion</Text>
        <Text style={styles.subtitle}>
          Acceso reservado para administradores de Hotel Luxemburgo.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="admin"
            style={styles.input}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            style={styles.input}
          />

          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

          <Pressable
            style={[styles.primaryButton, loading && styles.disabledButton]}
            disabled={loading}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("Search")}>
          <Text style={styles.link}>Volver al booking publico</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    ...shadow,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  link: {
    color: colors.primaryDark,
    textAlign: "center",
    fontWeight: "700",
  },
});
