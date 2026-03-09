import { describe, test, expect } from 'bun:test';
import { addSSEClient, removeSSEClient, getSSEClientCount, NOTIFICATION_TYPES } from './notification.service';

describe('NOTIFICATION_TYPES', () => {
  test('contains all expected types', () => {
    expect(NOTIFICATION_TYPES).toEqual([
      'FOLLOW', 'FAVORITE', 'COMMENT', 'COLLABORATION_INVITE', 'REVISION_CHANGE',
    ]);
  });
});

describe('SSE client management', () => {
  test('addSSEClient registers a client and getSSEClientCount reflects it', () => {
    const send = (data: string) => {};
    addSSEClient(100, send);
    expect(getSSEClientCount(100)).toBe(1);

    // Cleanup
    removeSSEClient(100, send);
    expect(getSSEClientCount(100)).toBe(0);
  });

  test('multiple clients for the same userId', () => {
    const send1 = (data: string) => {};
    const send2 = (data: string) => {};

    addSSEClient(200, send1);
    addSSEClient(200, send2);
    expect(getSSEClientCount(200)).toBe(2);

    removeSSEClient(200, send1);
    expect(getSSEClientCount(200)).toBe(1);

    removeSSEClient(200, send2);
    expect(getSSEClientCount(200)).toBe(0);
  });

  test('removeSSEClient is idempotent', () => {
    const send = (data: string) => {};
    addSSEClient(300, send);
    removeSSEClient(300, send);
    removeSSEClient(300, send); // second remove is no-op
    expect(getSSEClientCount(300)).toBe(0);
  });

  test('removeSSEClient for non-existent userId is a no-op', () => {
    const send = (data: string) => {};
    removeSSEClient(999, send);
    expect(getSSEClientCount(999)).toBe(0);
  });

  test('getSSEClientCount returns 0 for unknown userId', () => {
    expect(getSSEClientCount(12345)).toBe(0);
  });

  test('adding the same function reference twice only counts once (Set behavior)', () => {
    const send = (data: string) => {};
    addSSEClient(400, send);
    addSSEClient(400, send); // same reference
    expect(getSSEClientCount(400)).toBe(1);

    removeSSEClient(400, send);
    expect(getSSEClientCount(400)).toBe(0);
  });
});
