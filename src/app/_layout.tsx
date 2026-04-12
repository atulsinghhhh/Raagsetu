import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { setupAudio } from "@/lib/audioManager";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

function RootNav() {
  const { user } = useAuth();
  const [playerReady, setPlayerReady] = useState(false);

  // Initialise audio service once on mount
  useEffect(() => {
    setupAudio()
      .then(() => setPlayerReady(true))
      .catch((err) => {
        console.error("Audio setup failed:", err);
        setPlayerReady(true);
      });
  }, []);

  useEffect(() => {
    if (!playerReady) return;

    if (user) {
      router.replace("/(app)/home");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, playerReady]);

  if (!playerReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a14" }}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

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
