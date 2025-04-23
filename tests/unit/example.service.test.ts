import { describe, it, expect } from 'vitest';
import { sum } from '@/services/example.service';

describe('sum function', () => {
  it('should correctly sum two positive numbers', () => {
    expect(sum(5, 7)).toBe(12);
    // expect(sum(5, 7)).toEqual(12);
  });

  // it('should handle negative numbers', () => {
  //   expect(sum(-3, 7)).toBe(4);
  //   expect(sum(5, -8)).toBe(-3);
  //   expect(sum(-5, -5)).toBe(-10);
  // });
  //
  // it('should return 0 when both inputs are 0', () => {
  //   expect(sum(0, 0)).toBe(0);
  // });
  //
  // it('should handle string inputs that can be converted to numbers', () => {
  //   // @ts-ignore - Testing runtime behavior with incorrect types
  //   expect(sum('5', '7')).toBe(12);
  //   // @ts-ignore
  //   expect(sum('10', 20)).toBe(30);
  // });
  //
  // it('should throw an error for invalid inputs', () => {
  //   // @ts-ignore
  //   expect(() => sum('abc', 5)).toThrow('Inputs must be valid numbers');
  //   // @ts-ignore
  //   expect(() => sum(10, 'xyz')).toThrow('Inputs must be valid numbers');
  //   // @ts-ignore
  //   expect(() => sum(null, 5)).toThrow('Inputs must be valid numbers');
  // });
});
