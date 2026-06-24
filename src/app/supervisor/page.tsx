'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { fetchTables } from '../../lib/sanity/client';
import { Table as TableType } from '../../types';
import { useOrderStore } from '../../store/useOrderStore';
import { cn } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { MenuModal } from '../../components/supervisor/MenuModal';
import { useRouter } from 'next/navigation';

export default function SupervisorDashboard() {
  const [tables, setTables] = useState<TableType[]>([]);
  const { orders } = useOrderStore();
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTables().then(setTables).catch(console.error);
  }, []);

  const getTableColor = (tableNumber: number) => {
    const tableOrders = orders.filter(o => o.tableNumber === tableNumber && o.status !== 'paid');
    if (tableOrders.length === 0) return 'bg-white border-slate-200/50 text-slate-700 hover:border-slate-300/50';

    const statuses = tableOrders.map(o => o.status);
    if (statuses.includes('requested')) return 'bg-yellow-100 border-yellow-300/50 text-yellow-800';
    if (statuses.includes('served')) return 'bg-blue-100 border-blue-300/50 text-blue-800';

    return 'bg-slate-100 border-slate-300/50';
  };

  const handleTableClick = (table: TableType) => {
    setSelectedTable(table);
    setIsActionModalOpen(true);
  };

  const activeOrders = useMemo(() => {
    if (!selectedTable) return [];
    return orders.filter(o => o.tableNumber === selectedTable.tableNumber && o.status !== 'paid');
  }, [orders, selectedTable]);

  const canCreate = activeOrders.length === 0 || activeOrders.every(o => o.status === 'served');
  // actually, multiple orders can exist. Waiter can create new order anytime to add more?
  // Prompt says: "Since the table is not associated with any orders yet, modify and cancel should be disabled. After waiter clicks create new order...". Wait, if there IS an active order, "create new order" should be disabled and "modify" enabled.

  const hasActiveOrder = activeOrders.length > 0;

  const handleCreateOrder = () => {
    setIsActionModalOpen(false);
    setIsMenuModalOpen(true);
  };

  const handleCancelOrder = async () => {
    const { deleteOrder } = useOrderStore.getState();
    if (activeOrders.length > 0) {
      if (window.confirm('Are you sure you want to cancel the order(s) for this table?')) {
        for (const order of activeOrders) {
          deleteOrder(order.id);
        }
        setIsActionModalOpen(false);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">All Tables</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tables.map(table => (
          <button
            key={table._id}
            onClick={() => handleTableClick(table)}
            className={cn(
              "aspect-square rounded-3xl border flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-rose-500/30",
              getTableColor(table.tableNumber)
            )}
          >
            <span className="text-4xl font-bold mb-2">{table.tableNumber}</span>
          </button>
        ))}
      </div>

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`Table ${selectedTable?.tableNumber} Actions`}
      >
        <div className="flex flex-col space-y-4">
          <Button
            size="lg"
            onClick={handleCreateOrder}
          >
            Create New Order
          </Button>
          <Button
            size="lg"
            variant="danger"
            onClick={handleCancelOrder}
            disabled={!hasActiveOrder || activeOrders.some(o => ['served', 'paid'].includes(o.status))}
          >
            Cancel Order
          </Button>
        </div>
      </Modal>

      {selectedTable && isMenuModalOpen && (
        <MenuModal
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          tableNumber={selectedTable.tableNumber}
        />
      )}
    </div>
  );
}
