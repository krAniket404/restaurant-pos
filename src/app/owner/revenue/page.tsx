'use client';
import React, { useState } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Calendar as CalendarIcon, IndianRupee } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export default function RevenuePage() {
  const { orders } = useOrderStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Group orders by date
  const groupedOrders: Record<string, typeof orders> = {};

  orders.forEach(order => {
    if (order.status !== 'paid') return; // Only count paid orders for revenue
    const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateStr]) groupedOrders[dateStr] = [];
    groupedOrders[dateStr].push(order);
  });

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'do MMMM yyyy');
  };

  const calculateRevenue = (dateStr: string) => {
    const dateOrders = groupedOrders[dateStr] || [];
    return dateOrders.reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
          <IndianRupee className="w-8 h-8 mr-3 text-indigo-600" />
          Revenue Generated
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
            <div className="bg-indigo-600 p-6 text-white text-center">
              <p className="text-indigo-100 font-medium tracking-wide uppercase text-sm mb-2">
                {getDateHeader(selectedDate)}
              </p>
              <h2 className="text-5xl font-bold">
                ₹{calculateRevenue(selectedDate).toFixed(2)}
              </h2>
            </div>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Summary</h3>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Total Paid Orders</span>
                <span className="font-bold text-slate-800">
                  {groupedOrders[selectedDate]?.length || 0}
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
          {sortedDates.map(dateStr => (
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
              <span className="font-bold">₹{calculateRevenue(dateStr).toFixed(0)}</span>
            </button>
          ))}
          {sortedDates.length === 0 && (
            <p className="text-sm text-slate-500">No revenue data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
