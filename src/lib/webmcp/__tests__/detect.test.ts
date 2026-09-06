import { describe, it, expect, afterEach } from 'vitest';
import { getModelContext } from '../detect';
import { installFakeModelContext } from './fakeModelContext';

describe('getModelContext', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()?.();
  });

  it('returns null when neither document nor navigator exposes modelContext', () => {
    expect(getModelContext()).toBeNull();
  });

  it('prefers document.modelContext', () => {
    const onDocument = installFakeModelContext('document');
    const onNavigator = installFakeModelContext('navigator');
    cleanups.push(onDocument.restore, onNavigator.restore);

    expect(getModelContext()).toBe(onDocument.fake);
  });

  it('falls back to the deprecated navigator.modelContext alias', () => {
    const onNavigator = installFakeModelContext('navigator');
    cleanups.push(onNavigator.restore);

    expect(getModelContext()).toBe(onNavigator.fake);
  });
});
