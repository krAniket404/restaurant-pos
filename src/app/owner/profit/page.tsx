'use client';
import React, { useState } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { useExpenseStore } from '../../../store/useExpenseStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from '../../../components/ui/Button';

export default function ProfitPage() {
  const { orders } = useOrderStore();
  const { expenses } = useExpenseStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Group orders by date
  const groupedOrders: Record<string, typeof orders> = {};
  orders.forEach(order => {
    if (order.status !== 'paid') return;
    const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateStr]) groupedOrders[dateStr] = [];
    groupedOrders[dateStr].push(order);
  });

  // Group expenses by date
  const groupedExpenses: Record<string, typeof expenses> = {};
  expenses.forEach(expense => {
    const dateStr = new Date(expense.createdAt).toISOString().split('T')[0];
    if (!groupedExpenses[dateStr]) groupedExpenses[dateStr] = [];
    groupedExpenses[dateStr].push(expense);
  });

  // Collect all unique dates with either orders or expenses
  const allDatesSet = new Set([...Object.keys(groupedOrders), ...Object.keys(groupedExpenses)]);
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'do MMMM yyyy');
  };

  const calculateFinance = (dateStr: string) => {
    const dateOrders = groupedOrders[dateStr] || [];
    const dateExpenses = groupedExpenses[dateStr] || [];

    const revenue = dateOrders.reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = dateExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = revenue - totalExpenses;

    return { revenue, totalExpenses, profit };
  };

  const currentFinance = calculateFinance(selectedDate);

  return (
    <div className="flex h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-indigo-600" />
          Profit Made
        </h1>

        {/* Mobile Date Picker */}
        <div className="lg:hidden mb-8 flex items-center justify-between bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500">
            <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
            <span className="font-medium text-sm">Select Date</span>
          </div>
          <input
            type="date"
            className="bg-transparent border-none outline-none font-medium text-slate-800 cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="max-w-2xl">
          <Card className="bg-white shadow-xl border-0 overflow-hidden mb-8">
            <div className={cn(
              "p-6 text-white text-center transition-colors",
              currentFinance.profit >= 0 ? "bg-emerald-600" : "bg-red-600"
            )}>
              <p className="text-white/80 font-medium tracking-wide uppercase text-sm mb-2">
                {getDateHeader(selectedDate)} Profit
              </p>
              <h2 className="text-5xl font-bold">
                ₹{currentFinance.profit.toFixed(2)}
              </h2>
            </div>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Breakdown</h3>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Revenue (Total Bills)</span>
                <span className="font-bold text-slate-800">
                  ₹{currentFinance.revenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Total Expenses</span>
                <span className="font-bold text-red-500">
                  -₹{currentFinance.totalExpenses.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar Calendar */}
      <div className="w-80 bg-white border-l shadow-[-10px_0_30px_rgba(0,0,0,0.02)] hidden lg:flex flex-col p-6 z-10">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
          History
        </h3>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <input
            type="date"
            className="w-full bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recorded Dates</p>
          {sortedDates.map(dateStr => {
            const finance = calculateFinance(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex justify-between items-center ${
                  selectedDate === dateStr
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span>{getDateHeader(dateStr)}</span>
                <span className={cn(
                  "font-bold",
                  finance.profit >= 0 ? "text-emerald-600" : "text-red-500"
                )}>
                  ₹{finance.profit.toFixed(0)}
                </span>
              </button>
            )
          })}
          {sortedDates.length === 0 && (
            <p className="text-sm text-slate-500">No finance data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
