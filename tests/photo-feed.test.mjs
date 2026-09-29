import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoFeed } from '../src/state/photo-feed.ts';

const photos = (...keys) => keys.map((key) => ({ key }));
const settle = () => new Promise((resolve) => setImmediate(resolve));
function setup() {
  const requests = [];
  const feed = createPhotoFeed((page, signal) => new Promise((resolve, reject) => {
    requests.push({ page, signal, resolve, reject });
  }), 2);
  feed.start();
  return { feed, requests };
}

for (const oldResponse of ['success', 'failure']) {
  test(`refresh supersedes pagination, ignoring its late ${oldResponse}`, async () => {
    const { feed, requests } = setup();
    requests[0].resolve(photos('a', 'b'));
    await settle();
    feed.loadMore();
    feed.refresh();
    assert.equal(requests[1].signal.aborted, true);
    assert.deepEqual(requests.map((r) => r.page), [1, 2, 1]);
    assert.equal(feed.getSnapshot().isRefreshing, true);
    assert.equal(feed.getSnapshot().isLoadingMore, false);
    if (oldResponse === 'success') requests[1].resolve(photos('stale'));
    else requests[1].reject(new Error('stale failure'));
    await settle();
    assert.equal(feed.getSnapshot().isRefreshing, true);
    assert.equal(feed.getSnapshot().error, null);
    requests[2].resolve(photos('new', 'newer'));
    await settle();
    assert.deepEqual(feed.getSnapshot().photos, photos('new', 'newer'));
    feed.loadMore();
    assert.equal(requests[3].page, 2);
    feed.dispose();
  });
}

test('older refresh cannot overwrite a newer refresh, even if it finishes last', async () => {
  const { feed, requests } = setup();
  feed.refresh();
  feed.refresh();
  requests[2].resolve(photos('latest'));
  await settle();
  const snapshot = feed.getSnapshot();
  requests[1].resolve(photos('old refresh'));
  requests[0].resolve(photos('old initial'));
  await settle();
  assert.equal(feed.getSnapshot(), snapshot);
  assert.deepEqual(snapshot.photos, photos('latest'));
  assert.equal(snapshot.isRefreshing, false);
  assert.equal(snapshot.isInitialLoading, false);
});

test('repeated pagination events cannot issue duplicate requests', async () => {
  const { feed, requests } = setup();
  feed.loadMore();
  assert.equal(requests.length, 1);
  requests[0].resolve(photos('a', 'b'));
  await settle();
  feed.loadMore();
  feed.loadMore();
  assert.equal(requests.length, 2);
  requests[1].resolve(photos('c', 'd'));
  await settle();
  feed.loadMore();
  assert.equal(requests[2].page, 3);
  feed.dispose();
});

test('deduplicates both existing photos and repeated entries in one response', async () => {
  const { feed, requests } = setup();
  requests[0].resolve(photos('a', 'a'));
  await settle();
  feed.loadMore();
  requests[1].resolve(photos('a', 'b'));
  await settle();
  feed.loadMore();
  requests[2].resolve(photos('c', 'c'));
  await settle();
  assert.deepEqual(feed.getSnapshot().photos, photos('a', 'b', 'c'));
  // End-of-feed detection uses the server count, not the deduplicated count.
  assert.equal(feed.getSnapshot().hasMore, true);
});

test('empty page stops pagination; refresh can reopen it', async () => {
  const { feed, requests } = setup();
  requests[0].resolve([]);
  await settle();
  feed.loadMore();
  assert.equal(requests.length, 1);
  assert.equal(feed.getSnapshot().hasMore, false);
  feed.refresh();
  requests[1].resolve(photos('a', 'b'));
  await settle();
  assert.equal(feed.getSnapshot().hasMore, true);
});

test('failed refresh preserves existing data and permits a retry', async () => {
  const { feed, requests } = setup();
  requests[0].resolve(photos('a', 'b'));
  await settle();
  feed.refresh();
  requests[1].reject(new Error('offline'));
  await settle();
  assert.deepEqual(feed.getSnapshot().photos, photos('a', 'b'));
  assert.equal(feed.getSnapshot().error, 'offline');
  assert.equal(feed.getSnapshot().isRefreshing, false);
  feed.refresh();
  assert.equal(feed.getSnapshot().error, null);
  requests[2].resolve(photos('fresh'));
  await settle();
  assert.deepEqual(feed.getSnapshot().photos, photos('fresh'));
});

test('cleanup aborts the request and ignores completion after unmount', async () => {
  const { feed, requests } = setup();
  let notifications = 0;
  const unsubscribe = feed.subscribe(() => notifications++);
  const snapshot = feed.getSnapshot();
  feed.dispose();
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve(photos('late'));
  await settle();
  feed.refresh();
  assert.equal(feed.getSnapshot(), snapshot);
  assert.equal(notifications, 0);
  assert.equal(requests.length, 1);
  unsubscribe();
});

test('effect setup-cleanup-setup remains usable in React Strict Mode', async () => {
  const { feed, requests } = setup();
  feed.dispose();
  feed.start();
  requests[0].reject(new Error('aborted initial request'));
  await settle();
  assert.equal(feed.getSnapshot().isInitialLoading, true);
  assert.equal(feed.getSnapshot().error, null);
  requests[1].resolve(photos('current'));
  await settle();
  assert.deepEqual(feed.getSnapshot().photos, photos('current'));
  assert.equal(feed.getSnapshot().isInitialLoading, false);
});
