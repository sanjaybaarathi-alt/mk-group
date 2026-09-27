import { describe, expect, it } from 'vitest';
import { growthAt, phaseAt } from './constructionTimeline';

describe('continuous construction progress', () => {
  it('clamps progress and keeps the base of an expanding column fixed', () => {
    const base = .3, height = 2.8, center = base + height / 2;
    for (const p of [0, .1, .13, .18, .22, .5, 1]) {
      const growth = growthAt(p, .1, .22);
      const displayedHeight = height * growth;
      const displayedCenter = center - height * (1 - growth) / 2;
      expect(displayedCenter - displayedHeight / 2).toBeCloseTo(base);
    }
    expect(growthAt(0, .1, .22)).toBe(0);
    expect(growthAt(1, .1, .22)).toBe(1);
  });
  it('does not build upper columns before their supporting slab and reverses deterministically', () => {
    const lowerSlabEnd = .33, upperStart = .34;
    expect(growthAt(lowerSlabEnd, upperStart, .46)).toBe(0);
    const forwards = [0, .1, .2, .4, .7, 1].map(p => growthAt(p, .34, .46));
    const backwards = [1, .7, .4, .2, .1, 0].map(p => growthAt(p, .34, .46)).reverse();
    expect(backwards).toEqual(forwards);
  });
  it('keeps captions aligned to the structural schedule', () => {
    expect([0, .2, .4, .6, .8, 1].map(phaseAt)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
