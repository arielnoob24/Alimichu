import { describe, expect, it } from 'vitest';
import { greeting } from './greeting.js';

describe('greeting', () => {
  it('saluda según la hora', () => {
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Buenos días');
    expect(greeting(new Date(2026, 0, 1, 15))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 0, 1, 22))).toBe('Buenas noches');
  });
});
