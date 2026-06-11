'use client';
import React, { useState } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Order } from '../../../types';
import { CheckCircle, Eye, Printer } from 'lucide-react';
import { BillPreview } from '../../../components/cashier/BillPreview';

export default function CashierPaidPage() {
  const { orders } = useOrderStore();
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState('Garam Masala Restaurant');

  React.useEffect(() => {
    import('../../../lib/sanity/client').then(({ fetchRestaurantDetails }) => {
      fetchRestaurantDetails().then(res => { if (res?.name) setRestaurantName(res.name); }).catch(console.error);
    });
  }, []);

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
            <Card key={order.id} className="flex flex-col">
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
              <CardContent className="p-6 mt-auto flex space-x-3">
                <Button 
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none font-semibold"
                  onClick={() => setViewingOrder(order)}
                >
                  Paid <span className="ml-2 font-serif text-lg">₹</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex-none px-4"
                  onClick={() => setViewingOrder(order)}
                >
                  <Printer className="w-5 h-5 text-slate-600" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Order Modal */}
      <BillPreview
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        orders={viewingOrder ? [viewingOrder] : null}
        restaurantName={restaurantName}
      />
    </div>
  );
}
