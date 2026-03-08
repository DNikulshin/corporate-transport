import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "./store/auth-store";

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isDriver = useAuthStore((s) => s.isDriver());

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Navigate based on role
    if (isDriver) {
      router.replace("/driver");
    } else {
      router.replace("/map");
    }
  }, [isAuthenticated, isLoading, isDriver, router]);

  if (isLoading) {
    return null; // Show splash or loading
  }

  return null;
}
