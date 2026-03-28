'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Database, 
  UserCheck, 
  Flame, 
  CalendarX, 
  Images, 
  Library, 
  Calculator,
  ArrowRight,
  TrendingUp,
  Users,
  Utensils
} from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

const adminModules = [
  {
    title: 'Bookings Hub',
    description: 'Manage all customer bookings and assignments.',
    href: '/admin/bookings',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
    stats: 'Active Subscriptions'
  },
  {
    title: 'Customer Database',
    description: 'View and manage user profiles and roles.',
    href: '/admin/customers',
    icon: Database,
    color: 'from-purple-500 to-pink-600',
    stats: 'Registered Users'
  },
  {
    title: 'Cook Requests',
    description: 'Review and approve professional applications.',
    href: '/admin/cook-requests',
    icon: UserCheck,
    color: 'from-orange-500 to-red-600',
    stats: 'Pending Reviews'
  },
  {
    title: 'Dish Playbook',
    description: 'Curate the master list of dishes and recipes.',
    href: '/admin/dishes',
    icon: Flame,
    color: 'from-green-500 to-teal-600',
    stats: 'Total Dishes'
  },
  {
    title: 'Slot Availability',
    description: 'Configure and override booking time slots.',
    href: '/admin/availability',
    icon: CalendarX,
    color: 'from-amber-500 to-yellow-600',
    stats: 'Active Windows'
  },
  {
    title: 'Live Kitchen',
    description: 'Manage real-time stall orders for Bookeato Live.',
    href: '/admin/live/orders',
    icon: Flame, // Using Flame for live kitchen
    color: 'from-red-500 to-orange-600',
    stats: 'Active Orders'
  },
  {
    title: 'Live Menu',
    description: 'Manage the Bookeato Live food stall menu items.',
    href: '/admin/live/menu',
    icon: Utensils,
    color: 'from-emerald-500 to-green-600',
    stats: 'Stall Items'
  },
  {
    title: 'Live Societies',
    description: 'Manage which societies have active pop-up stalls.',
    href: '/admin/live/societies',
    icon: Database,
    color: 'from-purple-500 to-indigo-600',
    stats: 'Active Stalls'
  },
  {
    title: 'Maid Requests',
    description: 'Review and approve professional maid applications.',
    href: '/admin/maid-requests',
    icon: UserCheck,
    color: 'from-green-500 to-teal-600',
    stats: 'Pending Reviews'
  },
];

export default function AdminDashboardPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Admin Control Center">
          <div className="space-y-8 animate-in fade-in duration-700">
          
          {/* Welcome Section */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 text-white shadow-2xl md:p-12">
            <div className="relative z-10 sm:max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Welcome back, Admin.</h2>
              <p className="mt-4 text-lg font-medium text-stone-400 leading-relaxed">
                Your Home Operating System is running smoothly. Monitor everything from service assignments to professional requests in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md">
                   <TrendingUp className="w-4 h-4 text-green-400" /> System: Healthy
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md">
                   <Users className="w-4 h-4 text-blue-400" /> Platform: Active
                </div>
              </div>
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-tr from-green-500/20 to-transparent blur-3xl" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adminModules.map((module) => (
              <Link key={module.href} href={module.href} className="group">
                <Card className="h-full border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] rounded-[2rem] overflow-hidden relative border-2 border-transparent hover:border-stone-100">
                  <CardHeader className="p-8">
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${module.color} text-white shadow-lg shadow-current/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <module.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="pt-2 text-stone-500 font-medium leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 pt-0">
                    <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                      <span className="text-xs font-black uppercase tracking-widest text-stone-300">{module.stats}</span>
                      <div className="h-8 w-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all duration-300">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Stats Panel */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] bg-stone-50 border-none shadow-none p-8">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-stone-900">
                  <Utensils className="w-5 h-5 text-stone-400" /> System Statistics
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-stone-100">
                     <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Orders</p>
                     <p className="text-3xl font-black text-stone-900 tracking-tighter">1,280</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-100">
                     <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Growth</p>
                     <p className="text-3xl font-black text-green-600 tracking-tighter">+12%</p>
                  </div>
               </div>
            </Card>
            <Card className="rounded-[2rem] bg-stone-50 border-none shadow-none p-8 flex flex-col justify-center items-center text-center">
               <div className="p-4 rounded-full bg-orange-100 mb-4">
                  <Flame className="w-8 h-8 text-orange-600" />
               </div>
               <h3 className="text-xl font-bold text-stone-900">Need to update the menu?</h3>
               <p className="text-sm text-stone-500 mt-2 max-w-[250px]">
                  Add new dishes, tweak pricing, or update seasonal favorites in the Playbook.
               </p>
               <Button asChild className="mt-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 shadow-lg shadow-orange-500/20">
                  <Link href="/admin/dishes">Go to Playbook</Link>
               </Button>
            </Card>
          </div>

        </div>
      </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}

// Minimal Button component to keep snippet self-contained if needed, though we use regular imports
function Button({ children, className, asChild, ...props }: any) {
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
      {children}
    </Comp>
  );
}
