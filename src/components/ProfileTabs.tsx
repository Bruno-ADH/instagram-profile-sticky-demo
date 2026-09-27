import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { TabKey } from '../types/profile';

const tabs: Array<{ key: TabKey; icon: string; label: string }> = [
  { key: 'posts', icon: '▦', label: 'Publications' },
  { key: 'reels', icon: '▶', label: 'Reels' },
  { key: 'tagged', icon: '♙', label: 'Identifié' },
];

interface ProfileTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  pagePosition?: SharedValue<number>;
}

export function ProfileTabs({ activeTab, onChange, pagePosition }: ProfileTabsProps) {
  const tabWidth = useSharedValue(0);
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const indicatorStyle = useAnimatedStyle(() => {
    // The original screen has no pager; retain its tap-based selection.
    const position = Math.max(
      0,
      Math.min(pagePosition?.value ?? activeIndex, tabs.length - 1),
    );
    return {
      width: Math.max(0, tabWidth.value - 36),
      transform: [{ translateX: position * tabWidth.value }],
    };
  });

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        tabWidth.value = event.nativeEvent.layout.width / tabs.length;
      }}
    >
      {tabs.map((tab, index) => {
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
            <TabIcon
              icon={tab.icon}
              index={index}
              activeIndex={activeIndex}
              pagePosition={pagePosition}
            />
          </Pressable>
        );
      })}
      <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
    </View>
  );
}

function TabIcon({
  icon,
  index,
  activeIndex,
  pagePosition,
}: {
  icon: string;
  index: number;
  activeIndex: number;
  pagePosition?: SharedValue<number>;
}) {
  const iconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.min(1, Math.abs((pagePosition?.value ?? activeIndex) - index)),
      [0, 1],
      ['#111', '#777'],
    ),
  }));

  return <Animated.Text style={[styles.icon, iconStyle]}>{icon}</Animated.Text>;
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
  indicator: {
    position: 'absolute',
    left: 18,
    bottom: 0,
    height: 1.5,
    backgroundColor: '#111',
  },
});
