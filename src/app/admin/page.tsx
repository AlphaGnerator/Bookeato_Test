'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Database, 
  UserCheck, 
  Flame, 
  CalendarX, 
  Utensils, 
  Store,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  HelpCircle,
  ShieldCheck,
  Award,
  Sparkles,
  Heart,
  Baby,
  Phone,
  Clock,
  CheckCircle2,
  Dumbbell,
  Camera
} from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

const adminModules = [
  {
    title: 'Bookeato Live Orders & Menu Hub',
    description: 'Unified Kitchen Display System, subscription orders stream, dish editor & portion rate configurator.',
    href: '/admin/live',
    icon: Flame,
    color: 'from-orange-500 to-amber-600',
    stats: 'Live Kitchen & Menu Sync'
  },
  {
    title: 'Partners Approval Hub',
    description: 'Review and approve Cook, Maid, Child Care, Elder Care & Fitness Coach partner applications.',
    href: '/admin/partners',
    icon: ShieldCheck,
    color: 'from-green-600 to-emerald-700',
    stats: 'Partner Onboarding'
  },
  {
    title: 'Cook Requests & Bookings',
    description: 'Review customer cook requests and professional home cook assignments.',
    href: '/admin/cook-requests',
    icon: UserCheck,
    color: 'from-red-500 to-rose-600',
    stats: 'Cook Service'
  },
  {
    title: 'Maid Requests & Assignments',
    description: 'Review customer maid requests and daily domestic cleaning schedules.',
    href: '/admin/maid-requests',
    icon: Sparkles,
    color: 'from-teal-500 to-emerald-600',
    stats: 'Maid Service'
  },
  {
    title: 'Child Care Requests & Bookings',
    description: 'Manage parent requests for nannies and early childhood care specialists.',
    href: '/admin/childcare-requests',
    icon: Baby,
    color: 'from-amber-500 to-yellow-600',
    stats: 'Child Care Service'
  },
  {
    title: 'Elder Care Requests & Bookings',
    description: 'Review senior citizen medication support, companionship, and caregiver bookings.',
    href: '/admin/eldercare-requests',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    stats: 'Elder Care Service'
  },
  {
    title: 'Sports & Fitness Coach Bookings',
    description: 'Manage personal trainer, yoga coach, and sports trainer booking requests.',
    href: '/admin/fitness-requests',
    icon: Dumbbell,
    color: 'from-cyan-500 to-blue-600',
    stats: 'Fitness & Sports'
  },
  {
    title: 'Customer Database & Wallets',
    description: 'Inspect full customer profiles, contact info, delivery addresses & wallet reserves.',
    href: '/admin/customers',
    icon: Database,
    color: 'from-purple-500 to-indigo-600',
    stats: 'Customer Intelligence'
  },
  {
    title: 'Admin Image Repository & Bank',
    description: 'Central media vault to upload, organize, and copy product & promotional image URLs.',
    href: '/admin/image-library',
    icon: Camera,
    color: 'from-orange-600 to-pink-600',
    stats: 'Media Assets Vault'
  },
  {
    title: 'Marketplace Vendor Portal',
    description: 'Inspect vendor performance, vendor sales, orders & product listings.',
    href: '/seller-dashboard?admin=true',
    icon: Store,
    color: 'from-blue-500 to-indigo-600',
    stats: 'Marketplace Sellers'
  },
  {
    title: 'Dish Playbook Master',
    description: 'Curate the master recipe playbook for subscription boxes & catering.',
    href: '/admin/dishes',
    icon: Utensils,
    color: 'from-stone-700 to-stone-900',
    stats: 'Master Playbook'
  }
];

export default function AdminDashboardPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Admin Control Center">
          <div className="space-y-8 animate-in fade-in duration-700">
            
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-950 p-8 text-white shadow-2xl md:p-10 border border-stone-800">
              <div className="relative z-10 sm:max-w-2xl">
                <Badge className="bg-orange-500 text-stone-950 font-black text-xs uppercase mb-3">Admin Command Center</Badge>
                <h2 className="text-3xl font-black tracking-tight md:text-5xl">Bookeato Platform Admin</h2>
                <p className="mt-3 text-sm md:text-base font-medium text-stone-400 leading-relaxed">
                  Real-time monitor across Bookeato Live, Partner Approvals, Customer Wallets, and Marketplace Vendors.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-md">
                     <TrendingUp className="w-4 h-4 text-green-400" /> Platform: 100% Operational
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-md">
                     <Users className="w-4 h-4 text-orange-400" /> Live Subscriptions: Active
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl" />
            </div>

            {/* 🌟 4 MAIN TOP METRIC CARDS 🌟 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Sales */}
              <Card className="rounded-3xl border border-stone-200 shadow-sm p-6 bg-gradient-to-br from-orange-50/60 to-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Total Sales</span>
                    <h3 className="text-2xl font-black text-stone-950 mt-0.5">₹4,85,250</h3>
                  </div>
                  <div className="p-3 bg-orange-500 text-stone-950 rounded-2xl shadow-sm">
                    <DollarSign className="w-5 h-5 font-black" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% <span className="text-stone-400 font-normal">from last month</span>
                </div>
              </Card>

              {/* Card 2: Total Orders */}
              <Card className="rounded-3xl border border-stone-200 shadow-sm p-6 bg-gradient-to-br from-blue-50/60 to-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Total Orders</span>
                    <h3 className="text-2xl font-black text-stone-950 mt-0.5">1,428 Orders</h3>
                  </div>
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
                    <ShoppingBag className="w-5 h-5 font-black" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-stone-600">
                  <span className="text-blue-600 font-extrabold">All Services</span> <span className="text-stone-400 font-normal">& Marketplace</span>
                </div>
              </Card>

              {/* Card 3: Total Earnings / Revenue */}
              <Card className="rounded-3xl border border-stone-200 shadow-sm p-6 bg-gradient-to-br from-emerald-50/60 to-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Net Revenue</span>
                    <h3 className="text-2xl font-black text-stone-950 mt-0.5">₹92,400</h3>
                  </div>
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
                    <Award className="w-5 h-5 font-black" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.1% <span className="text-stone-400 font-normal">commission margin</span>
                </div>
              </Card>

              {/* Card 4: Support Issues & Tickets */}
              <Card className="rounded-3xl border border-stone-200 shadow-sm p-6 bg-gradient-to-br from-purple-50/60 to-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Support Issues</span>
                    <h3 className="text-2xl font-black text-stone-950 mt-0.5">12 Active</h3>
                  </div>
                  <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-sm">
                    <HelpCircle className="w-5 h-5 font-black" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-purple-600">
                  <Clock className="w-3.5 h-3.5" /> 3 Pending <span className="text-stone-400 font-normal">customer resolution</span>
                </div>
              </Card>
            </div>

            {/* Admin Control Modules Grid */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-stone-900">Admin Control Modules</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {adminModules.map((module) => (
                  <Link key={module.href} href={module.href} className="group">
                    <Card className="h-full border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md rounded-[2rem] overflow-hidden relative">
                      <CardHeader className="p-6">
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.color} text-white shadow-md`}>
                          <module.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="pt-1 text-xs text-stone-500 font-medium leading-relaxed">
                          {module.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0">
                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{module.stats}</span>
                          <div className="h-7 w-7 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-950 group-hover:text-white transition-all">
                            <ArrowRight className="h-3.5 h-3.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
