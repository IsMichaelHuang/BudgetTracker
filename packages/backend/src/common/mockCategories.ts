export interface Category {
  id: number;
  title: string;
  amount: number;
  allotment: number;
}

export const categories: Category[] = [
  { id: 1, title: 'Food',          amount: 235.47, allotment: 400 },
  { id: 2, title: 'Gas',           amount: 78.12,  allotment: 150 },
  { id: 3, title: 'Rent',          amount: 1200,   allotment: 1200},
  { id: 4, title: 'Utilities',     amount: 190.33, allotment: 250 },
  { id: 5, title: 'Entertainment', amount: 95.00,  allotment: 150 },
  { id: 6, title: 'Shopping',      amount: 310.89, allotment: 300 },
  { id: 7, title: 'Subscriptions', amount: 45.00,  allotment: 60  },
];

