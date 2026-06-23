'use client';
import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../../../../store/useOrderStore';
import { OrderStatus, Order } from '../../../../types';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { MenuModal } from '../../../../components/supervisor/MenuModal';

export default function SupervisorOrdersPage({ params }: { params: Promise<{ status: string }> }) {
  const { orders, updateOrderStatus, deleteOrder } = useOrderStore();
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    params.then(p => setStatus(p.status as OrderStatus));
  }, [params]);

  if (!status) return null;

  const filteredOrders = orders.filter(o => o.status === status);

  const getStatusTitle = () => {
    switch (status) {
      case 'requested': return 'Requested Orders';
      case 'served': return 'Served Orders';
      default: return 'Orders';
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">{getStatusTitle()}</h1>
      
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-lg">No orders in this queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <div className="bg-slate-100 p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg text-slate-800">Table {order.tableNumber}</span>
                </div>
                <span className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <CardContent className="p-4">
                <div className="space-y-3 mb-6">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex space-x-2">
                        <span className="font-semibold text-orange-600">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-medium">{item.name}</span>
                          {(item.instructions || []).map((inst, idx) => (
                            <span key={idx} className="text-xs text-slate-500 italic">Note: {inst}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {status === 'requested' && (
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'served')}
                    >
                      Mark Served
                    </Button>
                    <Button 
                      variant="danger"
                      className="flex-1 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (window.confirm("Are you sure you want to cancel this order?")) {
                          await deleteOrder(order.id);
                        }
                      }}
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
