import { describe, it, expect } from 'vitest';
import { createStorage, memoryBackend, KEYS } from '../src/store/storage.js';

describe('storage', () => {
  it('round-trips an export into a fresh device', async () => {
    const a = createStorage(memoryBackend());
    await a.set(KEYS.sessions, [{ id: 's1', status: 'complete' }]);
    await a.set(KEYS.settings, { voice: false });
    const file = JSON.parse(JSON.stringify(await a.exportAll()));

    const b = createStorage(memoryBackend());
    await b.importAll(file);
    expect(await b.get(KEYS.sessions)).toEqual([{ id: 's1', status: 'complete' }]);
    expect(await b.get(KEYS.settings)).toEqual({ voice: false });
  });

  it('refuses files that are not BedAlarm exports', async () => {
    const s = createStorage(memoryBackend());
    await expect(s.importAll({ hello: 'world' })).rejects.toThrow(/not a BedAlarm export/);
  });
});
