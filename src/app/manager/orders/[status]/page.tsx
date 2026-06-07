'use client';
import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../../../../store/useOrderStore';
import { OrderStatus } from '../../../../types';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { RejectModal } from '../../../../components/kitchen/RejectModal';

export default function KitchenOrdersPage({ params }: { params: Promise<{ status: string }> }) {
  const { orders, updateOrderStatus } = useOrderStore();
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setStatus(p.status as OrderStatus));
  }, [params]);

  if (!status) return null;

  const filteredOrders = orders.filter(o => o.status === status);

  const getStatusTitle = () => {
    switch (status) {
      case 'requested': return 'New Requests';
      case 'in_queue': return 'In Queue';
      case 'on_hold': return 'On Hold';
      case 'preparing': return 'Currently Cooking';
      case 'prepared': return 'Ready for Pickup';
      case 'served': return 'Served Orders';
      default: return 'Orders';
    }
  };

  const activeOrder = orders.find(o => o.id === rejectingOrder);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">{getStatusTitle()}</h1>
      
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-lg">No orders in this queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => (
            <Card key={order.id} className="border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-slate-800 text-white p-4 border-b flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">Table {order.tableNumber}</span>
                  <div className="text-xs text-slate-400 mt-1">Order #{order.id.slice(-6).toUpperCase()}</div>
                </div>
                <span className="text-sm font-medium bg-slate-700 px-2 py-1 rounded">
                  {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="space-y-3 mb-6 flex-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex space-x-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs h-fit">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-medium">{item.name}</span>
                          {item.instructions && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1 inline-block">Note: {item.instructions}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {status === 'requested' && (
                  <div className="flex space-x-2 mt-auto pt-4">
                    <Button 
                      variant="danger" 
                      className="flex-1"
                      onClick={() => setRejectingOrder(order.id)}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateOrderStatus(order.id, 'in_queue')}
                    >
                      Accept
                    </Button>
                  </div>
                )}

                {status === 'in_queue' && (
                  <div className="mt-auto pt-4">
                    <Button 
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  </div>
                )}

                {status === 'preparing' && (
                  <div className="mt-auto pt-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateOrderStatus(order.id, 'prepared')}
                    >
                      Mark Ready
                    </Button>
                  </div>
                )}

                {status === 'prepared' && (
                  <div className="mt-auto pt-4 text-center">
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-full inline-block w-full border border-green-200">
                      Waiting for pickup
                    </span>
                  </div>
                )}
                
                {status === 'on_hold' && order.holdReason && (
                   <div className="mt-auto pt-4">
                     <span className="text-sm text-red-600 bg-red-50 p-2 rounded block border border-red-100">{order.holdReason}</span>
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rejectingOrder && activeOrder && (
        <RejectModal 
          isOpen={true} 
          onClose={() => setRejectingOrder(null)} 
          orderId={rejectingOrder}
          items={activeOrder.items}
          onConfirm={(reason) => updateOrderStatus(rejectingOrder, 'on_hold', reason)}
        />
      )}
    </div>
  );
}
