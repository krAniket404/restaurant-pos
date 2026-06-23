'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ChefHat, CreditCard, LayoutDashboard, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

const roles = [
  { id: 'owner', label: "Owner's Dashboard", icon: LayoutDashboard, color: 'bg-indigo-500' },
  { id: 'cashier', label: "Cashier's Dashboard", icon: CreditCard, color: 'bg-green-500' },
  { id: 'supervisor', label: "Supervisor's Dashboard", icon: UtensilsCrossed, color: 'bg-rose-500' },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
          Restaurant POS
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Select your profile to continue to the dashboard.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
      >
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Link key={role.id} href={`/login/${role.id}`} className="block group">
              <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border-0 bg-white/60 backdrop-blur-xl">
                <CardContent className="p-8 flex items-center space-x-6">
                  <div className={`p-4 rounded-2xl text-white ${role.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{role.label}</h2>
                    <p className="text-slate-500 mt-1 flex items-center">
                      Login to access <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">&rarr;</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
