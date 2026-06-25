import { create } from 'zustand';
import { collection, onSnapshot, query, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Expense, ExpenseType } from '../types';

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  subscribeToExpenses: () => () => void;
  addExpense: (type: ExpenseType, name: string, amount: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>()(
  (set) => ({
    expenses: [],
    loading: true,
    subscribeToExpenses: () => {
      const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        set({ expenses: expensesData, loading: false });
      }, (error) => {
        console.error("Error fetching expenses: ", error);
        set({ loading: false });
      });
      return unsubscribe;
    },
    addExpense: async (type, name, amount) => {
      try {
        await addDoc(collection(db, 'expenses'), {
          type,
          name,
          amount,
          createdAt: Date.now()
        });
      } catch (error) {
        console.error("Error adding expense in Firestore:", error);
      }
    }
  })
);
