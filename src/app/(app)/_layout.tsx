import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Your Library",
            tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
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
        <Tabs.Screen
          name="likedSongs"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="PlaylistDetails"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="FriendProfile"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="joinPlaylist"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="updateProfile"
          options={{ href: null }}
        />
      </Tabs>

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
