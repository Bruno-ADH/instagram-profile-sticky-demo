import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
} from '@shopify/flash-list';
import type { ReactElement, Ref } from 'react';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  type AnimatedProps,
  type SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

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
  activePageIndex,
  collapseY,
}: ProfileGridPageProps) {
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        offsetY.value = y;

        // Only the visible page is allowed to drive the shared profile header.
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
      ref={listRef}
      data={feed.photos}
      renderItem={({ item }) => <PhotoCell photo={item} tab={tab} />}
      keyExtractor={(item) => item.key}
      numColumns={3}
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
      ListFooterComponent={footer}
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
