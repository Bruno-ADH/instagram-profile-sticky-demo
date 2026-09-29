import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';

export interface OverlayScrollState {
  page: SharedValue<number>;
  offset: SharedValue<number>;
}

// The overlay moves the active list itself, so its normal scroll handler remains
// the source of truth for the profile collapse and the saved tab positions.
export function useProfileOverlayScroll(
  activePageIndex: SharedValue<number>,
  offsets: readonly SharedValue<number>[],
  maxOffsets: readonly SharedValue<number>[],
) {
  const page = useSharedValue(-1);
  const offset = useSharedValue(0);
  const startOffset = useSharedValue(0);
  const startTouchY = useSharedValue(0);
  const state = useMemo(() => ({ page, offset }), [page, offset]);

  const stop = useCallback(() => {
    'worklet';
    cancelAnimation(offset);
    page.value = -1;
  }, [offset, page]);

  const gesture = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-16, 16])
    .maxPointers(1)
    // Stop an old fling on touch-down, but let a stationary touch press a button.
    .onBegin(() => {
      stop();
    })
    .onStart((event) => {
      const index = activePageIndex.value;
      const currentOffset = offsets[index];
      if (!currentOffset) return;
      startOffset.value = currentOffset.value;
      startTouchY.value = event.absoluteY;
      offset.value = currentOffset.value;
      page.value = index;
    })
    .onUpdate((event) => {
      const maxOffset = maxOffsets[page.value];
      if (!maxOffset) return;
      // Screen coordinates stay stable while the overlay translates under us.
      offset.value = Math.max(
        0,
        Math.min(
          startOffset.value + startTouchY.value - event.absoluteY,
          maxOffset.value,
        ),
      );
    })
    .onEnd((event) => {
      const maxOffset = maxOffsets[page.value];
      if (!maxOffset) return;
      offset.value = withDecay(
        { velocity: -event.velocityY, clamp: [0, maxOffset.value] },
        (finished) => {
          if (finished) page.value = -1;
        },
      );
    })
    .onFinalize((_event, success) => {
      if (!success) stop();
    });

  return { gesture, state, stop };
}
