import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../store/auth-store";
import { authApi } from "../(api)/auth";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Введите логин и пароль");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ username, password });
      setAuth(response.user, response.tokens.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Корпоративный транспорт</Text>

      <TextInput
        style={styles.input}
        placeholder="Логин"
        placeholderTextColor="#64748b"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="next"
        blurOnSubmit={false}
        editable={!isLoading}
        selectTextOnFocus={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
        }}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        returnKeyType="done"
        blurOnSubmit={true}
        editable={!isLoading}
        selectTextOnFocus={false}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Войти</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
