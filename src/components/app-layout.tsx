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

const customerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pricing', label: 'New Booking', icon: CalendarDays },
  { href: '/order-history', label: 'Order History', icon: List },
  { href: '/recommendations', label: 'AI Recommendations', icon: Sparkles },
  { href: '/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/profile', label: 'My Profile', icon: User },
];

const cookNavItems = [
    { href: '/cook/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cook/availability', label: 'My Availability', icon: CalendarClock },
    { href: '/cook/tutorials', label: 'Tutorials', icon: Video },
    { href: '/cook/profile', label: 'My Profile', icon: User },
]

const adminNavItems = [
    { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
    { href: '/admin/customers', label: 'Customers', icon: Database },
    { href: '/admin/cook-requests', label: 'Cook Requests', icon: UserCheck },
    { href: '/admin/dishes', label: 'Dish Playbook', icon: Flame },
    { href: '/admin/availability', label: 'Slot Availability', icon: CalendarX },
    { href: '/admin/carousel', label: 'Carousel', icon: Images},
    { href: '/admin/image-library', label: 'Image Library', icon: Library},
    { href: '/admin/debug-calculation', label: 'Debug Calc', icon: Calculator, separator: true},
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
  } else if (userRole === 'admin') {
    itemsToShow = adminNavItems;
  }

  if (pathname === '/') {
    return <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>;
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
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
