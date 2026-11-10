// Gait variants (an alternative run or walk capture) go to a third of players, spread evenly over the alternatives.
import test from 'node:test';
import assert from 'node:assert/strict';
import { variantFor } from '../src/render3d/character.js';

test('a third of players get a variant, the rest keep the base clip', () => {
  const alts = [['run2', 5.85]]; let n = 0;
  for (let seed = 0; seed < 300; seed++) if (variantFor(seed, alts)) n++;
  assert.equal(n, 100);
});
test('with two alternatives each gets half of that third', () => {
  const alts = [['walk2', 1.5], ['walk3', 1.7]], c = { walk2: 0, walk3: 0 };
  for (let seed = 0; seed < 600; seed++) { const v = variantFor(seed, alts); if (v) c[v[0]]++; }
  assert.deepEqual(c, { walk2: 100, walk3: 100 });
});
test('no alternatives: never a variant', () => {
  assert.equal(variantFor(3, undefined), null); assert.equal(variantFor(3, []), null);
});
