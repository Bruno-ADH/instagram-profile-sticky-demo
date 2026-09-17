# Instagram-like sticky profile — Expo / FlashList v2

A small reference project reproducing the important profile behavior from Instagram:

- fixed application top bar;
- profile header scrolls away normally;
- profile tabs stick at the top of the content;
- 3-column virtualized grid;
- real paginated network data;
- each tab keeps its own loaded pages and scroll offset;
- no nested vertical ScrollView;
- no collapsible-tab package;
- no Reanimated code required for the vertical collapse.

## Stack

- Expo SDK 57
- React Native 0.86
- FlashList v2
- expo-image
- react-native-safe-area-context
- Lorem Picsum API

## Run

```bash
npm install
npx expo run:android
```

On macOS for iOS:

```bash
npx expo run:ios
```

Then, after the native app exists, you can normally restart Metro with:

```bash
npm start
```

## Create the same project from Expo instead

If you prefer bootstrapping it yourself with the official Expo CLI:

```bash
npx create-expo-app@latest instagram-profile-demo --template default@sdk-57
cd instagram-profile-demo
npx expo install @shopify/flash-list expo-image react-native-safe-area-context
```

Then copy the relevant source files from this demo.

## Why the sticky behavior is simple

The list has this logical data shape:

```text
index 0  PROFILE HEADER      span = 3
index 1  TAB BAR             span = 3  <-- stickyHeaderIndices={[1]}
index 2  photo               span = 1
index 3  photo               span = 1
index 4  photo               span = 1
...
```

FlashList v2 lets the first two items span all three grid columns through
`overrideItemLayout`. The tab item is then made sticky with
`stickyHeaderIndices`.

So there is only one vertical scrollable container.

## Pagination

Lorem Picsum exposes `page` and `limit`. Each local tab uses a different page
sequence so their demo data stays separate:

- posts: API pages 1, 4, 7, 10...
- reels: API pages 2, 5, 8, 11...
- tagged: API pages 3, 6, 9, 12...

Each request loads 30 more images.

## Production notes

For a real social app:

1. Use cursor pagination from your backend rather than page-number pagination.
2. Serve small square thumbnails for the profile grid instead of originals.
3. Keep `expo-image`'s `recyclingKey` when rendering recycled cells.
4. Avoid local component state inside recycled grid cells unless you reset it
   when the item identity changes.
5. Measure performance in a release build, not only Metro dev mode.
