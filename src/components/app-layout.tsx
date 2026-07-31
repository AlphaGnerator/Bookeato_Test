'use client'; 

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { 
  Home, List, Wallet, HelpCircle, ChefHat, Sparkles, 
  HeartPulse, ShoppingBasket, LogIn, UserPlus, UserCheck, 
  LayoutDashboard, User, CalendarDays, CalendarClock, Video, 
  BookOpen, Database, Flame, CalendarX, Images, Library, Calculator 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Logo } from './logo';
import { Header } from './header';
import { useUser } from '@/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from './ui/sidebar';
import { BottomNav } from './bottom-nav';
import { cn } from '@/lib/utils';
import { UnifiedCart } from './unified-cart';
import { BookingMiniStatus } from './booking-mini-status';

const standardNavItems = [
  // 1. Core 4 Navigation Options
  { href: '/', label: 'Home', icon: Home },
  { href: '/order-history', label: 'Orders', icon: List },
  { href: '/wallet', label: 'Wallet balance', icon: Wallet },
  { href: '/support', label: 'Support', icon: HelpCircle },

  // 2. Services Section
  { href: '/booking', label: 'Cook', icon: ChefHat, separator: true, sectionLabel: 'SERVICES' },
  { href: '/booking/maid', label: 'Maid', icon: Sparkles },
  { href: '/#services-grid', label: 'Elder care', icon: HeartPulse },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBasket },

  // 3. Auth Section
  { href: '/login', label: 'Signup / Login', icon: LogIn, separator: true, sectionLabel: 'ACCOUNT' },
  { href: '/partner-signup', label: 'Partner Login', icon: UserCheck },
];

const adminNavItems = [
    { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, requiresAuth: true },
    { href: '/admin/customers', label: 'Customers', icon: Database, requiresAuth: true },
    { href: '/admin/cook-requests', label: 'Cook Requests', icon: UserCheck, requiresAuth: true },
    { href: '/admin/maid-requests', label: 'Maid Requests', icon: UserCheck, requiresAuth: true },
    { href: '/admin/dishes', label: 'Dish Playbook', icon: Flame, requiresAuth: true },
    { href: '/admin/availability', label: 'Slot Availability', icon: CalendarX, requiresAuth: true },
    { href: '/admin/carousel', label: 'Carousel', icon: Images, requiresAuth: true },
    { href: '/admin/image-library', label: 'Image Library', icon: Library, requiresAuth: true },
    { href: '/admin/debug-calculation', label: 'Debug Calc', icon: Calculator, separator: true, requiresAuth: true },
    { href: '/', label: 'Return to Site', icon: Home, separator: true, requiresAuth: true },
];

export function AppLayout({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [userRole, setUserRole] = React.useState<'customer' | 'cook' | 'maid' | 'admin' | null>(null);

  React.useEffect(() => {
    if (pathname.startsWith('/admin')) {
        setUserRole('admin');
    } else if (pathname.startsWith('/cook/')) {
        setUserRole('cook');
    } else if (pathname.startsWith('/maid/')) {
        setUserRole('maid');
    } else if (user) {
        setUserRole('customer');
    } else {
        setUserRole(null);
    }
  }, [user, pathname]);


  if (isUserLoading && pageTitle !== 'Welcome' && pageTitle !== 'Partner Login' && pageTitle !== 'Partner Signup') {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <Logo />
                <p className="mt-4 font-bold text-stone-500">Loading Bookeato...</p>
            </div>
        </div>
    )
  }
  
  const itemsToShow = userRole === 'admin' ? adminNavItems : standardNavItems;

  if (pathname === '/' || pathname === '/admin/login' || pathname === '/partner-signup') {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="md:flex">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {itemsToShow.map((item) => (
                <React.Fragment key={item.href}>
                  {('separator' in item && item.separator) && (
                    <SidebarMenuItem className="mt-4 mb-2 px-3">
                      {'sectionLabel' in item && item.sectionLabel && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 block mb-1">
                          {item.sectionLabel}
                        </span>
                      )}
                      <hr className="border-sidebar-border" />
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={{ children: item.label, side: 'right' }}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1">
          <Header title={pageTitle} />
          <main className={cn("flex-1 p-4 md:p-6 lg:p-8", (userRole === 'customer' || !userRole) && "pb-24 md:pb-8")}>
          {children}
          </main>
          {(userRole === 'customer' || !userRole) && (
            <>
                {userRole === 'customer' && <BookingMiniStatus />}
                <BottomNav isGuest={!userRole} />
                <UnifiedCart />
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
