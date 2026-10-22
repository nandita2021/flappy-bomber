import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Game } from './src/components/Game';
import { setupWebPage } from './src/platform/webSetup';

setupWebPage();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <Game />
    </SafeAreaProvider>
  );
}
