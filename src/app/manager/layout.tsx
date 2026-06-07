'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, ChefHat, AlertCircle, Flame, CheckCircle, Utensils, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../components/ui/Button';
import { useOrderStore } from '../../store/useOrderStore';

const navItems = [
  { href: '/manager/orders/requested', label: 'Requested', icon: Clock, status: 'requested' },
  { href: '/manager/orders/in_queue', label: 'In Queue', icon: ChefHat, status: 'in_queue' },
  { href: '/manager/orders/on_hold', label: 'On Hold', icon: AlertCircle, status: 'on_hold' },
  { href: '/manager/orders/preparing', label: 'Preparing', icon: Flame, status: 'preparing' },
  { href: '/manager/orders/prepared', label: 'Prepared', icon: CheckCircle, status: 'prepared' },
  { href: '/manager/orders/served', label: 'Served', icon: Utensils, status: 'served' },
];

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { orders, subscribeToOrders, lastSeen, markStatusSeen } = useOrderStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    const activeItem = navItems.find(item => item.href === pathname);
    if (activeItem && activeItem.status) {
      markStatusSeen(activeItem.status);
    }
  }, [pathname, markStatusSeen]);

  useEffect(() => {
    if (!user || user.role !== 'manager') {
      router.push('/');
    }
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [user, router, subscribeToOrders]);

  if (!user) return null;

  // Compute unseen notifications
  const validStatuses = navItems.map(item => item.status).filter(Boolean);
  const pendingCount = orders.filter(o => 
    validStatuses.includes(o.status) && 
    o.updatedAt > (lastSeen[o.status] || 0)
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 w-64 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white flex items-center justify-between">
            Manager
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingCount} New</span>
            )}
          </h2>
          <p className="text-sm text-slate-400 capitalize mt-1">{user.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const count = orders.filter(o => o.status === item.status).length;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-orange-500 text-white shadow-md" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                  )}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-slate-800 hover:text-red-400 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col relative w-full">
        <header className="bg-white border-b px-6 py-4 flex items-center shadow-sm z-10 shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 mr-4 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors relative"
          >
            <Menu className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white translate-x-1/2 -translate-y-1/4">
                {pendingCount}
              </span>
            )}
          </button>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        </header>
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
