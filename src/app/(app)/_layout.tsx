import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Tabs } from "expo-router";
import MiniPlayer from "@/components/MiniPlayer";

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#141428",
            borderTopWidth: 1,
            borderTopColor: "#1e1e3a",
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: "#7c3aed",
          tabBarInactiveTintColor: "#5a5a8a",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
          }}
        />
        <Tabs.Screen
          name="player"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="queue"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      {/* Persistent MiniPlayer shown on every screen in this group */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a14",
  },
});
