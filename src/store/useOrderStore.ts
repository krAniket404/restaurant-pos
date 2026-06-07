import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Order, OrderStatus } from '../types';

interface OrderStore {
  orders: Order[];
  loading: boolean;
  lastSeen: Record<string, number>;
  subscribeToOrders: () => () => void;
  createOrder: (tableNumber: number, items: Order['items'], total: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
  updateOrderItems: (orderId: string, items: Order['items'], total: number) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  markStatusSeen: (status: string) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      loading: true,
      lastSeen: {},
      markStatusSeen: (status) => set((state) => ({
        lastSeen: { ...state.lastSeen, [status]: Date.now() }
      })),
      subscribeToOrders: () => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          set({ orders: ordersData, loading: false });
        }, (error) => {
          console.error("Error fetching orders: ", error);
          set({ loading: false });
        });
        return unsubscribe;
      },
      createOrder: async (tableNumber, items, total) => {
        await addDoc(collection(db, 'orders'), {
          tableNumber,
          items,
          status: 'requested',
          total,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      },
      updateOrderStatus: async (orderId, status, reason) => {
        const orderRef = doc(db, 'orders', orderId);
        const updateData: any = { status, updatedAt: Date.now() };
        if (reason) updateData.holdReason = reason;
        await updateDoc(orderRef, updateData);
      },
      updateOrderItems: async (orderId, items, total) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          items,
          total,
          status: 'requested',
          updatedAt: Date.now()
        });
      },
      deleteOrder: async (orderId) => {
        const orderRef = doc(db, 'orders', orderId);
        await deleteDoc(orderRef);
      }
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({ lastSeen: state.lastSeen }),
    }
  )
);
