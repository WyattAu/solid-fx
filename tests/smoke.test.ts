import { describe, expect, it } from 'vitest';
import * as Barrel from '../src/content/index';

describe('content barrel', () => {
  it('exports only component functions', () => {
    const entries = Object.entries(Barrel).filter(([k]) => k !== 'COMPONENT_COUNT');
    expect(entries.length).toBeGreaterThan(0);
    for (const [name, value] of entries) {
      expect(value, name).toBeTypeOf('function');
    }
  });
});
