'use client';
import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../../../../store/useOrderStore';
import { OrderStatus, Order } from '../../../../types';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { MenuModal } from '../../../../components/waiter/MenuModal';

export default function WaiterOrdersPage({ params }: { params: Promise<{ status: string }> }) {
  const { orders, updateOrderStatus, deleteOrder } = useOrderStore();
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [modifyingOrder, setModifyingOrder] = useState<Order | null>(null);

  useEffect(() => {
    params.then(p => setStatus(p.status as OrderStatus));
  }, [params]);

  if (!status) return null;

  const filteredOrders = orders.filter(o => o.status === status);

  const getStatusTitle = () => {
    switch (status) {
      case 'requested': return 'Requested Orders';
      case 'in_queue': return 'Orders in Queue';
      case 'on_hold': return 'Orders On Hold';
      case 'preparing': return 'Currently Preparing';
      case 'prepared': return 'Ready to Serve';
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
            <Card key={order.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-100 p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg text-slate-800">Table {order.tableNumber}</span>
                  {order.isModified && status === 'requested' && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                      Modified
                    </span>
                  )}
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
                          {item.instructions && <span className="text-xs text-slate-500 italic">Note: {item.instructions}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {status === 'on_hold' && (
                  <div className="flex flex-col space-y-3 mb-4">
                    {order.holdReason && (
                      <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        <span className="font-semibold">Reason:</span> {order.holdReason}
                      </div>
                    )}
                    <div className="flex space-x-3 w-full">
                      <Button 
                        variant="outline"
                        className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-700 text-slate-700"
                        onClick={() => setModifyingOrder(order)}
                      >
                        Modify
                      </Button>
                      <Button 
                        variant="danger"
                        className="flex-1"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this order?")) {
                            deleteOrder(order.id);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {status === 'prepared' && (
                  <Button 
                    className="w-full"
                    onClick={() => updateOrderStatus(order.id, 'served')}
                  >
                    Mark Served
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modifyingOrder && (
        <MenuModal 
          isOpen={true}
          onClose={() => setModifyingOrder(null)}
          tableNumber={modifyingOrder.tableNumber}
          mode="modify"
          existingOrders={[modifyingOrder]}
        />
      )}
    </div>
  );
}
