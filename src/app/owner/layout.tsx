'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { History, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { cn } from '../../components/ui/Button';

const navItems = [
  { href: '/owner', label: 'Order History', icon: History },
  // Future extensions
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { orders, subscribeToOrders, lastSeen, markStatusSeen } = useOrderStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = navItems.findIndex(item => item.href === pathname);
      if (currentIndex === -1) return;

      if (isLeftSwipe && currentIndex < navItems.length - 1) {
        router.push(navItems[currentIndex + 1].href);
      } else if (isRightSwipe && currentIndex > 0) {
        router.push(navItems[currentIndex - 1].href);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname === '/owner') {
      markStatusSeen('all');
    }
  }, [pathname, markStatusSeen]);

  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== 'owner') {
        router.push('/');
      }
    }
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [user, router, subscribeToOrders, mounted]);

  if (!mounted || !user || user.role !== 'owner') return null;

  const unseenCount = orders.filter(o => o.updatedAt > (lastSeen['all'] || 0)).length;

  return (
    <div 
      className="flex h-screen overflow-hidden bg-slate-50 relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-indigo-900 text-slate-300 flex flex-col shadow-2xl z-50 w-64 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-indigo-800 relative">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-6 right-4 text-indigo-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white pr-8">Owner Panel</h2>
          <p className="text-sm text-indigo-300 capitalize mt-1">{user.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-white text-indigo-900 shadow-md" 
                    : "hover:bg-indigo-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-indigo-800 hover:text-red-300 rounded-xl transition-colors font-medium"
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
            {unseenCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white translate-x-1/2 -translate-y-1/4">
                {unseenCount}
              </span>
            )}
          </button>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        </header>
        <div className="flex-1 overflow-y-auto relative">
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
