import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "./store/auth-store";
import { LoginForm } from "./(components)/login-form";

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDriver = useAuthStore((s) => s.isDriver());
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Redirect based on role
      if (isDriver) {
        router.replace("/driver");
      } else {
        router.replace("/map");
      }
    }
  }, [isAuthenticated, isLoading, isDriver, router]);

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isAuthenticated ? <LoginForm /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
