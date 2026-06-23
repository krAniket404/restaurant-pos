'use client';
import React, { useState, useEffect } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { fetchRestaurantDetails } from '../../../lib/sanity/client';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { BillPreview } from '../../../components/cashier/BillPreview';
import { MenuModal } from '../../../components/supervisor/MenuModal';
import { Order } from '../../../types';
import { Receipt, Plus } from 'lucide-react';

export default function CashierBillingPage() {
  const { orders, updateOrderStatus } = useOrderStore();
  const [restaurantName, setRestaurantName] = useState('Garam Masala Restaurant');
  const [selectedOrders, setSelectedOrders] = useState<Order[] | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurantDetails()
      .then(res => { if (res?.name) setRestaurantName(res.name); })
      .catch(console.error);
  }, []);

  // Ready to bill = "served" status
  const readyOrders = orders.filter(o => o.status === 'served');

  const tablesWithOrders = readyOrders.reduce((acc, order) => {
    if (!acc[order.tableNumber]) {
      acc[order.tableNumber] = [];
    }
    acc[order.tableNumber].push(order);
    return acc;
  }, {} as Record<number, Order[]>);

  const mergedTables = Object.entries(tablesWithOrders).map(([tableNumberStr, tableOrders]) => {
    const tableNumber = parseInt(tableNumberStr);
    const total = tableOrders.reduce((sum, o) => sum + o.total, 0);
    const itemsCount = tableOrders.reduce((sum, o) => sum + o.items.length, 0);
    const earliestTime = Math.min(...tableOrders.map(o => o.createdAt));
    const latestServeTime = Math.max(...tableOrders.map(o => o.updatedAt));
    return {
      tableNumber,
      orders: tableOrders,
      total,
      itemsCount,
      earliestTime,
      latestServeTime
    };
  }).sort((a, b) => a.latestServeTime - b.latestServeTime);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800">Ready to Bill</h1>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold text-sm">
            {mergedTables.length} Tables Pending
          </span>
        </div>
        <Button 
          onClick={() => setIsMenuModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Parcel Order
        </Button>
      </div>

      {mergedTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-300">
          <Receipt className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-500 text-lg">No tables waiting to be billed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mergedTables.map(merged => (
            <Card key={merged.tableNumber} className="flex flex-col hover:shadow-lg transition-shadow">
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Table {merged.tableNumber}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(merged.earliestTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">₹{merged.total}</span>
                  <p className="text-xs text-slate-400 mt-1">{merged.itemsCount} items</p>
                </div>
              </div>
              <CardContent className="p-6 mt-auto">
                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                  onClick={() => setSelectedOrders(merged.orders)}
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
        isOpen={!!selectedOrders}
        onClose={() => setSelectedOrders(null)}
        orders={selectedOrders}
        restaurantName={restaurantName}
        onMarkPaid={async (orderIds) => {
          if (selectedOrders && selectedOrders.length > 0) {
            const primaryOrder = selectedOrders[0];
            const allItems = selectedOrders.flatMap(o => o.items);
            const mergedItems = Object.values(allItems.reduce((acc, item) => {
              const key = `${item.menuItemId}-${(item.instructions || []).join('|')}`;
              if (!acc[key]) {
                acc[key] = { ...item };
              } else {
                acc[key].quantity += item.quantity;
              }
              return acc;
            }, {} as Record<string, typeof allItems[0]>) || {});
            
            const total = selectedOrders.reduce((sum, o) => sum + o.total, 0);

            // Update primary order to contain all aggregated items and total, and set status to paid
            await useOrderStore.getState().updateOrderItems(primaryOrder.id, mergedItems, total, 'paid', false);

            // Delete the rest of the merged orders
            for (let i = 1; i < selectedOrders.length; i++) {
              await useOrderStore.getState().deleteOrder(selectedOrders[i].id);
            }
          }
        }}
      />

      {isMenuModalOpen && (
        <MenuModal
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          isParcel={true}
        />
      )}
    </div>
  );
}
