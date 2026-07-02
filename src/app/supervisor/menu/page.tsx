'use client';
import React, { useEffect, useState } from 'react';
import { getCategories, getMenuItems, updateMenuItem } from '../../../lib/firebase/db';
import { Category, MenuItem } from '../../../types';
import { Search } from 'lucide-react';

export default function MenuAvailabilityPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getMenuItems().then(setMenuItems).catch(console.error);
  }, []);

  const toggleAvailability = async (item: MenuItem) => {
    const newStatus = item.isAvailable === false ? true : false;
    
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: newStatus } : i));
    setLoadingItems(prev => new Set(prev).add(item.id));

    try {
      await updateMenuItem(item.id, { isAvailable: newStatus });
    } catch (error) {
      console.error(error);
      // Revert on failure
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !newStatus } : i));
      alert('Failed to update availability. Please try again.');
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (activeCategory !== 'all' && item.categoryId !== activeCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Menu Availability</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-8">No menu items found.</p>
          ) : filteredItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="text-sm text-slate-500">₹{item.price}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={item.isAvailable !== false}
                  onChange={() => toggleAvailability(item)}
                  disabled={loadingItems.has(item.id)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
