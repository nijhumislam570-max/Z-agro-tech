import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'VetMedix', type: 'app' };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('VetMedix');
  });
});
