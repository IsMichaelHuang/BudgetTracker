/**
 * @module mockCategories
 * @description Sample budget category data for development and testing.
 * Covers common household spending groups with realistic dollar amounts.
 */

/** Budget category shape for mock/seed data (uses numeric id instead of MongoDB ObjectId). */
export interface Category {
  /** Unique numeric identifier. */
  id: number;
  /** Display title of the category. */
  title: string;
  /** Current amount spent. */
  amount: number;
  /** Budgeted spending limit. */
  allotment: number;
}

/** Pre-populated category records spanning typical household budget groups. */
export const categories: Category[] = [
  { id: 1, title: 'Food',          amount: 235.47, allotment: 400 },
  { id: 2, title: 'Gas',           amount: 78.12,  allotment: 150 },
  { id: 3, title: 'Rent',          amount: 1200,   allotment: 1200},
  { id: 4, title: 'Utilities',     amount: 190.33, allotment: 250 },
  { id: 5, title: 'Entertainment', amount: 95.00,  allotment: 150 },
  { id: 6, title: 'Shopping',      amount: 310.89, allotment: 300 },
  { id: 7, title: 'Subscriptions', amount: 45.00,  allotment: 60  },
];
