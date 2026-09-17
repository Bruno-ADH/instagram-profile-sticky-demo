import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar } from '../components/BottomBar';
import { PhotoCell } from '../components/PhotoCell';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs } from '../components/ProfileTabs';
import { TopBar } from '../components/TopBar';
import { usePaginatedPhotos } from '../hooks/usePaginatedPhotos';
import type { ProfileListItem, TabKey } from '../types/profile';

const STICKY_TABS_INDEX = 1;
const TAB_KEYS: TabKey[] = ['posts', 'reels', 'tagged'];

export function ProfileDemoScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  // All three feeds stay alive in memory, so each tab keeps its own pagination.
  const postsFeed = usePaginatedPhotos('posts');
  const reelsFeed = usePaginatedPhotos('reels');
  const taggedFeed = usePaginatedPhotos('tagged');

  const feeds = {
    posts: postsFeed,
    reels: reelsFeed,
    tagged: taggedFeed,
  };
  const activeFeed = feeds[activeTab];

  const listRef = useRef<FlashListRef<ProfileListItem>>(null);
  const profileHeightRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const pendingOffsetRef = useRef<number | null>(null);
  const offsetsRef = useRef<Record<TabKey, number>>({
    posts: 0,
    reels: 0,
    tagged: 0,
  });

  const data = useMemo<ProfileListItem[]>(
    () => [
      { kind: 'profile', key: 'profile-header' },
      { kind: 'tabs', key: 'profile-tabs' },
      ...activeFeed.photos.map<ProfileListItem>((photo) => ({
        kind: 'photo',
        key: photo.key,
        photo,
      })),
    ],
    [activeFeed.photos],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      currentOffsetRef.current = y;
      offsetsRef.current[activeTab] = y;
    },
    [activeTab],
  );

  const changeTab = useCallback(
    (nextTab: TabKey) => {
      if (nextTab === activeTab) {
        // Instagram-like convenience: tap the selected tab to return to the grid start
        // while keeping the profile header collapsed if it is already collapsed.
        const collapsePoint = profileHeightRef.current;
        const target = currentOffsetRef.current >= collapsePoint ? collapsePoint : 0;
        listRef.current?.scrollToOffset({ offset: target, animated: true });
        return;
      }

      const currentY = currentOffsetRef.current;
      const collapsePoint = profileHeightRef.current;
      const savedTargetY = offsetsRef.current[nextTab];

      // Header synchronization rule:
      // 1. If the profile is still visible, keep exactly the same collapse amount.
      // 2. If it is already gone, never reopen it when changing tabs.
      // 3. If the target tab was previously scrolled deeper, restore that position.
      const targetY =
        currentY < collapsePoint
          ? currentY
          : Math.max(savedTargetY, collapsePoint);

      pendingOffsetRef.current = targetY;
      offsetsRef.current[nextTab] = targetY;
      currentOffsetRef.current = targetY;
      setActiveTab(nextTab);
    },
    [activeTab],
  );

  // Wait until React has swapped the tab data, then restore/synchronize its offset.
  useEffect(() => {
    const pendingOffset = pendingOffsetRef.current;
    if (pendingOffset == null || activeFeed.photos.length === 0) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: pendingOffset,
        animated: false,
      });
      pendingOffsetRef.current = null;
    });

    return () => cancelAnimationFrame(frame);
  }, [activeFeed.photos.length, activeTab]);

  const renderItem = useCallback(
    ({ item }: { item: ProfileListItem }) => {
      if (item.kind === 'profile') {
        return (
          <ProfileHeader
            onLayout={(event) => {
              profileHeightRef.current = event.nativeEvent.layout.height;
            }}
          />
        );
      }

      if (item.kind === 'tabs') {
        return <ProfileTabs activeTab={activeTab} onChange={changeTab} />;
      }

      return <PhotoCell photo={item.photo} tab={activeTab} />;
    },
    [activeTab, changeTab],
  );

  const footer = useMemo(() => {
    if (activeFeed.isInitialLoading || activeFeed.isLoadingMore) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      );
    }

    if (activeFeed.error) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{activeFeed.error}</Text>
          <Text style={styles.helpText}>Tire vers le bas pour réessayer.</Text>
        </View>
      );
    }

    if (!activeFeed.hasMore) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.helpText}>Fin du flux de démonstration.</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }, [
    activeFeed.error,
    activeFeed.hasMore,
    activeFeed.isInitialLoading,
    activeFeed.isLoadingMore,
  ]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <TopBar />

      <View style={styles.listArea}>
        <FlashList
          ref={listRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={3}
          getItemType={(item) => item.kind}
          overrideItemLayout={(layout, item) => {
            if (item.kind !== 'photo') layout.span = 3;
          }}
          stickyHeaderIndices={[STICKY_TABS_INDEX]}
          extraData={activeTab}
          maintainVisibleContentPosition={{ disabled: true }}
          onScroll={onScroll}
          scrollEventThrottle={64}
          onEndReached={activeFeed.loadMore}
          onEndReachedThreshold={0.7}
          refreshing={activeFeed.isRefreshing}
          onRefresh={activeFeed.refresh}
          ListFooterComponent={footer}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
        />
      </View>

      <BottomBar />
      <View style={{ height: insets.bottom, backgroundColor: '#fff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  messageBox: {
    minHeight: 90,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b42318',
    textAlign: 'center',
  },
  helpText: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  footerSpacer: {
    height: 24,
    backgroundColor: '#fff',
  },
});
