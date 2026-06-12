'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, ChefHat, AlertCircle, Flame, CheckCircle, Utensils, LogOut, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../components/ui/Button';
import { useOrderStore } from '../../store/useOrderStore';
import { Order } from '../../types';
import { RejectModal } from '../../components/kitchen/RejectModal';
import { Button } from '../../components/ui/Button';

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
  const { orders, subscribeToOrders, lastSeen, markStatusSeen, updateOrderStatus } = useOrderStore();
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
  
  // Popup notification states
  const [popupOrder, setPopupOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set());
  const mountTime = React.useRef(Date.now());

  useEffect(() => {
    const activeItem = navItems.find(item => item.href === pathname);
    if (activeItem && activeItem.status) {
      markStatusSeen(activeItem.status);
    }
  }, [pathname, markStatusSeen]);

  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      }
    }
    const unsub = subscribeToOrders();
    return () => unsub();
  }, [user, router, subscribeToOrders, mounted]);

  // Check for new requested orders
  useEffect(() => {
    const newRequestedOrders = orders.filter(o => 
      o.status === 'requested' && 
      o.updatedAt > mountTime.current && 
      !notifiedOrders.has(`${o.id}-${o.updatedAt}`)
    );

    if (newRequestedOrders.length > 0 && !popupOrder) {
      setPopupOrder(newRequestedOrders[0]);
    }
  }, [orders, notifiedOrders, popupOrder]);

  // Dismiss popup if the order is accepted/rejected elsewhere
  useEffect(() => {
    if (popupOrder) {
      const currentOrder = orders.find(o => o.id === popupOrder.id);
      if (!currentOrder || currentOrder.status !== 'requested') {
        setPopupOrder(null);
      }
    }
  }, [orders, popupOrder]);

  if (!mounted || !user || user.role !== 'manager') return null;

  // Compute unseen notifications
  const validStatuses = navItems.map(item => item.status).filter(Boolean);
  const pendingCount = orders.filter(o => 
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
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 w-64 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800 relative">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 z-50"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center justify-between pr-8">
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

      {/* Global Popup for Requested Orders */}
      {popupOrder && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-2xl shadow-2xl border-2 border-orange-500 p-4 w-[90%] max-w-md animate-in slide-in-from-top-10 fade-in duration-300 cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={() => {
            router.push('/manager/orders/requested');
            setNotifiedOrders(prev => new Set(prev).add(`${popupOrder.id}-${popupOrder.updatedAt}`));
            setPopupOrder(null);
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-slate-800">New Order - Table {popupOrder.tableNumber}</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNotifiedOrders(prev => new Set(prev).add(`${popupOrder.id}-${popupOrder.updatedAt}`));
                setPopupOrder(null);
              }} 
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-slate-600 mb-4 max-h-32 overflow-y-auto">
            {popupOrder.items.map((item, idx) => (
              <div key={idx} className="flex flex-col border-b border-slate-100 py-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800">{item.quantity}x {item.name}</span>
                </div>
                {(item.instructions || []).map((inst, i) => (
                  <span key={i} className="text-xs text-orange-600 bg-orange-100/50 px-2 py-1 rounded mt-1 w-fit">Note: {inst}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="danger" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setNotifiedOrders(prev => new Set(prev).add(`${popupOrder.id}-${popupOrder.updatedAt}`));
                setRejectingOrder(popupOrder);
                setPopupOrder(null);
              }}
            >
              Reject
            </Button>
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setNotifiedOrders(prev => new Set(prev).add(`${popupOrder.id}-${popupOrder.updatedAt}`));
                updateOrderStatus(popupOrder.id, 'in_queue');
                setPopupOrder(null);
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingOrder && (
        <RejectModal
          isOpen={!!rejectingOrder}
          onClose={() => setRejectingOrder(null)}
          orderId={rejectingOrder.id}
          items={rejectingOrder.items}
          onConfirm={async (reason) => {
            await updateOrderStatus(rejectingOrder.id, 'on_hold', reason);
          }}
        />
      )}
    </div>
  );
}
