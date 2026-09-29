import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
} from '@shopify/flash-list';
import type { ReactElement, Ref } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  type AnimatedProps,
  type SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { GRID_COLUMNS, TAB_HEIGHT } from '../constants/profile-tabs';
import { minimumGridFooter } from '../utils/profile-scroll';
import type { OverlayScrollState } from '../hooks/use-profile-overlay-scroll';
import type { PaginatedPhotoFeed } from '../hooks/usePaginatedPhotos';
import type { FeedPhoto, TabKey } from '../types/profile';
import { PhotoCell } from './PhotoCell';

// FlashList is generic, so we preserve its generic props after wrapping it with Reanimated.
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as <T>(
  props: AnimatedProps<
    FlashListProps<T> & {
      ref?: Ref<FlashListRef<T>>;
    }
  >,
) => ReactElement;

interface ProfileGridPageProps {
  tab: TabKey;
  pageIndex: number;
  feed: PaginatedPhotoFeed;
  topInset: number;
  collapsePoint: number;
  listRef: Ref<FlashListRef<FeedPhoto>>;
  offsetY: SharedValue<number>;
  maxOffsetY: SharedValue<number>;
  requestedY: SharedValue<number>;
  overlayScroll: OverlayScrollState;
  activePageIndex: SharedValue<number>;
  collapseY: SharedValue<number>;
}

export function ProfileGridPage({
  tab,
  pageIndex,
  feed,
  topInset,
  collapsePoint,
  listRef,
  offsetY,
  maxOffsetY,
  requestedY,
  overlayScroll,
  activePageIndex,
  collapseY,
}: ProfileGridPageProps) {
  const animatedRef = useAnimatedRef<FlashListRef<FeedPhoto>>();
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const { page: overlayPage, offset: overlayOffset } = overlayScroll;

  const attachListRef = useCallback((ref: FlashListRef<FeedPhoto> | null) => {
    animatedRef(ref);
    if (typeof listRef === 'function') listRef(ref);
    else if (listRef) listRef.current = ref;
  }, [animatedRef, listRef]);

  useAnimatedReaction(
    () => overlayPage.value === pageIndex && activePageIndex.value === pageIndex
      ? Math.max(0, Math.min(overlayOffset.value, maxOffsetY.value))
      : null,
    (targetY) => {
      if (targetY !== null) scrollTo(animatedRef, 0, targetY, false);
    },
  );

  useAnimatedReaction(
    () => requestedY.value >= 0 && maxOffsetY.value >= collapsePoint - 1
      ? Math.min(requestedY.value, maxOffsetY.value)
      : null,
    (targetY) => {
      if (targetY === null) return;
      if (Math.abs(offsetY.value - targetY) <= 1) {
        // A no-op scroll need not emit another native event.
        requestedY.value = -1;
        if (activePageIndex.value === pageIndex) {
          collapseY.value = Math.min(offsetY.value, collapsePoint);
        }
      } else {
        scrollTo(animatedRef, 0, targetY, false);
      }
    },
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        // A touch in the actual grid takes over from overlay-generated inertia.
        cancelAnimation(overlayOffset);
        overlayPage.value = -1;
        requestedY.value = -1;
      },
      onScroll: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        offsetY.value = y;
        if (requestedY.value >= 0 && maxOffsetY.value >= collapsePoint - 1 &&
            Math.abs(y - Math.min(requestedY.value, maxOffsetY.value)) <= 1) {
          requestedY.value = -1;
        }

        // Only the visible page is allowed to drive the shared profile header.
        // A pending request must never prevent a real scroll from moving it.
        // Inactive pages can still be moved programmatically for synchronization.
        if (activePageIndex.value === pageIndex) {
          collapseY.value = Math.min(y, collapsePoint);
        }
      },
    },
    [collapsePoint, pageIndex],
  );

  const footer = useMemo(() => {
    if (feed.isInitialLoading || feed.isLoadingMore) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      );
    }

    if (feed.error) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{feed.error}</Text>
          <Text style={styles.helpText}>Tire vers le bas pour réessayer.</Text>
        </View>
      );
    }

    if (!feed.hasMore) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.helpText}>Fin du flux de démonstration.</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }, [
    feed.error,
    feed.hasMore,
    feed.isInitialLoading,
    feed.isLoadingMore,
  ]);

  return (
    <AnimatedFlashList
      ref={attachListRef}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        viewportHeight.current = height;
        setViewport((current) => current.width === width && current.height === height
          ? current : { width, height });
        maxOffsetY.value = Math.max(0, contentHeight.current - viewportHeight.current);
      }}
      onContentSizeChange={(_width, height) => {
        contentHeight.current = height;
        maxOffsetY.value = viewportHeight.current > 0
          ? Math.max(0, height - viewportHeight.current) : 0;
      }}
      data={feed.photos}
      renderItem={({ item }) => <PhotoCell photo={item} tab={tab} />}
      keyExtractor={(item) => item.key}
      numColumns={GRID_COLUMNS}
      getItemType={() => 'photo'}
      contentContainerStyle={{ paddingTop: topInset }}
      maintainVisibleContentPosition={{ disabled: true }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.7}
      refreshing={feed.isRefreshing}
      onRefresh={feed.refresh}
      progressViewOffset={topInset}
      ListFooterComponent={
        <View style={{ minHeight: minimumGridFooter(
          feed.photos.length, viewport.width, viewport.height, TAB_HEIGHT, GRID_COLUMNS,
        ) }}>
          {footer}
        </View>
      }
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
    />
  );
}

const styles = StyleSheet.create({
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
