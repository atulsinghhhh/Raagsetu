import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user } = useAuth();

  // If we are at the root, redirect based on auth status
  if (user) {
    return <Redirect href="/(app)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}

