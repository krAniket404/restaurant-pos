'use client';
import React, { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/useOrderStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Order } from '../../types';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { BillPreview } from '../../components/cashier/BillPreview';
import { Button } from '@/components/ui/Button';

export default function OwnerDashboard() {
  const { orders, subscribeToOrders } = useOrderStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState('Geethika Restaurant');

  useEffect(() => {
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [subscribeToOrders]);

  // Group orders by date
  const groupedOrders: Record<string, Order[]> = {};

  orders.forEach(order => {
    // Only showing completed orders in history (or all? The prompt says "record of all orders made in the past")
    // Let's include all, or maybe just 'paid' for history, but let's show all for full record.
    const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateStr]) groupedOrders[dateStr] = [];
    groupedOrders[dateStr].push(order);
  });

  // Sort dates descending
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Filter if a specific date is selected and it's not today/yesterday gallery view
  // Wait, prompt says "It should look something like this: ## Today (gallery), ## Yesterday (gallery), ## Date (gallery). On the right side... calendar input to jump"
  // So it's a long scrollable list grouped by date, and calendar jumps to it, or filters it. Let's make calendar filter it for simplicity.

  const displayedDates = selectedDate ? [selectedDate] : sortedDates;

  const getDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'do MMMM yyyy');
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth" id="scroll-container">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Order History</h1>

        {/* Mobile Date Picker */}
        <div className="lg:hidden mb-8 flex items-center justify-between bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500">
            <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
            <span className="font-medium text-sm">Jump to</span>
          </div>
          <input
            type="date"
            className="bg-transparent border-none outline-none font-medium text-slate-800 cursor-pointer"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              const element = document.getElementById(`date-${e.target.value}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>

        {sortedDates.length === 0 ? (
          <p className="text-slate-500">No order history available.</p>
        ) : (
          <div className="space-y-12 pb-12">
            {sortedDates.map(dateStr => {
              const dateOrders = groupedOrders[dateStr].sort((a, b) => b.createdAt - a.createdAt);
              return (
                <div key={dateStr} id={`date-${dateStr}`}>
                  <h2 className="text-2xl font-bold text-slate-700 mb-6 flex items-center">
                    {getDateHeader(dateStr)}
                    <span className="ml-4 text-sm font-medium bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                      {dateOrders.length} orders
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {dateOrders.map(order => (
                      <Card key={order.id} className="hover:shadow-md transition-shadow overflow-hidden group">
                        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                          <span className="font-bold">Table {order.tableNumber}</span>
                          <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-1 mb-4 h-24 overflow-y-auto no-scrollbar">
                            {order.items.map(item => (
                              <div key={item.id} className="text-sm flex justify-between text-slate-600">
                                <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-end border-t pt-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded capitalize bg-slate-100 text-slate-600">
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-slate-800">₹{order.total}</span>
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full mt-4 text-xs h-8"
                            onClick={() => setSelectedOrderForBill(order)}
                          >
                            View Bill
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar Calendar */}
      <div className="w-80 bg-white border-l shadow-[-10px_0_30px_rgba(0,0,0,0.02)] hidden lg:flex flex-col p-6 z-10">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
          Jump to Date
        </h3>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <input
            type="date"
            className="w-full bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              const element = document.getElementById(`date-${e.target.value}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Available Dates</p>
          {sortedDates.map(dateStr => (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                const element = document.getElementById(`date-${dateStr}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${selectedDate === dateStr
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'hover:bg-slate-100 text-slate-600'
                }`}
            >
              {getDateHeader(dateStr)}
            </button>
          ))}
        </div>
      </div>

      {selectedOrderForBill && (
        <BillPreview
          isOpen={true}
          onClose={() => setSelectedOrderForBill(null)}
          orders={[selectedOrderForBill]}
          restaurantName={restaurantName}
          isParcel={selectedOrderForBill.tableNumber === 0}
        />
      )}
    </div>
  );
}
