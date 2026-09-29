import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfilePagerDemoScreen } from './src/screens/ProfilePagerDemoScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProfilePagerDemoScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
