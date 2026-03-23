'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, differenceInHours, isSameDay } from 'date-fns';
import { 
  PlusCircle, Wallet, Clock, CheckCircle2, 
  ChevronRight, ChefHat, Sparkles, Hourglass, 
  XCircle, CalendarIcon, BarChart3
} from 'lucide-react';
import { MaidPendingCart } from '@/components/maid-pending-cart';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { user, bookings, isInitialized, cancelSlot } = useCulinaryStore();
  const firestore = useFirestore();
  const { user: firebaseUser } = useUser();
  
  const txQuery = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
        return query(collection(firestore, 'customers', firebaseUser.uid, 'transactions'), orderBy('date', 'desc'), limit(5));
    }
    return null;
  }, [firestore, firebaseUser]);
  const { data: transactionsData } = useCollection<Transaction>(txQuery);
  const transactions = transactionsData || [];
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBookingDate, setModalBookingDate] = useState<Date | null>(null);

  if (!isInitialized || !bookings) {
     return <AppLayout pageTitle="Home Operating System"><div className="p-8 space-y-4"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div></AppLayout>;
  }
  
  const safeBookings = bookings || [];

  const normalizedBookings = safeBookings.map(b => {
      // Compatibility mapping
      const isCook = b.type !== 'maid'; // Assumes maid has type='maid'
      const timeStr = ('time' in b && typeof b.time === 'string') ? b.time as string : format(new Date(b.bookingDate), 'hh:mm a');

      return {
          id: b.id,
          originalBookingId: b.id,
          service: ('service' in b && typeof b.service === 'string') ? b.service as string : (isCook ? 'Cook Session' : 'Maid - A-La-Carte'),
          type: isCook ? 'cook' : 'maid',
          date: b.bookingDate,
          time: timeStr,
          status: b.status,
          professional: b.cookId ? { name: b.cookName || 'Assigned Cook', rating: '4.8' } : null,
          isDishSelected: isCook ? (b.items && b.items.length > 0) : true,
      }
  });

  const handleDateClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
    
    // Check if there's a cook booking without dish selected on this date
    const dayBookings = normalizedBookings.filter(b => isSameDay(new Date(b.date), clickedDate));
    const requiresMenuSelection = dayBookings.find(b => b.type === 'cook' && !b.isDishSelected);
    
    if (requiresMenuSelection) {
      setModalBookingDate(clickedDate);
      setIsModalOpen(true);
    }
  };

  const canCancel = (bookingDateStr: string, timeStr: string) => {
    // Parse the date and time strings loosely for logic
    const bookingDate = new Date(bookingDateStr);
    
    try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        let parsedHours = parseInt(hours, 10);
        
        if (parsedHours === 12 && modifier === 'AM') parsedHours = 0;
        if (modifier === 'PM' && parsedHours < 12) parsedHours += 12;
        
        bookingDate.setHours(parsedHours, parseInt(minutes, 10), 0, 0);
        
        const hoursDiff = differenceInHours(bookingDate, new Date());
        return hoursDiff > 24;
    } catch (e) {
        return true; 
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelSlot(bookingId);
      toast({
        title: "Booking cancelled",
        description: "Your session has been cancelled.",
      });
    }
  };

  // Construct calendar days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(today, i);
    const dayBookings = normalizedBookings.filter(b => isSameDay(new Date(b.date), d));
    
    // Check if this day is covered by an active subscription
    const sub = user.subscription;
    const isPlanDay = sub && sub.status === 'active' && sub.planId !== 'none' && 
                     (new Date(sub.startDate) <= d) && (new Date(sub.expiryDate) >= d);

    const hasBooking = dayBookings.length > 0 && dayBookings.some(b => b.status !== 'cancelled');
    
    // Action required if:
    // 1. Existing cook booking has no dishes
    // 2. OR it is a plan day (Weekly/Monthly) but NO cook booking exists yet for this day
    const requiresAction = dayBookings.some(b => b.type === 'cook' && !b.isDishSelected && b.status !== 'cancelled') || 
                           (isPlanDay && sub.planId !== 'day' && !dayBookings.some(b => b.type === 'cook' && b.status !== 'cancelled'));

    return {
      date: d,
      dayName: format(d, 'EEE'),
      dayNum: format(d, 'dd'),
      hasBooking: hasBooking || isPlanDay,
      isActuallyBooked: hasBooking,
      isPlanDay,
      serviceType: dayBookings.length > 0 ? dayBookings[0].type : (isPlanDay ? 'cook' : null),
      requiresAction
    };
  });

  const displayedBookings = normalizedBookings.filter(b => isSameDay(new Date(b.date), selectedDate) && b.status !== 'cancelled');

  const activePlan = user.subscription?.status === 'active' ? user.subscription.planId : 'none';

  return (
    <AppLayout pageTitle="Home Operating System">
       <div className="space-y-6 md:space-y-8 px-1 md:px-0 pb-20">
          <MaidPendingCart />

          {activePlan !== 'none' && user.subscription ? (
             <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-5 sm:p-6 shadow-sm gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="bg-green-100 p-2.5 rounded-full shadow-sm"><Sparkles className="w-6 h-6 text-green-600" /></div>
                       <div>
                           <h3 className="font-black text-green-900 text-lg leading-none tracking-tight">👑 Active Plan: {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)}</h3>
                           <p className="text-sm font-bold text-green-700 mt-1.5">Your subscription is active until {format(new Date(user.subscription.expiryDate), 'MMM d')}.</p>
                       </div>
                    </div>
                    
                    {user.subscription.totalVisits && (
                        <div className="flex-1 max-w-md bg-white/50 p-4 rounded-2xl border border-green-200/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-green-800 flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Usage
                                </span>
                                <span className="text-sm font-black text-green-900">{user.subscription.usedVisits || 0} / {user.subscription.totalVisits} Sessions</span>
                            </div>
                            <div className="w-full bg-green-200/50 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-green-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, ((user.subscription.usedVisits || 0) / user.subscription.totalVisits) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <Button onClick={() => router.push('/plan-details')} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 font-bold bg-white w-full md:w-auto h-11 px-6 rounded-xl shrink-0">Manage Plan</Button>
                </div>
             </div>
          ) : (
             <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden group hover:border-orange-300 transition-colors">
                <div className="absolute right-0 top-0 opacity-5 -translate-y-4 translate-x-4 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <ChefHat className="w-48 h-48" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                   <div className="bg-orange-100 p-3 rounded-2xl shadow-sm shrink-0"><ChefHat className="w-7 h-7 text-orange-600" strokeWidth={2.5}/></div>
                   <div>
                       <h3 className="font-black text-orange-950 text-xl leading-tight tracking-tight">Tired of booking daily?</h3>
                       <p className="text-sm font-bold text-orange-800/80 md:max-w-md mt-1.5 leading-relaxed">Subscribe to a Weekly or Monthly Cook plan and save up to 40% on every meal!</p>
                   </div>
                </div>
                <Button onClick={() => router.push('/pricing')} className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold w-full sm:w-auto shadow-lg shadow-orange-500/20 whitespace-nowrap h-12 px-6 rounded-xl transition-all relative z-10">
                   View Plans
                </Button>
             </div>
          )}

          <section className="space-y-4">
             <div className="flex items-end justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight text-stone-900 leading-none">Your Week Ahead</h2>
             </div>
             
             <div className="flex gap-3 overflow-x-auto pb-4 pt-1 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {weekDays.map((day, i) => {
                   const isSelected = isSameDay(day.date, selectedDate);
                   
                   return (
                     <button 
                       key={i} 
                       onClick={() => handleDateClick(day.date)}
                       className={`flex flex-col items-center justify-center min-w-[85px] h-[95px] rounded-[1.25rem] border-2 transition-all flex-shrink-0 relative touch-manipulation focus-within:ring-4 outline-none ${
                         isSelected ? 'ring-2 ring-stone-900 border-stone-900 shadow-md transform -translate-y-1' : ''
                       } ${
                         day.hasBooking 
                           ? `border-t-[3px] border-t-green-500 bg-green-50/70 shadow-sm ${isSelected ? 'border-green-500 focus-within:ring-green-500/20' : 'border-green-100 hover:border-green-300'}` 
                           : `border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50 focus-within:ring-stone-200`
                       }`}
                     >
                       {(day.requiresAction || (day.isPlanDay && !day.isActuallyBooked)) && !isSelected && (
                         <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white pointer-events-none animate-pulse"></span>
                       )}
                       
                       <span className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${day.hasBooking ? (isSelected ? 'text-green-800' : 'text-green-700/70') : (isSelected ? 'text-stone-700' : 'text-stone-400')}`}>
                         {day.dayName}
                       </span>
                       <span className={`text-2xl font-black mb-1 leading-none transition-colors ${day.hasBooking ? (isSelected ? 'text-green-900' : 'text-green-800') : (isSelected ? 'text-stone-900' : 'text-stone-800')}`}>
                         {day.dayNum}
                       </span>
                        {day.hasBooking ? (
                          <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${day.isActuallyBooked ? 'text-green-700' : 'text-orange-600'}`}>
                             {day.serviceType === 'cook' ? <ChefHat className="w-3 h-3" strokeWidth={2.5}/> : <Sparkles className="w-3 h-3" strokeWidth={2.5}/>}
                             {day.isActuallyBooked ? 'Scheduled' : 'Plan Day'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-300 mt-0.5">No Plan</span>
                        )}
                     </button>
                   );
                })}
             </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-2 shadow-sm border border-stone-100 rounded-[2rem] overflow-hidden bg-white min-h-[300px] flex flex-col">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 py-6 bg-stone-50/50 border-b border-stone-100">
                   <div>
                      <CardTitle className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
                        {isSameDay(selectedDate, today) ? "Today's Schedule" : `Bookings on ${format(selectedDate, 'MMM do')}`}
                      </CardTitle>
                   </div>
                   <div className="flex gap-2">
                        <Button onClick={() => router.push('/booking/maid')} variant="outline" className="active:scale-95 transition-all rounded-full font-bold px-4 h-11 w-full sm:w-auto">
                            <Sparkles className="mr-2 h-4 w-4" /> Maid
                        </Button>
                        <Button onClick={() => router.push('/booking/menu')} className="bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white rounded-full font-bold px-6 h-11 shadow-lg shadow-green-500/20 w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Cook
                        </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-4 flex-1">
                   {displayedBookings.length > 0 ? displayedBookings.map((booking) => {
                      const cancellable = canCancel(booking.date, booking.time);
                      
                      return (
                      <div key={booking.id} className="p-5 sm:p-6 rounded-3xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
                         {booking.status === 'pending' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-l-3xl"></div>}
                         {booking.status === 'confirmed' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-3xl"></div>}
                         
                         <div className="pl-3 sm:pl-4">
                            <div className="flex items-center gap-2.5 mb-2">
                               {booking.type === 'cook' ? <ChefHat className="w-5 h-5 text-orange-500" /> : <Sparkles className="w-5 h-5 text-green-500" strokeWidth={2.5}/>}
                               <h3 className="font-bold text-lg text-stone-900 group-hover:text-stone-700 transition-colors">{booking.service}</h3>
                            </div>
                            <p className="text-sm font-bold text-stone-500 flex items-center gap-1.5 mt-2">
                               <Clock className="w-4 h-4 text-stone-400" />
                               {format(new Date(booking.date), 'MMMM do')}, {booking.time}
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-stone-50">
                                {cancellable ? (
                                    <button 
                                      onClick={() => handleCancelBooking(booking.originalBookingId)} 
                                      className="text-xs font-bold text-stone-400 hover:text-red-500 flex items-center gap-1.5 transition-colors group-hover:opacity-100 opacity-60"
                                    >
                                      <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} /> Cancel Booking
                                    </button>
                                ) : (
                                    <p className="text-[10px] font-bold text-stone-300">Cancellation unavailable within 24 hours of service.</p>
                                )}
                            </div>
                         </div>
                         
                         <div className="flex flex-col items-start sm:items-end gap-2.5 pl-3 sm:pl-0 sm:text-right border-t border-stone-100 sm:border-none pt-4 sm:pt-0">
                            {booking.status === 'pending' ? (
                               <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-none uppercase tracking-wider text-[10px]">
                                  <Hourglass className="w-3.5 h-3.5" />
                                  Awaiting Assignment
                               </Badge>
                            ) : booking.status === 'completed' ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-none uppercase tracking-wider text-[10px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 fill-blue-200" />
                                  Completed
                               </Badge>
                            ) : (
                               <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-none uppercase tracking-wider text-[10px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 fill-green-200" />
                                  Confirmed
                               </Badge>
                            )}
                            <div className="text-xs font-bold text-stone-500 max-w-[200px] mt-1 space-y-1">
                               {booking.status === 'pending' ? (
                                  <p>We are matching you with a verified professional.</p>
                               ) : booking.professional ? (
                                  <p className="bg-stone-50 px-2 py-1 rounded inline-block">Assigned to: <span className="text-stone-800">{booking.professional?.name}</span> ({booking.professional?.rating}⭐)</p>
                               ) : null}
                               
                               {booking.type === 'cook' && !booking.isDishSelected && (
                                  <div className="mt-1.5 text-left sm:text-right animate-pulse">
                                    <p className="text-orange-600 font-bold bg-orange-50 border border-orange-200 inline-block px-2 py-1 rounded">Action Required: No dishes selected!</p>
                                    <button onClick={() => { setModalBookingDate(new Date(booking.date)); setIsModalOpen(true); }} className="text-[10px] text-orange-500 hover:text-orange-600 font-black block sm:ml-auto mt-1 tracking-wider uppercase">Select Menu →</button>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   )}) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center text-stone-500 h-full border-2 border-dashed border-stone-100 rounded-3xl">
                         <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 border border-stone-200 shadow-sm">
                           <CalendarIcon className="w-6 h-6 text-stone-300" />
                         </div>
                         <p className="font-bold text-stone-900 text-lg">No bookings.</p>
                         <p className="font-medium text-stone-400 mt-1 max-w-[200px]">You have no scheduled services for {format(selectedDate, 'MMM do')}.</p>
                      </div>
                   )}
                </CardContent>
             </Card>

             <div className="space-y-6">
                
                <Card className="shadow-sm border border-stone-100 rounded-[2rem] bg-white">
                   <CardHeader className="pb-3 px-6 pt-6">
                      <CardTitle className="text-xl font-bold tracking-tight text-stone-900">Manage Your Home</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-5 px-6 pb-6">
                      <div className="space-y-3">
                         <button onClick={() => router.push('/booking/menu')} className="w-full text-left p-4 rounded-[1.25rem] border-2 border-stone-100 bg-stone-50 hover:bg-white hover:border-orange-500 active:scale-[0.98] transition-all group flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2 font-black mb-1 text-stone-800 group-hover:text-orange-600 transition-colors tracking-tight">
                                  <ChefHat className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
                                  Book a Cook
                               </div>
                               <p className="text-xs font-bold text-stone-400">Fresh, home-cooked meals</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-orange-500 transition-colors" />
                         </button>
                         <button onClick={() => router.push('/booking/maid')} className="w-full text-left p-4 rounded-[1.25rem] border-2 border-stone-100 bg-stone-50 hover:bg-white hover:border-green-500 active:scale-[0.98] transition-all group flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2 font-black mb-1 text-stone-800 group-hover:text-green-600 transition-colors tracking-tight">
                                  <Sparkles className="w-5 h-5 text-green-500" strokeWidth={2.5} />
                                  Book a Maid
                               </div>
                               <p className="text-xs font-bold text-stone-400">Instant daily chores</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-green-500 transition-colors" />
                         </button>
                      </div>

                      <div className="pt-5 border-t border-stone-100">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">Recent Activity</h4>
                         </div>
                         <ul className="space-y-4">
                            {transactions.length > 0 ? transactions.map(tx => (
                               <li key={tx.id} className="flex items-center justify-between">
                                  <div>
                                     <span className="font-bold text-sm text-stone-800 block">{tx.details?.description || tx.type}</span>
                                     <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{tx.date?.toDate ? format(tx.date.toDate(), 'MMM d') : 'Recent'}</span>
                                  </div>
                                  <span className={`font-black text-sm ${tx.type === 'recharge' ? 'text-green-600' : 'text-stone-700'}`}>
                                    {tx.type === 'recharge' ? '+' : '-'}₹{tx.amount}
                                  </span>
                               </li>
                            )) : (
                               <li className="text-stone-400 text-xs">No recent transactions.</li>
                            )}
                         </ul>
                      </div>
                   </CardContent>
                </Card>

                <Card className="shadow-none border border-stone-100 rounded-[2rem] overflow-hidden bg-gradient-to-br from-stone-50 to-white">
                   <CardHeader className="pb-3 px-6 pt-6">
                      <CardTitle className="flex items-center justify-between text-base font-bold text-stone-600 uppercase tracking-widest">
                         <span>Bookeato Wallet</span>
                         <Wallet className="h-5 w-5 text-stone-400" />
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="px-6 pb-6 pt-1 flex flex-col h-full justify-between">
                      <div>
                         <p className="text-5xl font-black tracking-tighter text-stone-900">₹{user.walletBalance || 0}</p>
                         <p className="text-xs font-bold text-stone-400 mt-3 leading-relaxed">
                            Auto-deductions enabled for overtime services.
                         </p>
                      </div>
                      <Button asChild variant="outline" className="w-full h-12 mt-6 font-bold rounded-xl border-2 border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 active:scale-95 transition-all text-sm shadow-sm">
                         <Link href="/wallet">Manage Funds</Link>
                      </Button>
                   </CardContent>
                </Card>

             </div>
          </div>
       </div>

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-[2.5rem] p-6 sm:p-8 border border-stone-100 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] gap-6 text-center sm:text-left">
           <DialogHeader className="space-y-3">
             <div className="w-14 h-14 bg-orange-100 text-orange-600 mx-auto sm:mx-0 rounded-full flex items-center justify-center mb-2 shadow-sm">
                <ChefHat className="w-7 h-7" strokeWidth={2.5}/>
             </div>
             <DialogTitle className="text-2xl font-black tracking-tight text-center sm:text-left text-stone-900">
               Select your menu for {modalBookingDate && format(modalBookingDate, 'MMM do')}
             </DialogTitle>
             <DialogDescription className="text-stone-500 text-center sm:text-left font-medium leading-relaxed">
               Your cook is confirmed, but we need to know what they should prepare. Select dishes from our personalized menu options so they arrive with the right prep instructions.
             </DialogDescription>
           </DialogHeader>
           
           <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-2 border-t border-stone-100 mt-2">
             <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full w-full sm:w-auto h-12 font-bold border-2 border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900">
               Do this later
             </Button>
             <Button onClick={() => {
                setIsModalOpen(false);
                router.push('/booking/menu'); 
             }} className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-lg shadow-orange-500/20 rounded-full w-full sm:w-auto h-12 font-bold transition-all px-8">
               Open Menu Selector
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </AppLayout>
  );
}
