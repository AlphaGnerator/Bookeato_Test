'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Sparkles, ShoppingBag, Headset } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Account', icon: User },
  { href: '/#services-grid', label: 'Services', icon: Sparkles, isServices: true },
  { href: '/order-history', label: 'Orders', icon: ShoppingBag },
  { href: '/help', label: 'Support', icon: Headset },
];

export function BottomNav({ isGuest = false }: { isGuest?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 flex items-center justify-around px-2 md:hidden safe-area-inset-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.08)] rounded-t-[2rem]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/#services-grid' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={(e) => {
                if (item.isServices && pathname === '/') {
                    e.preventDefault();
                    document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' });
                }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-95",
              isActive ? "text-stone-950" : "text-stone-500 hover:text-stone-800"
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-stone-100 shadow-sm border border-stone-200/50" : "bg-transparent"
            )}>
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px] text-emerald-600" : "stroke-2")} />
            </div>
            <span className={cn(
                "text-[10px] font-black tracking-tight",
                isActive ? "text-stone-950 font-black" : "text-stone-500 font-bold"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
