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
import { CalendarDays, LayoutDashboard, Sparkles, User, ChefHat, Tag, LogIn, UserPlus, CalendarClock, Star, Soup, Video, Home, Database, Utensils, UserCheck, BookOpen, Wallet, CalendarX, Flame, List, Images, Library, Beaker, Calculator } from 'lucide-react';
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

const customerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/pricing', label: 'New Booking', icon: CalendarDays, requiresAuth: true },
  { href: '/order-history', label: 'Order History', icon: List, requiresAuth: true },
  { href: '/recommendations', label: 'AI Recommendations', icon: Sparkles, requiresAuth: true },
  { href: '/wallet', label: 'My Wallet', icon: Wallet, requiresAuth: true },
  { href: '/profile', label: 'My Profile', icon: User, requiresAuth: true },
];

const maidNavItems = [
    { href: '/maid/dashboard', label: 'My Schedule', icon: CalendarDays, requiresAuth: true },
    { href: '/maid/earnings', label: 'My Earnings', icon: Wallet, requiresAuth: true },
    { href: '/maid/profile', label: 'My Profile', icon: User, requiresAuth: true },
];

const cookNavItems = [
    { href: '/cook/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { href: '/cook/availability', label: 'My Availability', icon: CalendarClock, requiresAuth: true },
    { href: '/cook/tutorials', label: 'Tutorials', icon: Video, requiresAuth: true },
    { href: '/cook/profile', label: 'My Profile', icon: User, requiresAuth: true },
]

const adminNavItems = [
    { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, requiresAuth: true },
    { href: '/admin/customers', label: 'Customers', icon: Database, requiresAuth: true },
    { href: '/admin/cook-requests', label: 'Cook Requests', icon: UserCheck, requiresAuth: true },
    { href: '/admin/dishes', label: 'Dish Playbook', icon: Flame, requiresAuth: true },
    { href: '/admin/availability', label: 'Slot Availability', icon: CalendarX, requiresAuth: true },
    { href: '/admin/carousel', label: 'Carousel', icon: Images, requiresAuth: true },
    { href: '/admin/image-library', label: 'Image Library', icon: Library, requiresAuth: true },
    { href: '/admin/debug-calculation', label: 'Debug Calc', icon: Calculator, separator: true, requiresAuth: true },
    { href: '/', label: 'Return to Site', icon: Home, separator: true, requiresAuth: true },
]

const publicNavItems = [
    { href: '/', label: 'Welcome', icon: Home, requiresAuth: false },
    { href: '/login', label: 'Customer Login', icon: LogIn, requiresAuth: false, separator: true },
    { href: '/signup', label: 'Customer Signup', icon: UserPlus, requiresAuth: false },
    { href: '/cook/login', label: 'Cook Login', icon: ChefHat, separator: true, requiresAuth: false },
    { href: '/cook/signup', label: 'Become a Cook', icon: UserPlus, requiresAuth: false },
]

export function AppLayout({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [userRole, setUserRole] = React.useState<'customer' | 'cook' | 'admin' | null>(null);

  React.useEffect(() => {
    if (pathname.startsWith('/admin')) {
        setUserRole('admin');
    } else if (pathname.startsWith('/cook/')) {
        setUserRole('cook');
    } else if (pathname.startsWith('/maid/')) {
        setUserRole('maid' as any);
    } else if (user) {
        setUserRole('customer');
    } else {
        setUserRole(null);
    }
  }, [user, pathname]);


  if (isUserLoading && pageTitle !== 'Welcome') {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <Logo />
                <p className="mt-4">Loading...</p>
            </div>
        </div>
    )
  }
  
  let itemsToShow = publicNavItems;
  if(userRole === 'customer') {
    itemsToShow = customerNavItems;
  } else if (userRole === 'cook') {
    itemsToShow = cookNavItems;
  } else if (userRole as any === 'maid') {
    itemsToShow = maidNavItems;
  } else if (userRole === 'admin') {
    itemsToShow = adminNavItems;
  }

  if (pathname === '/' || pathname === '/admin/login') {
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
                  {('separator' in item && item.separator) && <SidebarMenuItem className="my-2"><hr className="border-sidebar-border" /></SidebarMenuItem>}
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
          {(userRole === 'customer' || !userRole) && <BottomNav isGuest={!userRole} />}
        </div>
      </div>
    </SidebarProvider>
  );
}
