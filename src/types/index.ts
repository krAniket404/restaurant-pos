export type OrderStatus = 
  | 'requested'
  | 'served'
  | 'paid';

export interface OrderItem {
  id: string; // unique id for the line item to handle removals
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  instructions?: string[];
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: number;
  updatedAt: number;
  total: number;
}

export interface Table {
  _id: string;
  tableNumber: number;
  capacity?: number;
}

export interface MenuItem {
  _id: string;
  title: string;
  price: number;
  isVeg: boolean;
  isAvailable?: boolean;
  category: {
    _id: string;
    title: string;
  };
  description?: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

export type ExpenseType = 'item' | 'person';

export interface Expense {
  id: string;
  type: ExpenseType;
  name: string;
  amount: number;
  createdAt: number;
}
