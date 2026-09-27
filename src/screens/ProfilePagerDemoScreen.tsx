import type { FlashListRef } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView, { type PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import Animated, {
  useAnimatedStyle,
  useEvent,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar } from '../components/BottomBar';
import { ProfileGridPage } from '../components/ProfileGridPage';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs } from '../components/ProfileTabs';
import { TopBar } from '../components/TopBar';
import { usePaginatedPhotos } from '../hooks/usePaginatedPhotos';
import type { FeedPhoto, TabKey } from '../types/profile';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
const TAB_HEIGHT = 48;
const TAB_KEYS = ['posts', 'reels', 'tagged'] as const satisfies readonly TabKey[];

export function ProfilePagerDemoScreen() {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [profileHeight, setProfileHeight] = useState(0);

  // The three requests/hooks stay mounted. Each tab therefore keeps its own
  // data, pagination state and loading state while the user moves between pages.
  const postsFeed = usePaginatedPhotos('posts');
  const reelsFeed = usePaginatedPhotos('reels');
  const taggedFeed = usePaginatedPhotos('tagged');

  const feeds = useMemo(
    () => ({
      posts: postsFeed,
      reels: reelsFeed,
      tagged: taggedFeed,
    }),
    [postsFeed, reelsFeed, taggedFeed],
  );

  const listRefs = useRef<Record<TabKey, FlashListRef<FeedPhoto> | null>>({
    posts: null,
    reels: null,
    tagged: null,
  });

  // No React state is updated while vertically scrolling.
  // Reanimated keeps these values on the UI runtime.
  const postsY = useSharedValue(0);
  const reelsY = useSharedValue(0);
  const taggedY = useSharedValue(0);
  const collapseY = useSharedValue(0);
  const activePageIndex = useSharedValue(0);
  const pagePosition = useSharedValue(0);

  // Follow native progress on the UI runtime, including cancelled swipes
  // and transitions started by tapping a tab. No per-frame React updates.
  const pageScrollHandler = useEvent<PagerViewOnPageScrollEvent>(
    (event) => {
      'worklet';
      if (event.eventName.endsWith('onPageScroll')) {
        pagePosition.value = event.position + event.offset;
      }
    },
    ['onPageScroll'],
  );

  const offsets = useMemo(
    () => [postsY, reelsY, taggedY],
    [postsY, reelsY, taggedY],
  );

  const topInset = profileHeight + TAB_HEIGHT;

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -Math.min(collapseY.value, profileHeight),
      },
    ],
  }));

  const tabsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -Math.min(collapseY.value, profileHeight),
      },
    ],
  }));

  /**
   * Gives a target page an offset compatible with the currently visible header.
   *
   * - Header still visible -> both pages use exactly the same offset.
   * - Header already collapsed -> target page is never allowed below the
   *   collapse point, but a deeper saved scroll position is preserved.
   */
  const synchronizePage = useCallback(
    (targetIndex: number, sourceIndex = activePageIndex.value) => {
      if (profileHeight <= 0 || targetIndex === sourceIndex) return;

      const sourceOffset = offsets[sourceIndex];
      const targetOffset = offsets[targetIndex];
      const targetTab = TAB_KEYS[targetIndex];

      if (!sourceOffset || !targetOffset || !targetTab) return;

      const sourceY = sourceOffset.value;
      const targetSavedY = targetOffset.value;
      const targetY =
        sourceY < profileHeight
          ? sourceY
          : Math.max(targetSavedY, profileHeight);

      targetOffset.value = targetY;
      listRefs.current[targetTab]?.scrollToOffset({
        offset: targetY,
        animated: false,
      });
    },
    [activePageIndex, offsets, profileHeight],
  );

  // Before the neighbouring page becomes visible during a horizontal drag,
  // put both inactive lists in a vertically compatible position. This avoids
  // the classic white gap / header jump during the swipe.
  const synchronizeInactivePages = useCallback(() => {
    const sourceIndex = activePageIndex.value;

    for (let index = 0; index < TAB_KEYS.length; index += 1) {
      if (index !== sourceIndex) synchronizePage(index, sourceIndex);
    }
  }, [activePageIndex, synchronizePage]);

  const selectTab = useCallback(
    (nextTab: TabKey) => {
      const nextIndex = TAB_KEYS.indexOf(nextTab);
      const currentIndex = activePageIndex.value;

      if (nextIndex === currentIndex) {
        const currentOffset = offsets[currentIndex];
        if (!currentOffset) return;

        const currentY = currentOffset.value;
        const targetY = currentY >= profileHeight ? profileHeight : 0;

        currentOffset.value = targetY;
        listRefs.current[nextTab]?.scrollToOffset({
          offset: targetY,
          animated: true,
        });
        return;
      }

      synchronizePage(nextIndex, currentIndex);
      pagerRef.current?.setPage(nextIndex);
    },
    [activePageIndex, offsets, profileHeight, synchronizePage],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <TopBar />

      <View style={styles.content}>
        {profileHeight > 0 ? (
          <AnimatedPagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            offscreenPageLimit={2}
            onPageScroll={pageScrollHandler}
            onPageScrollStateChanged={(event) => {
              if (event.nativeEvent.pageScrollState === 'dragging') {
                synchronizeInactivePages();
              }
            }}
            onPageSelected={(event) => {
              const nextIndex = event.nativeEvent.position;
              const nextTab = TAB_KEYS[nextIndex];
              const nextOffset = offsets[nextIndex];
              if (!nextTab || !nextOffset) return;

              activePageIndex.value = nextIndex;
              collapseY.value = Math.min(nextOffset.value, profileHeight);
              setActiveTab(nextTab);
            }}
          >
            {TAB_KEYS.map((tab, index) => {
              const offsetY = offsets[index];
              if (!offsetY) return null;

              return (
                <View key={tab} style={styles.page} collapsable={false}>
                  <ProfileGridPage
                    tab={tab}
                    pageIndex={index}
                    feed={feeds[tab]}
                    topInset={topInset}
                    collapsePoint={profileHeight}
                    listRef={(ref) => {
                      listRefs.current[tab] = ref;
                    }}
                    offsetY={offsetY}
                    activePageIndex={activePageIndex}
                    collapseY={collapseY}
                  />
                </View>
              );
            })}
          </AnimatedPagerView>
        ) : (
          <View style={styles.pager} />
        )}

        {/*
          Shared overlay: it exists only once, outside PagerView.
          Therefore only the grid moves horizontally during a swipe.
        */}
        <Animated.View
          pointerEvents="box-none"
          style={[styles.profileOverlay, headerStyle]}
        >
          <ProfileHeader
            onLayout={(event) => {
              const nextHeight = Math.round(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== profileHeight) {
                setProfileHeight(nextHeight);
              }
            }}
          />
        </Animated.View>

        {profileHeight > 0 ? (
          <Animated.View
            style={[
              styles.tabsOverlay,
              { top: profileHeight },
              tabsStyle,
            ]}
          >
            <ProfileTabs
              activeTab={activeTab}
              onChange={selectTab}
              pagePosition={pagePosition}
            />
          </Animated.View>
        ) : null}
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
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#fff',
  },
  tabsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    zIndex: 30,
    backgroundColor: '#fff',
  },
});
