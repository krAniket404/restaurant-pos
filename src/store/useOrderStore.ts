import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { sanitizeForFirestore } from "../lib/modificationHelpers";
import { Order, OrderStatus, ModificationDecisionItem } from "../types";

interface OrderStore {
  orders: Order[];
  loading: boolean;
  lastSeen: Record<string, number>;
  subscribeToOrders: () => () => void;
  createOrder: (
    tableNumber: number,
    items: Order["items"],
    total: number,
  ) => Promise<void>;
  createModificationRequest: (
    tableNumber: number,
    parentOrderId: string,
    originalItems: Order["items"],
    items: Order["items"],
    total: number,
    summary: string[],
  ) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderItems: (
    orderId: string,
    items: Order["items"],
    total: number,
    newStatus?: OrderStatus,
    isModified?: boolean,
  ) => Promise<void>;
  decideModificationItem: (
    modificationOrderId: string,
    itemId: string,
    decision: "approved" | "rejected",
  ) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  markStatusSeen: (status: string) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      loading: true,
      lastSeen: {},
      markStatusSeen: (status) =>
        set((state) => ({
          lastSeen: { ...state.lastSeen, [status]: Date.now() },
        })),
      subscribeToOrders: () => {
        const q = query(collection(db, "orders"), orderBy("updatedAt", "asc"));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const ordersData = snapshot.docs.map((doc) => {
              const data = doc.data() as Partial<Order>;
              const isModificationOrder =
                data.kind === "modification" ||
                Boolean(data.parentOrderId) ||
                Boolean(data.itemDecisions?.length) ||
                Boolean(data.isModified && data.parentOrderId);

              return {
                id: doc.id,
                ...data,
                kind: isModificationOrder ? "modification" : "order",
              } as Order;
            });
            set({ orders: ordersData, loading: false });
          },
          (error) => {
            console.error("Error fetching orders: ", error);
            set({ loading: false });
          },
        );
        return unsubscribe;
      },
      createOrder: async (tableNumber, items, total) => {
        try {
          const payload = sanitizeForFirestore({
            tableNumber,
            items,
            status: "requested",
            total,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            kind: "order",
          });

          await addDoc(collection(db, "orders"), payload);
        } catch (error) {
          console.error("Error creating order in Firestore:", error);
        }
      },
      createModificationRequest: async (
        tableNumber,
        parentOrderId,
        originalItems,
        items,
        total,
        summary,
      ) => {
        try {
          const itemDecisions: ModificationDecisionItem[] = items.map(
            (item) => ({
              id: item.id || item.menuItemId,
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              originalQuantity:
                originalItems.find(
                  (original) => original.menuItemId === item.menuItemId,
                )?.quantity || 0,
              instructions: item.instructions,
              decision: "pending",
            }),
          );

          const payload = sanitizeForFirestore({
            tableNumber,
            items,
            status: "requested",
            total,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            kind: "modification",
            parentOrderId,
            originalItems,
            modificationSummary: summary,
            itemDecisions,
            isModified: true,
          });

          await addDoc(collection(db, "orders"), payload);
        } catch (error) {
          console.error(
            "Error creating modification request in Firestore:",
            error,
          );
        }
      },
      updateOrderStatus: async (orderId, status) => {
        try {
          const orderRef = doc(db, "orders", orderId);
          const updateData: Partial<Order> = { status, updatedAt: Date.now() };
          await updateDoc(orderRef, updateData);
        } catch (error) {
          console.error("Error updating order status:", error);
        }
      },
      updateOrderItems: async (
        orderId,
        items,
        total,
        newStatus = "requested",
        isModified = true,
      ) => {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            items,
            total,
            status: newStatus,
            isModified,
            updatedAt: Date.now(),
          });
        } catch (error) {
          console.error("Error updating order items:", error);
        }
      },
      decideModificationItem: async (modificationOrderId, itemId, decision) => {
        try {
          const modificationRef = doc(db, "orders", modificationOrderId);
          const snap = await getDoc(modificationRef);
          if (!snap.exists()) return;

          const modificationOrder = snap.data() as Order;
          const nextItemDecisions = (modificationOrder.itemDecisions || []).map(
            (item) => (item.id === itemId ? { ...item, decision } : item),
          );

          const pendingItems = nextItemDecisions.filter(
            (item) => item.decision === "pending",
          );
          const decisionPayload: Partial<Order> = {
            itemDecisions: nextItemDecisions,
            updatedAt: Date.now(),
          };

          if (pendingItems.length === 0) {
            decisionPayload.status = "served";
          }

          await updateDoc(modificationRef, decisionPayload);

          if (decision === "approved" && modificationOrder.parentOrderId) {
            const parentOrderRef = doc(
              db,
              "orders",
              modificationOrder.parentOrderId,
            );
            const parentSnap = await getDoc(parentOrderRef);
            if (!parentSnap.exists()) return;

            const parentOrder = parentSnap.data() as Order;
            const approvedItem = nextItemDecisions.find(
              (item) => item.id === itemId && item.decision === "approved",
            );
            if (!approvedItem) return;

            const nextParentItems = parentOrder.items.filter(
              (item) => item.menuItemId !== approvedItem.menuItemId,
            );
            if (approvedItem.quantity > 0) {
              nextParentItems.push({
                id: approvedItem.id,
                menuItemId: approvedItem.menuItemId,
                name: approvedItem.name,
                price: approvedItem.price,
                quantity: approvedItem.quantity,
                instructions: approvedItem.instructions || [],
              });
            }

            const nextTotal = nextParentItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );
            await updateDoc(parentOrderRef, {
              items: nextParentItems,
              total: nextTotal,
              isModified: true,
              updatedAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Error deciding modification item:", error);
        }
      },
      deleteOrder: async (orderId) => {
        try {
          const orderRef = doc(db, "orders", orderId);
          await deleteDoc(orderRef);
        } catch (error) {
          console.error("Error deleting order:", error);
        }
      },
    }),
    {
      name: "order-storage",
      partialize: (state) => ({ lastSeen: state.lastSeen }),
    },
  ),
);
