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
  BookOpen, Database, Flame, CalendarX, Images, Library, Calculator,
  Store, Info
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

// Nav Items for Unauthenticated Page Visitors / Guests
const guestNavItems = [
  // 1. Core Header Links
  { href: '/', label: 'Home', icon: Home },
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/about', label: 'About Us', icon: Info },

  // 2. Services Section
  { href: '/booking', label: 'Cook Service', icon: ChefHat, separator: true, sectionLabel: 'OUR SERVICES' },
  { href: '/booking/maid', label: 'Maid Service', icon: Sparkles },
  { href: '/#services-grid', label: 'Elder Care', icon: HeartPulse },
  { href: '/live', label: 'Bookeato Live', icon: Video },
  { href: '/#services-grid', label: 'Child Care', icon: CalendarDays },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBasket },

  // 3. Login & Signup Section for Visitors
  { href: '/login', label: 'Customer Login / Signup', icon: LogIn, separator: true, sectionLabel: 'LOGIN & SIGNUP' },
  { href: '/seller-signup', label: 'Seller Login / Signup', icon: Store },
  { href: '/partner-signup', label: 'Partner Login / Signup', icon: UserCheck },
];

// Nav Items for Logged-In Customers
const customerNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/order-history', label: 'My Orders', icon: List },
  { href: '/wallet', label: 'Wallet Balance', icon: Wallet },
  { href: '/support', label: 'Support', icon: HelpCircle },

  { href: '/booking', label: 'Cook Service', icon: ChefHat, separator: true, sectionLabel: 'OUR SERVICES' },
  { href: '/booking/maid', label: 'Maid Service', icon: Sparkles },
  { href: '/#services-grid', label: 'Elder Care', icon: HeartPulse },
  { href: '/live', label: 'Bookeato Live', icon: Video },
  { href: '/#services-grid', label: 'Child Care', icon: CalendarDays },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBasket },
];

// Nav Items for Logged-In Sellers
const sellerNavItems = [
  { href: '/', label: 'Home (Landing Page)', icon: Home },
  { href: '/seller-dashboard?tab=orders', label: 'Seller Dashboard', icon: LayoutDashboard, separator: true, sectionLabel: 'SELLER PORTAL' },
  { href: '/seller-dashboard?tab=products', label: 'My Products', icon: ShoppingBasket },
  { href: '/seller-dashboard?tab=vouchers', label: 'Coupons', icon: List },
  { href: '/seller-dashboard?tab=payouts', label: 'Payouts', icon: Wallet },
  { href: '/seller-dashboard?tab=profile', label: 'Shop Profile', icon: User },
  { href: '/support', label: 'Support', icon: HelpCircle, separator: true, sectionLabel: 'HELP' },
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
  const [isSellerLoggedIn, setIsSellerLoggedIn] = React.useState(false);

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

    try {
      const activeSeller = localStorage.getItem('bookeato_active_seller');
      setIsSellerLoggedIn(!!activeSeller || pathname.startsWith('/seller'));
    } catch (e) {
      setIsSellerLoggedIn(pathname.startsWith('/seller'));
    }
  }, [user, pathname]);


  const [loadingTimedOut, setLoadingTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isUserLoading && !loadingTimedOut && pageTitle !== 'Welcome' && pageTitle !== 'Partner Login' && pageTitle !== 'Partner Signup') {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <Logo />
                <p className="mt-4 font-bold text-stone-500">Loading Bookeato...</p>
            </div>
        </div>
    )
  }
  
  const isSeller = pathname.startsWith('/seller');
  const itemsToShow = userRole === 'admin' 
    ? adminNavItems 
    : isSeller 
    ? sellerNavItems 
    : userRole === 'customer' 
    ? customerNavItems 
    : guestNavItems;

  if (pathname === '/' || pathname === '/admin/login' || pathname === '/partner-signup') {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="md:flex min-w-0 w-full max-w-full overflow-x-hidden">
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
        <div className="flex-1 min-w-0 w-full overflow-x-hidden">
          <Header title={pageTitle} />
          <main className={cn("flex-1 p-2 sm:p-4 md:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden", (userRole === 'customer' || !userRole) && "pb-24 md:pb-8")}>
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
