export type OrderStatus = 
  | 'requested'
  | 'in_queue'
  | 'on_hold'
  | 'preparing'
  | 'prepared'
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
  holdReason?: string;
  isModified?: boolean;
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
