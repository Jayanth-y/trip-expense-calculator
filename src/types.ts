export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  participants: Set<string>;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}