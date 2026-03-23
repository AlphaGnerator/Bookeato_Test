'use client';

import React, { useState } from 'react';
import { differenceInHours, format } from 'date-fns';
import { MoreVertical, Pencil, Calendar, Trash2, ChefHat, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditBookingModal } from './edit-booking-modal';
import { useToast } from '@/hooks/use-toast';

export type Booking = {
  id: string | number;
  service: string;
  type: 'cook' | 'maid';
  date: string;
  time: string;
  status: 'pending' | 'confirmed';
  currentPrice: number;
  items: string[];
};

interface UpcomingBookingsFeedProps {
  bookings: Booking[];
}

export function UpcomingBookingsFeed({ bookings }: UpcomingBookingsFeedProps) {
  const { toast } = useToast();
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canModifyBooking = (bookingDateStr: string, timeStr: string) => {
    try {
        const bookingDate = new Date(bookingDateStr);
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        let parsedHours = parseInt(hours, 10);
        
        if (parsedHours === 12 && modifier === 'AM') parsedHours = 0;
        if (modifier === 'PM' && parsedHours < 12) parsedHours += 12;
        
        bookingDate.setHours(parsedHours, parseInt(minutes, 10), 0, 0);
        
        const hoursDiff = differenceInHours(bookingDate, new Date());
        return hoursDiff >= 24; // Critical logic check for 24-hr modification gate
    } catch {
        return false;
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleEditClick = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setIsEditModalOpen(true);
  };

  const handleRescheduleClick = (booking: Booking) => {
    toast({ title: 'Reschedule Flow', description: 'Calendar selector would open here.' });
  };

  const handleCancelClick = (booking: Booking) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
        toast({ title: 'Booking Cancelled', description: 'Refund initiated.' });
        // Handled via external logic or API normally
    }
  };

  return (
    <div className="space-y-4">
      {sortedBookings.map((booking) => {
        const isModifiable = canModifyBooking(booking.date, booking.time);
        
        return (
          <div key={booking.id} className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-between group hover:border-stone-200 hover:shadow-md transition-all">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${booking.type === 'cook' ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-green-50 border-green-100 text-green-500'}`}>
                 {booking.type === 'cook' ? <ChefHat className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg sm:text-base">{booking.service}</h3>
                <p className="text-sm font-bold text-stone-500 tracking-tight">
                  {format(new Date(booking.date), 'MMM do, yyyy')} • {booking.time}
                </p>
                <div className="mt-2 text-xs font-bold px-2.5 py-1 rounded-md inline-block tracking-wider uppercase bg-stone-100 text-stone-600">
                  {booking.status}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 focus:outline-none transition-colors border border-stone-100 shadow-sm self-start sm:self-auto" title={!isModifiable ? "Modifications locked 24hrs before service" : "Options"}>
                <MoreVertical className="w-5 h-5 text-stone-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl shadow-stone-200/50 border-stone-100 bg-white">
                <DropdownMenuItem 
                  disabled={!isModifiable} 
                  onClick={() => handleEditClick(booking)}
                  className="font-bold text-stone-800 cursor-pointer rounded-xl focus:bg-stone-50 h-12 hover:text-orange-600 focus:text-orange-600"
                >
                  <Pencil className="w-4 h-4 mr-3" /> Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled={!isModifiable}
                  onClick={() => handleRescheduleClick(booking)}
                  className="font-bold text-stone-800 cursor-pointer rounded-xl focus:bg-stone-50 h-12 hover:text-stone-900"
                >
                  <Calendar className="w-4 h-4 mr-3" /> Reschedule
                </DropdownMenuItem>
                <div className="h-px bg-stone-100 my-1"></div>
                <DropdownMenuItem 
                  disabled={!isModifiable}
                  onClick={() => handleCancelClick(booking)}
                  className="font-bold text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-xl h-12 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3" /> Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        );
      })}

      {selectedBookingForAction && (
        <EditBookingModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          selectedBooking={selectedBookingForAction} 
        />
      )}
    </div>
  );
}
