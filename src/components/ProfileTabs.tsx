import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TabKey } from '../types/profile';

const tabs: Array<{ key: TabKey; icon: string; label: string }> = [
  { key: 'posts', icon: '▦', label: 'Publications' },
  { key: 'reels', icon: '▶', label: 'Reels' },
  { key: 'tagged', icon: '♙', label: 'Identifié' },
];

interface ProfileTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 22,
    color: '#777',
  },
  iconActive: {
    color: '#111',
  },
  indicator: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 0,
    height: 1.5,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: '#111',
  },
});
