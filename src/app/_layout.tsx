import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { setupAudio } from "@/lib/audioManager";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Alert } from "react-native";
import * as Linking from "expo-linking";
import { acceptInvite } from "@/lib/utils/friendsHelpers";

function RootNav() {
  const { user } = useAuth();
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Safety Timeout: If initialization takes > 10s, force ready
    const timer = setTimeout(() => {
      if (!playerReady) {
        console.warn("RootNav: Initialization timeout - forcing ready");
        setPlayerReady(true);
      }
    }, 10000);

    setupAudio()
      .then(() => {
        console.log("RootNav: Audio setup complete");
        setPlayerReady(true);
      })
      .catch((err) => {
        console.error("RootNav: Audio setup failed:", err);
        setPlayerReady(true);
      });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!playerReady) return;

    // Debug check for critical envs
    console.log("RootNav: Auth check", { userExist: !!user, envExist: !!process.env.EXPO_PUBLIC_SUPABASE_URL });

    if (user) {
      router.replace("/(app)/home");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, playerReady]);

  useEffect(() => {
    if (!user) return;

    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.hostname === "invite" && parsed.queryParams?.token) {
        try {
          const res = await acceptInvite(parsed.queryParams.token as string);
          if (res === 'success') Alert.alert('Success', 'Friend added successfully!');
          else if (res === 'already_friends') Alert.alert('Info', 'You are already friends.');
          else if (res === 'self') Alert.alert('Oops', 'You cannot accept your own invite.');
          else Alert.alert('Error', 'Invite link expired or invalid.');
        } catch {
          Alert.alert('Error', 'Failed to verify invite link.');
        }
      }
    };

    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [user]);

  if (!playerReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0e0e0e" }}>
        <ActivityIndicator color="#c799ff" size="large" />
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
