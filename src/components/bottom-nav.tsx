'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, Sparkles, ShoppingBag, Headset } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Account', icon: User },
  { href: '/services', label: 'Services', icon: Sparkles },
  { href: '/order-history', label: 'Orders', icon: ShoppingBag },
  { href: '/support', label: 'Support', icon: Headset },
];

function BottomNavContent({ isGuest = false }: { isGuest?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'orders';
  const isSeller = pathname.startsWith('/seller-') || pathname.startsWith('/seller');

  const items = isSeller ? [
    { href: '/seller-dashboard?tab=profile', label: 'Dashboard', icon: User, tab: 'profile' },
    { href: '/seller-dashboard?tab=products', label: 'Products', icon: Sparkles, tab: 'products' },
    { href: '/seller-dashboard?tab=orders', label: 'Orders', icon: ShoppingBag, tab: 'orders' },
    { href: '/support', label: 'Support', icon: Headset },
  ] : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 sm:h-20 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 flex items-center justify-around px-2 md:hidden safe-area-inset-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.08)] rounded-t-2xl sm:rounded-t-[2rem]">
      {items.map((item) => {
        let isActive = false;
        if (isSeller && item.tab) {
          isActive = pathname === '/seller-dashboard' && currentTab === item.tab;
        } else {
          isActive = pathname === item.href || (item.href !== '/' && item.href !== '/#services-grid' && pathname.startsWith(item.href));
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all active:scale-95",
              isActive ? "text-stone-950" : "text-stone-500 hover:text-stone-800"
            )}
          >
            <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200/60" : "bg-transparent"
            )}>
                <item.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive ? "stroke-[2.5px] text-emerald-700" : "stroke-2")} />
            </div>
            <span className={cn(
                "text-[9px] sm:text-[10px] font-black tracking-tight",
                isActive ? "text-emerald-950 font-black" : "text-stone-500 font-bold"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav(props: { isGuest?: boolean }) {
  return (
    <Suspense fallback={null}>
      <BottomNavContent {...props} />
    </Suspense>
  );
}
