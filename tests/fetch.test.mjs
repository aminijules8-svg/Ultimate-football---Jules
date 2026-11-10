// tools/assets/fetch.sh is the only way to get the motion sources on a fresh machine: a missing clip must be reported
// and skipped, never abort the whole download (the script runs under set -euo pipefail).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the CMU download line keeps its error handler outside any comment', () => {
  const line = readFileSync('tools/assets/fetch.sh', 'utf8').split('\n').find(l => l.includes('get cmu/$c.zip'));
  assert.ok(line, 'download line present');
  const code = line.split('#')[0];
  assert.match(code, /\|\|\s*\{\s*echo "missing \$c"; continue; \}/);
});
