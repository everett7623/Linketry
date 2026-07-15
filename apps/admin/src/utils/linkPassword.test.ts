import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePasswordUpdate } from './linkPassword.ts';

test('keeps an existing password when the empty field was not edited', () => {
  assert.equal(
    resolvePasswordUpdate({
      existingPasswordProtected: true,
      password: '',
      passwordTouched: false,
      clearPassword: false,
    }),
    undefined
  );
});

test('clears an existing password after the user edits the field back to empty', () => {
  assert.equal(
    resolvePasswordUpdate({
      existingPasswordProtected: true,
      password: '',
      passwordTouched: true,
      clearPassword: false,
    }),
    null
  );
});

test('explicit clear wins while a non-empty replacement is preserved', () => {
  assert.equal(
    resolvePasswordUpdate({
      existingPasswordProtected: true,
      password: 'replacement',
      passwordTouched: true,
      clearPassword: true,
    }),
    null
  );
  assert.equal(
    resolvePasswordUpdate({
      existingPasswordProtected: true,
      password: ' replacement ',
      passwordTouched: true,
      clearPassword: false,
    }),
    'replacement'
  );
});
