'use client'; 

import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { format, isSameDay, isAfter, isBefore, addHours, differenceInHours, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Clock, Calendar, ChefHat, Sparkles, 
    ArrowRight, Timer, MoreVertical,
    CheckCircle2, XCircle, ArrowLeft,
    CalendarDays, RefreshCw, Trash2,
    Filter, HelpCircle, PhoneCall
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { BookingDetailsModal } from '@/components/booking-details-modal';

// --- Simple Filter Toggle ---
function FilterToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2",
                active 
                    ? "bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-200" 
                    : "bg-white border-stone-100 text-stone-400 hover:border-stone-200"
            )}
        >
            {label}
        </button>
    );
}

// --- Booking Card (Refined) ---

function BookingCard({ booking, onClick }: { booking: any, onClick: () => void }) {
    const bookingDate = parseISO(booking.bookingDate);
    const isMaid = booking.type === 'maid';
    
    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
        confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        completed: { label: 'Completed', color: 'bg-stone-100 text-stone-600', icon: CheckCircle2 },
        delivered: { label: 'Delivered', color: 'bg-stone-100 text-stone-600', icon: CheckCircle2 },
        cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const status = statusConfig[booking.status] || statusConfig.pending;

    return (
        <Card 
            onClick={onClick}
            className="rounded-[2.5rem] border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
        >
            <CardContent className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                            isMaid ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        )}>
                            {isMaid ? <Sparkles className="w-7 h-7" /> : <ChefHat className="w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-stone-900 leading-tight tracking-tight">
                                {booking.service || (isMaid ? 'Maid Service' : 'Cook Service')}
                            </h4>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                {format(bookingDate, 'EEE, MMM d')} • {booking.time || 'Time TBD'}
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-200 group-hover:text-stone-900 transition-colors" />
                </div>

                <div className="mt-5 flex items-center justify-between">
                    <Badge className={`${status.color} border-none font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider`}>
                        <status.icon className="w-3 h-3 mr-1" />
                        {status.label}
                    </Badge>
                    <span className="text-lg font-black text-stone-900">₹{booking.totalCost?.toLocaleString() || '0'}</span>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Main Bookings Page ---

export default function BookingsPage() {
    const { bookings, isInitialized, generateSubscriptionBookings } = useCulinaryStore();
    const router = useRouter();
    const { toast } = useToast();

    // Filters
    const [showCancelled, setShowCancelled] = useState(false);
    const [hideSubscription, setHideSubscription] = useState(false);
    const [showDeliveredOnly, setShowDeliveredOnly] = useState(false);
    
    // Modal State
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Initial effect to generate subscription bookings if missing
    useEffect(() => {
        if (isInitialized) {
            generateSubscriptionBookings().catch(console.error);
        }
    }, [isInitialized, generateSubscriptionBookings]);

    const filteredAndSorted = useMemo(() => {
        if (!bookings) return { today: [], others: [] };

        let list = [...bookings];

        // Apply Filters
        if (!showCancelled) {
            list = list.filter(b => b.status !== 'cancelled');
        }
        if (hideSubscription) {
            list = list.filter(b => b.type !== 'subscription' && b.service !== 'Subscription Booking');
        }
        if (showDeliveredOnly) {
            list = list.filter(b => b.status === 'completed' || b.status === 'delivered');
        }

        const now = new Date();
        const today: any[] = [];
        const others: any[] = [];

        list.forEach(b => {
            const bDate = parseISO(b.bookingDate);
            if (isSameDay(bDate, now)) {
                today.push(b);
            } else {
                others.push(b);
            }
        });

        // Sort Today (Coming up first, or recently delivered)
        today.sort((a, b) => parseISO(a.bookingDate).getTime() - parseISO(b.bookingDate).getTime());
        
        // Sort Others (Date wise)
        others.sort((a, b) => parseISO(a.bookingDate).getTime() - parseISO(b.bookingDate).getTime());

        return { today, others };
    }, [bookings, showCancelled, hideSubscription, showDeliveredOnly]);

    if (!isInitialized) return null;

    return (
        <AppLayout pageTitle="Bookings Hub">
            <div className="max-w-xl mx-auto pb-32 space-y-8">
                {/* Header with Help Button */}
                <div className="flex items-center justify-between pt-4 px-2">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.back()}
                            className="rounded-full bg-stone-100 h-10 w-10 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-stone-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Bookings Hub</h1>
                            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Your schedule at a glance</p>
                        </div>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/help')}
                        className="rounded-2xl border-2 border-orange-100 text-orange-600 font-black h-10 px-4 gap-2 hover:bg-orange-50 active:scale-95 transition-all shadow-sm"
                    >
                        <PhoneCall className="w-4 h-4" />
                        Help
                    </Button>
                </div>

                {/* Filter Section */}
                <div className="space-y-4 px-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        <FilterToggle 
                            label="Cancelled" 
                            active={showCancelled} 
                            onClick={() => setShowCancelled(!showCancelled)} 
                        />
                        <FilterToggle 
                            label="Hide Subcritions" 
                            active={hideSubscription} 
                            onClick={() => setHideSubscription(!hideSubscription)} 
                        />
                        <FilterToggle 
                            label="Delivered" 
                            active={showDeliveredOnly} 
                            onClick={() => setShowDeliveredOnly(!showDeliveredOnly)} 
                        />
                    </div>
                </div>

                {/* Bookings List */}
                <div className="space-y-10">
                    {/* Today Section */}
                    {filteredAndSorted.today.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Scheduled Today</h3>
                                <div className="h-px flex-1 bg-orange-100" />
                            </div>
                            <div className="space-y-4">
                                {filteredAndSorted.today.map((b, i) => (
                                    <BookingCard 
                                        key={b.id || i} 
                                        booking={b} 
                                        onClick={() => setSelectedBooking(b)} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Others Section */}
                    {filteredAndSorted.others.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Other Sessions</h3>
                                <div className="h-px flex-1 bg-stone-100" />
                            </div>
                            <div className="space-y-4">
                                {filteredAndSorted.others.map((b, i) => (
                                    <BookingCard 
                                        key={b.id || i} 
                                        booking={b} 
                                        onClick={() => setSelectedBooking(b)} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredAndSorted.today.length === 0 && filteredAndSorted.others.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-stone-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-stone-200">
                                <CalendarDays className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-stone-900 font-black text-xl tracking-tight">Clean slate!</p>
                                <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">No bookings match your current filters.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-2xl border-stone-200 font-black h-12 px-8"
                                onClick={() => {
                                    setShowCancelled(false);
                                    setHideSubscription(false);
                                    setShowDeliveredOnly(false);
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal 
                    booking={selectedBooking} 
                    open={!!selectedBooking} 
                    onOpenChange={(open) => !open && setSelectedBooking(null)} 
                />
            )}
        </AppLayout>
    );
}
