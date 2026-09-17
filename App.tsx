import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfilePagerDemoScreen } from './src/screens/ProfilePagerDemoScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfilePagerDemoScreen />
    </SafeAreaProvider>
  );
}
