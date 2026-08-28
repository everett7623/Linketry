import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell, csvRow } from './csv.ts';

test('plain values pass through unquoted', () => {
  assert.equal(csvCell('hello'), 'hello');
  assert.equal(csvCell(42), '42');
  assert.equal(csvCell(-7), '-7');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
});

test('RFC 4180 quoting for commas, quotes and newlines', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
});

test('formula-injection payloads are neutralized', () => {
  assert.equal(csvCell('=HYPERLINK("http://evil")'), '"\'=HYPERLINK(""http://evil"")"');
  assert.equal(csvCell('+1+1'), "\"'+1+1\"");
  assert.equal(csvCell('@SUM(A1:A9)'), "\"'@SUM(A1:A9)\"");
  assert.equal(csvCell('-2+3+cmd|calc'), "\"'-2+3+cmd|calc\"");
  assert.equal(csvCell('\t=1'), '"\'\t=1"');
});

test('negative numbers are not treated as formulas', () => {
  assert.equal(csvCell('-42'), '-42');
  assert.equal(csvCell('-3.14'), '-3.14');
});

test('csvRow joins escaped cells with commas', () => {
  assert.equal(csvRow(['a', 'b,c', '=x']), 'a,"b,c","\'=x"');
});
