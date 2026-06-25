'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Receipt, CheckCircle, LogOut, Menu, X, Wallet } from 'lucide-react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../components/ui/Button';
import { useOrderStore } from '../../store/useOrderStore';

const navItems = [
  { href: '/cashier/billing', label: 'Ready to Bill', icon: Receipt, status: 'served' },
  { href: '/cashier/paid', label: 'Paid Today', icon: CheckCircle, status: 'paid' },
  { href: '/cashier/expenses', label: 'Daily Expenses', icon: Wallet, status: null },
];

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { orders, subscribeToOrders, lastSeen, markStatusSeen } = useOrderStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (document.body.style.overflow === 'hidden') return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = navItems.findIndex(item => item.href === pathname);
      if (currentIndex === -1) return;

      if (isLeftSwipe && currentIndex < navItems.length - 1) {
        setSwipeDirection('left');
        router.push(navItems[currentIndex + 1].href);
      } else if (isRightSwipe && currentIndex > 0) {
        setSwipeDirection('right');
        router.push(navItems[currentIndex - 1].href);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const xOffset = swipeDirection === 'left' ? 100 : swipeDirection === 'right' ? -100 : 0;
      const initialY = swipeDirection ? 0 : 20;
      
      gsap.fromTo(contentRef.current, 
        { opacity: 0, x: xOffset, y: initialY },
        { opacity: 1, x: 0, y: 0, duration: 0.5, ease: "power3.out" }
      );
      
      const timer = setTimeout(() => setSwipeDirection(null), 500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const activeItem = navItems.find(item => item.href === pathname);
    if (activeItem && activeItem.status) {
      markStatusSeen(activeItem.status);
    }
  }, [pathname, markStatusSeen]);

  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== 'cashier') {
        router.push('/');
      }
    }
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [user, router, subscribeToOrders, mounted]);

  if (!mounted || !user || user.role !== 'cashier') return null;

  const validStatuses = navItems.map(item => item.status).filter(Boolean);
  const pendingCount = orders.filter(o => {
    if (!validStatuses.includes(o.status)) return false;
    if (o.status === 'paid') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      return o.updatedAt > (lastSeen[o.status] || 0) && o.updatedAt >= todayStart;
    }
    return o.updatedAt > (lastSeen[o.status] || 0);
  }).length;

  return (
    <div 
      className="flex h-[100dvh] overflow-hidden bg-slate-50 relative"
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
        "fixed inset-y-0 left-0 bg-green-900 text-slate-300 flex flex-col shadow-2xl z-50 w-64 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-green-800 relative">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 z-50"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center justify-between pr-8">
            Cashier
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingCount} New</span>
            )}
          </h2>
          <p className="text-sm text-green-200 capitalize mt-1">{user.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const count = item.status === 'paid' 
              ? orders.filter(o => o.status === 'paid' && o.updatedAt >= new Date().setHours(0,0,0,0)).length
              : orders.filter(o => o.status === item.status).length;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-white text-green-900 shadow-md" 
                    : "hover:bg-green-800 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    isActive ? "bg-green-100 text-green-800" : "bg-green-700 text-green-100"
                  )}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-green-800">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-green-800 hover:text-red-300 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col relative w-full">
        <header className="bg-white px-6 py-4 flex items-center shadow-md z-10 shrink-0">
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
          <div key={pathname} ref={contentRef} className="h-full pb-24">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
