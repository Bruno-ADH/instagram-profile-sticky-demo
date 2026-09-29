import type { FlashListRef } from '@shopify/flash-list';
import { useCallback, useMemo, useRef, useState } from 'react';
import PagerView, { type PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import { runOnUI, useEvent, useSharedValue } from 'react-native-reanimated';

import { TAB_KEYS } from '../constants/profile-tabs';
import type { FeedPhoto, TabKey } from '../types/profile';
import { synchronizedOffset } from '../utils/profile-scroll';
import { useProfileOverlayScroll } from './use-profile-overlay-scroll';

export function useProfilePager(profileHeight: number) {
  const pagerRef = useRef<PagerView>(null);
  const listRefs = useRef<Array<FlashListRef<FeedPhoto> | null>>([]);
  const attachListRefs = useMemo(() => TAB_KEYS.map((_, index) =>
    (ref: FlashListRef<FeedPhoto> | null) => { listRefs.current[index] = ref; },
  ), []);
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const activePageIndex = useSharedValue(0);
  const pagePosition = useSharedValue(0);
  const collapseY = useSharedValue(0);

  // These are observations, written only by native onScroll events.
  const postsY = useSharedValue(0);
  const reelsY = useSharedValue(0);
  const taggedY = useSharedValue(0);
  const offsets = useMemo(() => [postsY, reelsY, taggedY], [postsY, reelsY, taggedY]);
  const postsMaxY = useSharedValue(0);
  const reelsMaxY = useSharedValue(0);
  const taggedMaxY = useSharedValue(0);
  const maxOffsets = useMemo(
    () => [postsMaxY, reelsMaxY, taggedMaxY], [postsMaxY, reelsMaxY, taggedMaxY],
  );

  // A request survives until the list is laid out and confirms its position.
  // -1 means there is no synchronization waiting to be applied.
  const postsRequestedY = useSharedValue(-1);
  const reelsRequestedY = useSharedValue(-1);
  const taggedRequestedY = useSharedValue(-1);
  const requestedOffsets = useMemo(
    () => [postsRequestedY, reelsRequestedY, taggedRequestedY],
    [postsRequestedY, reelsRequestedY, taggedRequestedY],
  );
  const overlayScroll = useProfileOverlayScroll(
    activePageIndex, offsets, maxOffsets, requestedOffsets,
  );
  const stopOverlayScroll = overlayScroll.stop;

  const preparePages = useCallback(() => {
    'worklet';
    stopOverlayScroll();
    const sourceIndex = activePageIndex.value;
    const source = offsets[sourceIndex];
    if (!source || profileHeight <= 0) return;
    for (let index = 0; index < offsets.length; index += 1) {
      const saved = offsets[index];
      const requested = requestedOffsets[index];
      if (index !== sourceIndex && saved && requested) {
        requested.value = synchronizedOffset(source.value, saved.value, profileHeight);
      }
    }
  }, [activePageIndex, offsets, profileHeight, requestedOffsets, stopOverlayScroll]);

  const synchronizeInactivePages = useCallback(() => {
    runOnUI(preparePages)();
  }, [preparePages]);

  const selectTab = useCallback((nextTab: TabKey) => {
    runOnUI(stopOverlayScroll)();
    const nextIndex = TAB_KEYS.indexOf(nextTab);
    const currentIndex = activePageIndex.value;
    if (nextIndex === currentIndex) {
      const currentOffset = offsets[currentIndex];
      const requested = requestedOffsets[currentIndex];
      if (!currentOffset || !requested) return;
      requested.value = -1;
      listRefs.current[currentIndex]?.scrollToOffset({
        offset: currentOffset.value >= profileHeight ? profileHeight : 0,
        animated: true,
      });
      return;
    }
    // Also prepare intermediate pages for a tap from the first to the last tab.
    synchronizeInactivePages();
    pagerRef.current?.setPage(nextIndex);
  }, [activePageIndex, offsets, profileHeight, requestedOffsets, stopOverlayScroll, synchronizeInactivePages]);

  const selectPage = useCallback((nextIndex: number) => {
    const nextTab = TAB_KEYS[nextIndex];
    if (!nextTab) return;
    runOnUI((index: number) => {
      const actual = offsets[index];
      const requested = requestedOffsets[index];
      if (!actual || !requested) return;
      activePageIndex.value = index;
      // Keep the header steady until an outstanding native scroll is confirmed.
      if (requested.value < 0) collapseY.value = Math.min(actual.value, profileHeight);
    })(nextIndex);
    setActiveTab(nextTab);
  }, [activePageIndex, collapseY, offsets, profileHeight, requestedOffsets]);

  const pageScrollHandler = useEvent<PagerViewOnPageScrollEvent>((event) => {
    'worklet';
    if (event.eventName.endsWith('onPageScroll')) {
      pagePosition.value = event.position + event.offset;
      if (event.offset !== 0) stopOverlayScroll();
    }
  }, ['onPageScroll']);

  return {
    pagerRef, attachListRefs, activeTab, activePageIndex, pagePosition, collapseY,
    offsets, maxOffsets, requestedOffsets, overlayScroll,
    synchronizeInactivePages, selectTab, selectPage, pageScrollHandler,
  };
}
