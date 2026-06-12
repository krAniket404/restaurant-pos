'use client';
import React, { useEffect, useState, useRef } from 'react';
import { fetchCategories, fetchMenuItems } from '../../lib/sanity/client';
import { Category, MenuItem, OrderItem, Order } from '../../types';
import { X, Plus, Minus, Search, ArrowUp, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { useOrderStore } from '../../store/useOrderStore';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  mode: 'create' | 'modify';
  existingOrders: Order[];
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, tableNumber, mode, existingOrders }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [hasModifications, setHasModifications] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { createOrder, updateOrderItems, deleteOrder } = useOrderStore();

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
    fetchMenuItems().then(setMenuItems).catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      // Load existing items if modifying
      if (mode === 'modify' && existingOrders.length > 0) {
        // Flatten all active items for this table into the cart
        const currentItems = existingOrders.flatMap(o => o.items);
        setCartItems(currentItems);
        setHasModifications(false);
      } else {
        setCartItems([]);
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'unset';
    }
  }, [isOpen, mode, existingOrders]);

  if (!isOpen) return null;

  const filteredItems = menuItems.filter(item => {
    if (dietaryFilter === 'veg' && !item.isVeg) return false;
    if (dietaryFilter === 'non-veg' && item.isVeg) return false;
    if (activeCategory !== 'all' && item.category._id !== activeCategory) return false;
    return true;
  });

  const handleAddItem = (item: MenuItem) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItemId: item._id,
      name: item.title,
      price: item.price,
      quantity: 1,
    };
    // If it's a completely new addition to the same item, just increase qty?
    // Zomato usually groups them unless instructions differ. Let's group for simplicity.
    const existing = cartItems.find(i => i.menuItemId === item._id && (!i.instructions || i.instructions.length === 0));
    if (existing) {
      setCartItems(cartItems.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCartItems([newItem, ...cartItems]);
    }
    setHasModifications(true);
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
    setHasModifications(true);
  };

  const removeItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      setCartItems(cartItems.filter(i => i.id !== id));
      setHasModifications(true);
    }
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
    setHasModifications(true);
  };

  const addInstruction = (id: string) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, instructions: [...(item.instructions || []), ''] };
      }
      return item;
    }));
    setHasModifications(true);
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
    setHasModifications(true);
  };

  const totalCost = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleConfirm = () => {
    if (cartItems.length === 0) return;

    if (mode === 'create') {
      createOrder(tableNumber, cartItems, totalCost);
    } else {
      const primaryOrder = existingOrders[0];

      let itemsAdded = false;
      let itemsRemoved = false;
      let instructionsChanged = false;

      const allOldItems = existingOrders.flatMap(o => o.items);

      for (const newItem of cartItems) {
        const oldItem = allOldItems.find(i => i.id === newItem.id);
        if (!oldItem || newItem.quantity > oldItem.quantity) {
          itemsAdded = true;
        }
        if (oldItem) {
          const oldInst = oldItem.instructions || [];
          const newInst = newItem.instructions || [];
          if (oldInst.length !== newInst.length || oldInst.some((inst, idx) => inst !== newInst[idx])) {
            instructionsChanged = true;
          }
        }
      }

      for (const oldItem of allOldItems) {
        const newItem = cartItems.find(i => i.id === oldItem.id);
        if (!newItem || newItem.quantity < oldItem.quantity) {
          itemsRemoved = true;
        }
      }

      // Delete other orders to consolidate them into primaryOrder
      for (let i = 1; i < existingOrders.length; i++) {
        deleteOrder(existingOrders[i].id);
      }

      if (itemsAdded || instructionsChanged) {
        updateOrderItems(primaryOrder.id, cartItems, totalCost, 'requested', true);
      } else if (itemsRemoved && primaryOrder.status === 'on_hold') {
        updateOrderItems(primaryOrder.id, cartItems, totalCost, 'requested', true);
      } else {
        updateOrderItems(primaryOrder.id, cartItems, totalCost, primaryOrder.status, primaryOrder.isModified || false);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-x-0 top-0 h-[100dvh] z-50 bg-slate-50 flex flex-col sm:p-4">
      <div className="bg-white flex-1 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-w-5xl mx-auto w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-black/25" ref={topRef}>
          <h2 className="text-2xl font-bold text-slate-800">
            {mode === 'create' ? 'New Order' : 'Modify Order'} - Table {tableNumber}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area - Cart at Top, Menu Below */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 sm:p-6 pb-32 sm:pb-32" ref={scrollRef}>

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
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-4 border-b border-slate-100 mb-6">
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
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat._id ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item._id} className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col p-5">
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center bg-white shadow-sm border ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{item.title}</h4>
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
        <div className="absolute bottom-0 w-full bg-white border-t p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between z-10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500">Total Amount</span>
            <span className="text-2xl font-bold text-slate-800">₹{totalCost}</span>
          </div>
          <div className="flex items-center space-x-4">
            {mode === 'modify' && (
              <Button
                variant="outline"
                onClick={onClose}
                disabled={hasModifications}
              >
                Continue without changes
              </Button>
            )}
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={mode === 'modify' ? !hasModifications : cartItems.length === 0}
            >
              {mode === 'create' ? 'Confirm Order' : 'Confirm Changes'}
            </Button>
          </div>
        </div>

        {/* Jump to top button */}
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute bottom-28 right-6 bg-slate-800 text-white p-3 rounded-full shadow-xl hover:bg-slate-700 transition-colors z-20"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};
