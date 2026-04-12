import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Handle the root component for Expo Router
export function App() {
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
