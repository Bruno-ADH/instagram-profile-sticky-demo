import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchPhotoPage, PAGE_SIZE } from '../api/picsum';
import type { FeedPhoto, TabKey } from '../types/profile';

export function usePaginatedPhotos(tab: TabKey) {
  const [photos, setPhotos] = useState<FeedPhoto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestInFlight = useRef(false);

  const requestPage = useCallback(
    async (nextPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (requestInFlight.current) return;
      requestInFlight.current = true;

      if (mode === 'initial') setIsInitialLoading(true);
      if (mode === 'more') setIsLoadingMore(true);
      if (mode === 'refresh') setIsRefreshing(true);

      try {
        setError(null);
        const nextPhotos = await fetchPhotoPage(tab, nextPage);

        setPhotos((current) => {
          if (mode !== 'more') return nextPhotos;

          const known = new Set(current.map((photo) => photo.key));
          const uniqueNext = nextPhotos.filter((photo) => !known.has(photo.key));
          return [...current, ...uniqueNext];
        });

        setPage(nextPage);
        setHasMore(nextPhotos.length === PAGE_SIZE);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unknown network error');
      } finally {
        requestInFlight.current = false;
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [tab],
  );

  useEffect(() => {
    void requestPage(1, 'initial');
  }, [requestPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || requestInFlight.current || page === 0) return;
    void requestPage(page + 1, 'more');
  }, [hasMore, page, requestPage]);

  const refresh = useCallback(() => {
    void requestPage(1, 'refresh');
  }, [requestPage]);

  return {
    photos,
    hasMore,
    error,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    loadMore,
    refresh,
  };
}

export type PaginatedPhotoFeed = ReturnType<typeof usePaginatedPhotos>;
