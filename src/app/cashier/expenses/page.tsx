'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useExpenseStore } from '../../../store/useExpenseStore';
import { ExpenseType } from '../../../types';
import { ShoppingBag, Users, Plus, IndianRupee } from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function DailyExpenses() {
  const { expenses, subscribeToExpenses, addExpense } = useExpenseStore();
  const [expenseType, setExpenseType] = useState<ExpenseType>('item');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToExpenses();
    return () => unsub();
  }, [subscribeToExpenses]);

  const todayExpenses = expenses.filter(e => isToday(new Date(e.createdAt)));
  const totalExpense = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      await addExpense(expenseType, name.trim(), parseFloat(amount));
      setName('');
      setAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Daily Expenses</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
              Add Expense
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExpenseType('item')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors ${expenseType === 'item' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                    }`}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Item
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType('person')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors ${expenseType === 'person' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                    }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Person
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {expenseType === 'item' ? 'Item Name' : 'Person Name'}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={expenseType === 'item' ? 'e.g. Vegetables, Milk' : 'e.g. Rahul, Chef'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <h3 className="text-green-100 font-medium mb-1">Total Expense Today</h3>
              <div className="text-4xl font-bold flex items-center">
                <IndianRupee className="w-8 h-8 mr-1 opacity-80" />
                {totalExpense.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-md flex-1">
            <CardContent className="p-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="font-bold text-slate-700">Today's Log</h3>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {todayExpenses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">No expenses recorded today.</p>
                ) : (
                  todayExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${expense.type === 'item' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {expense.type === 'item' ? <ShoppingBag className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{expense.name}</p>
                          <p className="text-xs text-slate-500">{format(expense.createdAt, 'hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="font-bold text-slate-700">
                        ₹{expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
