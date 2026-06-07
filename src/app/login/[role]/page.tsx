'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { fetchUsers } from '../../../lib/sanity/client';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';

export default function LoginPage({ params }: { params: Promise<{ role: string }> }) {
  const router = useRouter();
  const { login } = useAuthStore();
  const formRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(p => setRole(p.role));
  }, [params]);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const users = await fetchUsers();
      const user = users.find((u: any) => u.role === role && u.username === username && u.password === password);

      // Fallback for demo purposes if Sanity is not configured or empty
      const isFallback =
        (role === 'owner' && username === 'owner' && password === 'owner') ||
        (role === 'cashier' && username === 'cashier' && password === 'cashier') ||
        (role === 'manager' && username === 'manager' && password === 'manager') ||
        (role === 'waiter' && username === 'waiter' && password === 'waiter');

      if (user || isFallback) {
        login({ role: role as any, username });
        router.push(`/${role}`);
      } else {
        setError('Invalid credentials. Please try again.');
        gsap.fromTo(formRef.current, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.to(formRef.current, { x: 0 }) });
      }
    } catch (err) {
      console.error(err);
      setError('Error validating credentials. Ensure Sanity CMS is configured.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen">
      <div className="w-full max-w-md" ref={formRef}>
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to profiles
        </button>

        <Card className="shadow-2xl border-0 overflow-hidden glass">
          <div className="bg-slate-900 text-white p-8 text-center">
            <h2 className="text-3xl font-bold capitalize">{role} Login</h2>
            <p className="text-slate-400 mt-2">Enter your credentials to continue</p>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    placeholder={`Enter ${role} username`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
