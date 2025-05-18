import assert from 'node:assert';
import test from 'node:test';
import { ESLint } from 'eslint';

const files = ['nodes/GitlabExtended/GitlabExtended.node.ts'];

test('GitlabExtended.node.ts should pass ESLint', async () => {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(files);
  const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  assert.strictEqual(errorCount, 0, resultText);
});
