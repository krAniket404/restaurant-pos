'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getCategories, getMenuItems } from '../../lib/firebase/db';
import { Category, MenuItem, OrderItem, Order } from '../../types';
import { X, Plus, Minus, Search, ArrowUp, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { useOrderStore } from '../../store/useOrderStore';
import { BillPreview } from '../cashier/BillPreview';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber?: number; // Optional now for parcel
  isParcel?: boolean;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, tableNumber, isParcel }) => {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & UI state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrderToPrint, setConfirmedOrderToPrint] = useState<Order | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { createOrder } = useOrderStore();

  useEffect(() => {
    setMounted(true);
    getCategories().then(setCategories).catch(console.error);
    getMenuItems().then(setMenuItems).catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCartItems([]);
      setShowConfirmation(false);
      setConfirmedOrderToPrint(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const filteredItems = menuItems.filter(item => {
    if (item.isAvailable === false) return false;
    if (dietaryFilter === 'veg' && item.dietType !== 'veg') return false;
    if (dietaryFilter === 'non-veg' && item.dietType !== 'non-veg') return false;
    if (activeCategory !== 'all' && item.categoryId !== activeCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddItem = (item: MenuItem) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    };
    const existing = cartItems.find(i => i.menuItemId === item.id && (!i.instructions || i.instructions.length === 0));
    if (existing) {
      setCartItems(cartItems.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCartItems([newItem, ...cartItems]);
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(i => i.id !== id));
  };

  const updateInstruction = (id: string, index: number, text: string) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newInstructions = [...(item.instructions || [])];
        newInstructions[index] = text;
        return { ...item, instructions: newInstructions };
      }
      return item;
    }));
  };

  const addInstruction = (id: string) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, instructions: [...(item.instructions || []), ''] };
      }
      return item;
    }));
  };

  const removeInstruction = (id: string, index: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newInstructions = [...(item.instructions || [])];
        newInstructions.splice(index, 1);
        return { ...item, instructions: newInstructions };
      }
      return item;
    }));
  };

  const totalCost = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrderClick = () => {
    if (cartItems.length === 0) return;
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    const tNum = isParcel ? 0 : (tableNumber || 0);
    
    // We create a mock order object to pass to BillPreview for printing immediately
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      tableNumber: tNum,
      status: 'requested',
      items: cartItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      total: totalCost,
    };
    
    await createOrder(tNum, cartItems, totalCost);
    setConfirmedOrderToPrint(newOrder);
  };

  // If a bill is ready to print, we show the BillPreview instead of the menu
  if (confirmedOrderToPrint) {
    return (
      <BillPreview 
        isOpen={true} 
        onClose={onClose} 
        orders={[confirmedOrderToPrint]} 
        restaurantName="Restaurant POS" 
        isParcel={isParcel}
      />
    );
  }

  return createPortal(
    <div className="fixed inset-0 top-0 z-[9999] bg-slate-50 flex flex-col sm:p-4" style={{ height: '100dvh' }}>
      <div className="bg-white flex-1 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-w-5xl mx-auto w-full relative" style={{ minHeight: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-black/25" ref={topRef}>
          <h2 className="text-2xl font-bold text-slate-800">
            {isParcel ? 'New Parcel Order' : `New Order - Table ${tableNumber}`}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showConfirmation ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Confirm Order</h3>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b pb-2">
                    <div>
                      <span className="font-semibold text-slate-800">{item.quantity}x {item.name}</span>
                      {(item.instructions || []).map((inst, i) => (
                        <div key={i} className="text-xs text-slate-500 italic ml-4">- {inst}</div>
                      ))}
                    </div>
                    <span className="font-semibold text-slate-600">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-xl mb-8 pt-4 border-t">
                <span>Total</span>
                <span>₹{totalCost}</span>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmation(false)}>Back</Button>
                <Button className="flex-1" onClick={handleConfirmOrder}>Confirm & Print</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Content Area - Cart at Top, Menu Below */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 sm:p-6" ref={scrollRef} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>

              {/* Current Cart Items */}
              {cartItems.length > 0 && (
                <div className="mb-8 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <h3 className="font-semibold text-lg text-orange-900 mb-4">Current Order</h3>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <span className="font-semibold text-orange-600">₹{item.price * item.quantity}</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            {(item.instructions || []).map((inst, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="Add cooking instructions..."
                                  className="text-sm bg-slate-50 border-none outline-none w-full p-2 rounded-lg text-slate-600 focus:ring-1 focus:ring-orange-300"
                                  value={inst}
                                  onChange={(e) => updateInstruction(item.id, idx, e.target.value)}
                                />
                                <button onClick={() => removeInstruction(item.id, idx)} className="text-slate-400 hover:text-red-500">
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addInstruction(item.id)} className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center">
                              <Plus className="w-3 h-3 mr-1" /> Add Instruction
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters & Categories */}
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-4 border-b border-slate-100 mb-6 flex flex-col gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
                  <button
                    onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full cursor-pointer transition-colors whitespace-nowrap border ${dietaryFilter === 'veg' ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Veg Only</span>
                  </button>
                  <button
                    onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full cursor-pointer transition-colors whitespace-nowrap border ${dietaryFilter === 'non-veg' ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Non-Veg Only</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500">No menu items found.</div>
                ) : filteredItems.map(item => (
                  <div key={item.id} className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col p-5">
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center bg-white shadow-sm border ${item.dietType === 'veg' ? 'border-green-500' : 'border-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${item.dietType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                          <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{item.name}</h4>
                        </div>
                        <span className="font-bold text-orange-600 ml-2">₹{item.price}</span>
                      </div>
                      {item.description && <p className="text-sm text-slate-500 line-clamp-2 mb-4">{item.description}</p>}
                      <div className="mt-auto">
                        <Button
                          variant="secondary"
                          className="w-full font-bold"
                          onClick={() => handleAddItem(item)}
                        >
                          ADD +
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom Bar Actions */}
            <div className="w-full bg-white border-t p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between z-10 shrink-0" style={{ paddingBottom: 'max(1rem, calc(0.5rem + env(safe-area-inset-bottom)))' }}>
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">Total Amount</span>
                <span className="text-2xl font-bold text-slate-800">₹{totalCost}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  size="lg"
                  onClick={handlePlaceOrderClick}
                  disabled={cartItems.length === 0}
                >
                  Place Order
                </Button>
              </div>
            </div>

            {/* Jump to top button */}
            <button
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="absolute bottom-24 right-6 bg-slate-800 text-white p-3 rounded-full shadow-xl hover:bg-slate-700 transition-colors z-20"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
