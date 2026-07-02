'use client';
import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser, User } from '../../../lib/firebase/db';
import { hashPassword } from '../../../lib/hash';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Users, Plus, Pencil, Trash2, Loader2, Key } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'cashier' | 'supervisor'>('cashier');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setRole(user.role);
      setPassword(''); // Don't populate password
    } else {
      setEditingUser(null);
      setUsername('');
      setRole('cashier');
      setPassword('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData: Partial<User> = {
        username,
        role,
      };

      if (password) {
        updateData.password = await hashPassword(password);
      }

      if (editingUser) {
        await updateUser(editingUser.id, updateData);
      } else {
        if (!password) {
          alert('Password is required for new users.');
          setIsSaving(false);
          return;
        }
        await addUser({ username, role, password: updateData.password });
      }

      setIsModalOpen(false);
      await fetchUsersData();
    } catch (error) {
      console.error(error);
      alert('Failed to save user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (users.length <= 1) {
      alert('Cannot delete the last user.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        await deleteUser(user.id);
        await fetchUsersData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete user.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{user.username}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(user)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(user)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'owner' | 'cashier' | 'supervisor')}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="cashier">Cashier</option>
              <option value="supervisor">Supervisor</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required={!editingUser}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Save User'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
