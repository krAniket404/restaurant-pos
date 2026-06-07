'use client';
import React, { useState, useEffect } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { fetchRestaurantDetails } from '../../../lib/sanity/client';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { BillPreview } from '../../../components/cashier/BillPreview';
import { Order } from '../../../types';
import { Receipt } from 'lucide-react';

export default function CashierBillingPage() {
  const { orders, updateOrderStatus } = useOrderStore();
  const [restaurantName, setRestaurantName] = useState('Garam Masala Restaurant');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchRestaurantDetails()
      .then(res => { if (res?.name) setRestaurantName(res.name); })
      .catch(console.error);
  }, []);

  // Ready to bill = "served" status
  const readyOrders = orders.filter(o => o.status === 'served');

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Ready to Bill</h1>
        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
          {readyOrders.length} Pending
        </span>
      </div>

      {readyOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <Receipt className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-500 text-lg">No orders waiting to be billed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {readyOrders.map(order => (
            <Card key={order.id} className="border border-slate-200 shadow-sm flex flex-col hover:shadow-lg transition-shadow bg-white">
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Table {order.tableNumber}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">₹{order.total}</span>
                  <p className="text-xs text-slate-400 mt-1">{order.items.length} items</p>
                </div>
              </div>
              <CardContent className="p-6 mt-auto">
                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Bill
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BillPreview 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        restaurantName={restaurantName}
        onMarkPaid={(id) => updateOrderStatus(id, 'paid')}
      />
    </div>
  );
}
