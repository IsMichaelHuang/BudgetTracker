/**
 * @module mockCharges
 * @description Sample charge (expense) data for development and testing.
 * Includes representative transactions across all mock categories.
 */

/** Individual expense entry for mock/seed data (uses numeric ids and ISO date strings). */
export interface Charge {
  /** Unique numeric identifier. */
  id: number;
  /** Numeric identifier of the parent {@link Category}. */
  categoryId: number;
  /** Description of the expense. */
  description: string;
  /** Monetary amount. */
  amount: number;
  /** Date incurred (YYYY-MM-DD). */
  date: string;
};

/** Pre-populated charge records spanning all mock categories. */
export const charges = [
  // Food category (id: 1)
  { id: 1, categoryId: 1, description: 'Lunch at Bistro', amount: 24.50, date: '2025-05-02' },
  { id: 2, categoryId: 1, description: 'Groceries at Market', amount: 89.30, date: '2025-05-05' },
  { id: 3, categoryId: 1, description: 'Coffee and Snacks', amount: 8.75, date: '2025-05-07' },

  // Gas category (id: 2)
  { id: 4, categoryId: 2, description: 'Gas Station Fill-Up', amount: 45.00, date: '2025-05-03' },
  { id: 5, categoryId: 2, description: 'Car Wash', amount: 12.00, date: '2025-05-10' },

  // Rent category (id: 3)
  { id: 6, categoryId: 3, description: 'Monthly Rent', amount: 1200.00, date: '2025-05-01' },

  // Utilities category (id: 4)
  { id: 7, categoryId: 4, description: 'Electricity Bill', amount: 65.12, date: '2025-05-06' },
  { id: 8, categoryId: 4, description: 'Water Bill', amount: 25.89, date: '2025-05-08' },

  // Entertainment category (id: 5)
  { id: 9, categoryId: 5, description: 'Movie Theater', amount: 15.00, date: '2025-05-04' },
  { id: 10, categoryId: 5, description: 'Concert Ticket', amount: 80.00, date: '2025-05-12' },

  // Shopping category (id: 6)
  { id: 11, categoryId: 6, description: 'New Shoes', amount: 95.99, date: '2025-05-09' },

  // Subscriptions category (id: 7)
  { id: 12, categoryId: 7, description: 'Streaming Service', amount: 12.99, date: '2025-05-15' },
];
