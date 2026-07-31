'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Booking } from '@/lib/types';
import { format, isSameDay, parseISO } from 'date-fns';
import { ChevronRight, Clock, Key } from 'lucide-react';
import { BookingDetailsModal } from './booking-details-modal';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function BookingMiniStatus() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Query for active bookings for the current user
    const activeBookingQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const bookingsRef = collection(firestore, `customers/${user.uid}/bookings`);
        return query(
            bookingsRef,
            where('status', 'in', ['confirmed', 'in_progress', 'pending']),
            orderBy('bookingDate', 'asc'),
            limit(1)
        );
    }, [firestore, user]);

    const { data: bookings } = useCollection<Booking>(activeBookingQuery);
    
    const activeBooking = bookings?.[0];

    // Only show if booking is today
    const isToday = activeBooking && isSameDay(new Date(), parseISO(activeBooking.bookingDate));

    if (!activeBooking || !isToday) return null;

    return (
        <>
            <div 
                onClick={() => {
                    setSelectedBooking(activeBooking);
                    setIsModalOpen(true);
                }}
                className="fixed bottom-24 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-500 cursor-pointer active:scale-95 transition-all md:hidden"
            >
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                        <Image 
                            src={activeBooking.partnerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeBooking.cookName || activeBooking.maidName || 'Partner'}`} 
                            alt="Partner"
                            fill
                            className="object-cover rounded-xl"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-inner" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Arriving At</span>
                            <span className="text-xs font-black text-stone-900">{activeBooking.time || 'Schedule confirmed'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Key className="w-3 h-3 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">OTP:</span>
                            <span className="text-xs font-black text-orange-600 tracking-[0.2em]">{activeBooking.otp || '----'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-1 rounded-lg">
                        {activeBooking.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-5 h-5 text-stone-300" />
                </div>
            </div>

            {selectedBooking && (
                <BookingDetailsModal 
                    booking={selectedBooking} 
                    open={isModalOpen} 
                    onOpenChange={setIsModalOpen} 
                />
            )}
        </>
    );
}
