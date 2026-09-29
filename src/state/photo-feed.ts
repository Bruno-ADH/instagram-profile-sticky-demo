import type { FeedPhoto } from '../types/profile';

interface FeedState {
  photos: FeedPhoto[];
  page: number;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
}

type FetchPage = (page: number, signal: AbortSignal) => Promise<FeedPhoto[]>;
type RequestMode = 'initial' | 'more' | 'refresh';

// Keep the request lock and page number synchronous, even before React renders.
export function createPhotoFeed(fetchPage: FetchPage, pageSize: number) {
  let state: FeedState = {
    photos: [], page: 0, hasMore: true, error: null,
    isInitialLoading: true, isLoadingMore: false, isRefreshing: false,
  };
  let mounted = false;
  let request: AbortController | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<FeedState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function requestPage(page: number, mode: RequestMode) {
    if (!mounted || (request && mode !== 'refresh')) return;
    request?.abort();
    const current = new AbortController();
    request = current;
    publish({
      error: null,
      isInitialLoading: mode === 'initial',
      isLoadingMore: mode === 'more',
      isRefreshing: mode === 'refresh',
    });

    try {
      const incoming = await fetchPage(page, current.signal);
      // Identity also protects against transports that finish after abort().
      if (!mounted || request !== current) return;
      const photos = mode === 'more' ? [...state.photos] : [];
      const known = new Set(photos.map((photo) => photo.key));
      for (const photo of incoming) {
        if (!known.has(photo.key)) {
          known.add(photo.key);
          photos.push(photo);
        }
      }
      request = null;
      publish({
        photos, page, hasMore: incoming.length === pageSize,
        isInitialLoading: false, isLoadingMore: false, isRefreshing: false,
      });
    } catch (caught) {
      if (!mounted || request !== current) return;
      request = null;
      publish({
        error: caught instanceof Error ? caught.message : 'Unknown network error',
        isInitialLoading: false, isLoadingMore: false, isRefreshing: false,
      });
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      mounted = true;
      void requestPage(1, 'initial');
    },
    dispose() {
      mounted = false;
      request?.abort();
      request = null;
    },
    loadMore() {
      if (!state.hasMore || state.page === 0) return;
      void requestPage(state.page + 1, 'more');
    },
    refresh() {
      void requestPage(1, 'refresh');
    },
  };
}
