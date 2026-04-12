import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { router, Stack } from "expo-router";
import { useEffect } from "react";

function RootNav() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/(app)/home");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  );
}
