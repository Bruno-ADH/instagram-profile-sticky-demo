import type { FeedPhoto, PicsumPhoto, TabKey } from '../types/profile';

export const PAGE_SIZE = 30;

const FIRST_API_PAGE: Record<TabKey, number> = {
  posts: 1,
  reels: 2,
  tagged: 3,
};

/**
 * Each tab uses every third Picsum page:
 * posts  -> 1, 4, 7, 10...
 * reels  -> 2, 5, 8, 11...
 * tagged -> 3, 6, 9, 12...
 *
 * That keeps the demo feeds separate while still using the same public API.
 */
function toApiPage(tab: TabKey, localPage: number) {
  return FIRST_API_PAGE[tab] + (localPage - 1) * 3;
}

export async function fetchPhotoPage(
  tab: TabKey,
  localPage: number,
  signal?: AbortSignal,
): Promise<FeedPhoto[]> {
  const apiPage = toApiPage(tab, localPage);
  const response = await fetch(
    `https://picsum.photos/v2/list?page=${apiPage}&limit=${PAGE_SIZE}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Picsum request failed (${response.status})`);
  }

  const photos = (await response.json()) as PicsumPhoto[];

  return photos.map((photo) => ({
    ...photo,
    key: `${tab}-${photo.id}`,
    // A grid cell does not need the multi-megapixel original image.
    thumbnailUrl: `https://picsum.photos/id/${photo.id}/600/600.webp`,
  }));
}
