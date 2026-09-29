import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar } from '../components/BottomBar';
import { ProfileGridPage } from '../components/ProfileGridPage';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs } from '../components/ProfileTabs';
import { TopBar } from '../components/TopBar';
import { usePaginatedPhotos } from '../hooks/usePaginatedPhotos';
import { useProfilePager } from '../hooks/use-profile-pager';
import { TAB_HEIGHT, TAB_KEYS } from '../constants/profile-tabs';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export function ProfilePagerDemoScreen() {
  const insets = useSafeAreaInsets();
  const [profileHeight, setProfileHeight] = useState(0);
  const {
    pagerRef, attachListRefs, activeTab, activePageIndex, pagePosition, collapseY,
    offsets, maxOffsets, requestedOffsets, overlayScroll,
    synchronizeInactivePages, selectTab, selectPage, pageScrollHandler,
  } = useProfilePager(profileHeight);

  // The three requests/hooks stay mounted. Each tab therefore keeps its own
  // data, pagination state and loading state while the user moves between pages.
  const postsFeed = usePaginatedPhotos('posts');
  const reelsFeed = usePaginatedPhotos('reels');
  const taggedFeed = usePaginatedPhotos('tagged');

  const feeds = { posts: postsFeed, reels: reelsFeed, tagged: taggedFeed };

  const topInset = profileHeight + TAB_HEIGHT;

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -Math.min(collapseY.value, profileHeight),
      },
    ],
  }));

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
            onPageSelected={(event) => selectPage(event.nativeEvent.position)}
          >
            {TAB_KEYS.map((tab, index) => {
              const offsetY = offsets[index];
              const maxOffsetY = maxOffsets[index];
              const requestedY = requestedOffsets[index];
              const listRef = attachListRefs[index];
              if (!offsetY || !maxOffsetY || !requestedY || !listRef) return null;

              return (
                <View key={tab} style={styles.page} collapsable={false}>
                  <ProfileGridPage
                    tab={tab}
                    pageIndex={index}
                    feed={feeds[tab]}
                    topInset={topInset}
                    collapsePoint={profileHeight}
                    listRef={listRef}
                    requestedY={requestedY}
                    offsetY={offsetY}
                    maxOffsetY={maxOffsetY}
                    overlayScroll={overlayScroll.state}
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
        <GestureDetector gesture={overlayScroll.gesture}>
          <Animated.View
            collapsable={false}
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
            {profileHeight > 0 ? (
              <ProfileTabs
                activeTab={activeTab}
                onChange={selectTab}
                pagePosition={pagePosition}
              />
            ) : null}
          </Animated.View>
        </GestureDetector>
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
});
