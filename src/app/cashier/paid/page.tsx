'use client';
import React, { useState } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Order } from '../../../types';
import { CheckCircle, Eye } from 'lucide-react';

export default function CashierPaidPage() {
  const { orders } = useOrderStore();
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Filter for 'paid' status and today's date
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const paidOrders = orders.filter(o => 
    o.status === 'paid' && 
    o.updatedAt >= todayStart.getTime()
  ).sort((a, b) => b.updatedAt - a.updatedAt); // newest first

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Paid Today</h1>
        <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full font-semibold">
          {paidOrders.length}
        </span>
      </div>

      {paidOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <CheckCircle className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-500 text-lg">No orders paid today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paidOrders.map(order => (
            <Card key={order.id} className="border border-slate-200 shadow-sm flex flex-col bg-white">
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Table {order.tableNumber}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(order.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">₹{order.total}</span>
                  <p className="text-xs text-slate-400 mt-1">{order.items.length} items</p>
                </div>
              </div>
              <CardContent className="p-6 mt-auto">
                <Button 
                  className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none font-semibold"
                  onClick={() => setViewingOrder(order)}
                >
                  Paid <span className="ml-2 font-serif text-lg">₹</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Order Modal */}
      <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Order Details - Table ${viewingOrder?.tableNumber}`}>
        {viewingOrder && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-500 border-b pb-2">
              <span>Order #{viewingOrder.id}</span>
              <span>{new Date(viewingOrder.updatedAt).toLocaleString()}</span>
            </div>
            <div className="space-y-3">
              {viewingOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex space-x-3">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 rounded">{item.quantity}x</span>
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t flex justify-between items-center font-bold text-lg">
              <span>Total Paid</span>
              <span className="text-green-600">₹{viewingOrder.total}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
