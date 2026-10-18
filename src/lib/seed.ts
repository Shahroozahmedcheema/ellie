import type { CategoryKey } from '@/theme/tokens';
import { CATEGORIES } from '@/theme/tokens';
import type { Caps } from './types';

export const STORAGE_KEY = 'ellie.state.v1';

/**
 * Bumped whenever the persisted shape changes. A mismatch discards the old
 * store and starts clean rather than trying to migrate a stale layout.
 */
export const SEED_VERSION = 2;

export const DEFAULT_INCOME = 0;

/** Every category starts uncapped; setup fills in the ones you pick. */
export const EMPTY_CAPS = (): Caps =>
  CATEGORIES.reduce((acc, c) => {
    acc[c] = 0;
    return acc;
  }, {} as Record<CategoryKey, number>);

let counter = 0;

export const newId = (prefix = 't') =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;
