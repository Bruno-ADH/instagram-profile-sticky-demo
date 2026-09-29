import test from 'node:test';
import assert from 'node:assert/strict';
import { minimumGridFooter, synchronizedOffset } from '../src/utils/profile-scroll.ts';

test('partly visible profile aligns every target regardless of its saved depth', () => {
  for (const saved of [0, 100, 900]) {
    assert.equal(synchronizedOffset(80, saved, 250), 80);
  }
});

test('collapsed profile preserves deep positions and raises shallow targets', () => {
  assert.equal(synchronizedOffset(600, 900, 250), 900);
  assert.equal(synchronizedOffset(250, 0, 250), 250);
});

test('empty, short and full grids can collapse the profile in either orientation', () => {
  for (const [width, height] of [[393, 700], [700, 393], [392.5, 699.5]]) {
    for (const count of [0, 1, 2, 3, 4, 30]) {
      const footer = minimumGridFooter(count, width, height, 48, 3);
      const grid = Math.ceil(count / 3) * width / 3;
      const maxScroll = 250 + 48 + grid + footer - height;
      assert.ok(maxScroll >= 250, `count=${count}, width=${width}`);
      if (grid >= height - 48) assert.equal(footer, 0);
    }
  }
});
