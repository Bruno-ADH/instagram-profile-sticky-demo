import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { fetchPhotoPage, PAGE_SIZE } from '../api/picsum';
import { createPhotoFeed } from '../state/photo-feed';
import type { TabKey } from '../types/profile';

export function usePaginatedPhotos(tab: TabKey) {
  const feed = useMemo(
    () => createPhotoFeed((page, signal) => fetchPhotoPage(tab, page, signal), PAGE_SIZE),
    [tab],
  );
  const state = useSyncExternalStore(feed.subscribe, feed.getSnapshot, feed.getSnapshot);

  useEffect(() => {
    feed.start();
    return () => feed.dispose();
  }, [feed]);

  return useMemo(() => ({
    ...state,
    loadMore: feed.loadMore,
    refresh: feed.refresh,
  }), [feed, state]);
}

export type PaginatedPhotoFeed = ReturnType<typeof usePaginatedPhotos>;
