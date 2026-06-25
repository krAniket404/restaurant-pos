-'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Clock,
  ChefHat,
  Utensils,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../components/ui/Button';
import { useOrderStore } from '../../store/useOrderStore';

const navItems = [
  { href: '/supervisor', label: 'All Tables', icon: LayoutGrid, countStatus: null },
  { href: '/supervisor/orders/requested', label: 'Requested', icon: Clock, countStatus: 'requested' },
  { href: '/supervisor/orders/served', label: 'Served', icon: Utensils, countStatus: 'served' },
  { href: '/supervisor/menu', label: 'Menu Availability', icon: ChefHat, countStatus: null },
];

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { orders, subscribeToOrders, lastSeen, markStatusSeen } = useOrderStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    if (activeItem && activeItem.countStatus) {
      markStatusSeen(activeItem.countStatus);
    }
  }, [pathname, markStatusSeen]);

  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== 'supervisor') {
        router.push('/');
      }
    }
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [user, router, subscribeToOrders, mounted]);



  if (!mounted || !user || user.role !== 'supervisor') return null;

  const validStatuses = navItems.map(item => item.countStatus).filter(Boolean);
  const unseenCount = orders.filter(o =>
    validStatuses.includes(o.status) &&
    o.updatedAt > (lastSeen[o.status] || 0)
  ).length;

  return (
    <div
      className="flex h-[100dvh] overflow-hidden bg-slate-50 relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-50 w-72 transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl relative">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-5 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 z-50"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
          <div className="flex items-center space-x-4 mb-1 pr-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Supervisor Panel</h2>
              <p className="text-xs text-rose-400 font-medium capitalize">@{user.username}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const count = item.countStatus ? orders.filter(o => o.status === item.countStatus).length : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 font-medium group",
                  isActive
                    ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-rose-400"
                  )} />
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-bold shadow-sm",
                    isActive ? "bg-white/20 text-white" : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                  )}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center space-x-3 w-full px-4 py-3.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all duration-300 font-medium group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col relative w-full">
        <header className="bg-white px-6 py-4 flex items-center shadow-md z-10 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
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
          <div key={pathname} ref={contentRef} className="h-full pb-24">
            {children}
          </div>
        </div>
      </main>


    </div>
  );
}
