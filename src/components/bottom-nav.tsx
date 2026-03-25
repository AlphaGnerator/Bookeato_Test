'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, List, Sparkles, Wallet, User, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

const customerNavItems = [
  { href: '/dashboard', label: 'UC', icon: LayoutDashboard },
  { href: '/services', label: 'Services', icon: Sparkles },
  { href: '/bookings', label: 'Bookings', icon: List },
  { href: '/account', label: 'Account', icon: User },
];

const guestNavItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/login', label: 'Login', icon: User },
  { href: '/cook/login', label: 'Cooks', icon: ChefHat },
];

export function BottomNav({ isGuest = false }: { isGuest?: boolean }) {
  const pathname = usePathname();
  const items = isGuest ? guestNavItems : customerNavItems;

  // Hide on desktop
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-xl border-t border-stone-100 flex items-center justify-around px-4 md:hidden safe-area-inset-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all active:scale-90",
              isActive ? "text-stone-900" : "text-stone-400"
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-stone-100 shadow-sm" : "bg-transparent"
            )}>
                <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
            </div>
            <span className={cn("text-[11px] font-black tracking-widest uppercase", isActive ? "text-stone-900" : "text-stone-400")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
