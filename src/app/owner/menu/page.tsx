'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, getCategories, addCategory, updateCategory, deleteCategory, MenuItem, Category } from '../../../lib/firebase/db';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Grid, Plus, Pencil, Trash2, Loader2, Tag, Search } from 'lucide-react';

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDiet, setItemDiet] = useState<'veg' | 'non-veg'>('veg');
  const [itemCategoryId, setItemCategoryId] = useState<string>('');
  
  // Category Form State
  const [categoryName, setCategoryName] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedItems, fetchedCategories] = await Promise.all([
        getMenuItems(),
        getCategories()
      ]);
      setItems(fetchedItems);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Category Handlers ---
  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const trimmedName = categoryName.trim();
    const isDuplicate = categories.some(
      cat => cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.id !== editingCategory?.id
    );
    if (isDuplicate) {
      alert('A category with this name already exists.');
      setIsSaving(false);
      return;
    }

    try {
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (editingCategory) {
        await updateCategory(editingCategory.id, trimmedName, slug);
      } else {
        await addCategory(trimmedName, slug);
      }
      setIsCategoryModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const hasItems = items.some(item => item.categoryId === category.id);
    if (hasItems) {
      alert('Cannot delete category because it has menu items associated with it.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
        await fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete category.');
      }
    }
  };

  // --- Item Handlers ---
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemPrice(item.price);
      setItemDiet(item.dietType);
      setItemCategoryId(item.categoryId || (categories.length > 0 ? categories[0].id : ''));
    } else {
      setEditingItem(null);
      setItemName('');
      setItemPrice(0);
      setItemDiet('veg');
      setItemCategoryId(categories.length > 0 ? categories[0].id : '');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const trimmedName = itemName.trim();
    const isDuplicate = items.some(
      item => item.name.toLowerCase() === trimmedName.toLowerCase() && item.id !== editingItem?.id
    );
    if (isDuplicate) {
      alert('A menu item with this name already exists.');
      setIsSaving(false);
      return;
    }

    try {
      const itemData: Omit<MenuItem, 'id'> = {
        name: trimmedName,
        price: itemPrice,
        dietType: itemDiet,
        categoryId: itemCategoryId || null,
        isAvailable: editingItem ? editingItem.isAvailable : true,
        description: editingItem ? editingItem.description : '',
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
      } else {
        await addMenuItem(itemData);
      }
      setIsItemModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to save menu item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteMenuItem(item.id);
        await fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete menu item.');
      }
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Menu Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'items' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('items')}
            className={activeTab === 'items' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          >
            <Grid className="w-4 h-4 mr-2" />
            Menu Items
          </Button>
          <Button 
            variant={activeTab === 'categories' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('categories')}
            className={activeTab === 'categories' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          >
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
        </div>
      </div>

      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-end mb-6">
            <Button onClick={() => handleOpenCategoryModal()} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <Card key={cat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleOpenCategoryModal(cat)} className="text-slate-400 hover:text-indigo-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div>
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <Button onClick={() => handleOpenItemModal()} className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const cat = categories.find(c => c.id === item.categoryId);
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800">{item.name}</h3>
                      <div className="flex space-x-1">
                        <button onClick={() => handleOpenItemModal(item)} className="text-slate-400 hover:text-indigo-600 p-1">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(item)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 mb-4">{cat?.name || 'Uncategorized'}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-lg text-indigo-600">₹{item.price}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.dietType === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.dietType === 'veg' ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}>
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input type="number" required min="0" value={itemPrice} onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Diet Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" name="diet" value="veg" checked={itemDiet === 'veg'} onChange={() => setItemDiet('veg')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                Veg
              </label>
              <label className="flex items-center">
                <input type="radio" name="diet" value="non-veg" checked={itemDiet === 'non-veg'} onChange={() => setItemDiet('non-veg')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                Non-Veg
              </label>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
