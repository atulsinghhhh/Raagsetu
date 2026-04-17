import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { setupAudio } from "@/lib/audioManager";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";
import { acceptInvite } from "@/lib/utils/friendsHelpers";

export function ErrorBoundary(props: any) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0e0e0e", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ color: "#ff4444", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>App Crash</Text>
      <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 20 }}>{props.error?.message}</Text>
      <Text onPress={() => props.retry()} style={{ color: "#c799ff", fontSize: 16 }}>Retry</Text>
    </View>
  );
}

function RootNav() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Safety Timeout for initialization
    const timer = setTimeout(() => {
        if (!isReady) setIsReady(true);
    }, 8000);

    setupAudio().finally(() => {
        setIsReady(true);
        clearTimeout(timer);
    });
  }, []);

  // Global Auth Guard
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (user && inAuthGroup) {
      // User is logged in but in auth routes (login/signup) -> Send to home
      router.replace("/(app)/home");
    } else if (!user && !inAuthGroup) {
      // User is not logged in and not in auth routes -> Send to login
      router.replace("/(auth)/login");
    }
  }, [user, segments, isReady]);

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

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [user]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0e0e0e" }}>
        <ActivityIndicator color="#c799ff" size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}


export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  );
}





