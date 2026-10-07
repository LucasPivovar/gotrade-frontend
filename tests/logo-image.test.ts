import test from 'node:test';
import assert from 'node:assert/strict';
import { removeEdgeBackground } from '../lib/logo-image';

void test('background removal preserves enclosed white details and colored foreground', () => {
  const width = 7,
    height = 7,
    data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 2; y <= 4; y++)
    for (let x = 2; x <= 4; x++) {
      if (x === 3 && y === 3) continue;
      const i = (y * width + x) * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  removeEdgeBackground(data, width, height, 30);
  assert.equal(data[3], 0, 'outside background becomes transparent');
  assert.equal(
    data[(3 * width + 3) * 4 + 3],
    255,
    'enclosed white detail survives',
  );
  assert.equal(data[(2 * width + 2) * 4 + 3], 255, 'black ring survives');
});
void test('already transparent edges and inner artwork stay intact', () => {
  const data = new Uint8ClampedArray(3 * 3 * 4);
  data.set([0, 80, 255, 255], 4 * 4);
  removeEdgeBackground(data, 3, 3, 30);
  assert.equal(data[4 * 4 + 3], 255);
  assert.equal(data[3], 0);
});
