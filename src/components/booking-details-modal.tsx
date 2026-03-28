'use client'; 

import { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    X, Star, Heart, Check, Phone, 
    Calendar, Clock, MapPin, User,
    ChevronRight, ArrowRight, ArrowLeft, AlertCircle,
    BadgeCheck, Info, MoreVertical, Edit2, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { getRatingButtonColor } from '@/lib/rating-algorithm';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { differenceInHours } from 'date-fns';

interface BookingDetailsModalProps {
    booking: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingDetailsModal({ booking, open, onOpenChange }: BookingDetailsModalProps) {
    const { updateBookingRating, submitTip, user } = useCulinaryStore();
    const { toast } = useToast();
    const activePlan = user.subscription?.status || 'none';
    
    const [rating, setRating] = useState<number | null>(booking.customerRating || null);
    const [issueTypes, setIssueTypes] = useState<string[]>(booking.customerFeedback?.issueTypes || []);
    const [freeform, setFreeform] = useState(booking.customerFeedback?.freeform || '');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    
    const [tipSelected, setTipSelected] = useState<number | null>(booking.tipAmount || null);
    const [customTip, setCustomTip] = useState('');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const router = useRouter();

    if (!booking) return null;

    const bookingDate = parseISO(booking.bookingDate);
    const hoursToBooking = differenceInHours(bookingDate, new Date());
    const isLockInPeriod = activePlan !== 'none' && hoursToBooking < 6; // Simplified check
    const isPastBooking = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'delivered';
    const canModify = !isPastBooking && booking.status !== 'in_progress' && booking.id;

    const isDelivered = booking.status === 'completed' || booking.status === 'delivered';
    const hasAssignedPartner = !!(booking.maidName || booking.cookName);
    const partnerName = booking.maidName || booking.cookName || 'Service Partner';
    const partnerPhoto = booking.partnerPhotoUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed=bookeato'; // Gender neutral fallback
    const partnerRating = booking.partnerRating || 4.5;

    const ratingOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const tipOptions = [50, 75, 100];

    const handleRatingSubmit = async () => {
        if (rating === null) return;
        setIsSubmittingRating(true);
        try {
            await updateBookingRating(booking.id, rating, { issueTypes, freeform });
            toast({
                title: "Feedback Submitted",
                description: "Thank you for sharing your experience!",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to submit feedback.",
            });
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleTipSubmit = async (amount: number) => {
        try {
            await submitTip(booking.id, amount, partnerName);
            setTipSelected(amount);
            toast({
                title: "Tip Sent!",
                description: `₹${amount} tip sent to ${partnerName}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Insufficient Balance",
                description: error.message || "Something went wrong.",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-none max-w-md bg-stone-50 overflow-hidden rounded-[3rem] shadow-2xl">
                <DialogTitle className="sr-only">Booking Details</DialogTitle>
                
                <div className="max-h-[85vh] overflow-y-auto no-scrollbar pb-8">
                    {/* Header: Service Info */}
                    <div className="bg-white p-8 space-y-4 rounded-b-[2.5rem] shadow-sm">
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                                    {booking.service || (booking.type === 'maid' ? 'Maid' : 'Cook') + ' Service'}
                                </h2>
                                <p className="text-orange-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Booking #{booking.id ? booking.id.slice(-6).toUpperCase() : 'NEW'}
                                </p>
                           </div>
                            <div className="flex items-center gap-2">
                                {hasAssignedPartner && (
                            <div className="bg-stone-50 rounded-[2.5rem] p-8 border border-stone-100 flex items-center gap-6 group">
                                <div className="relative w-20 h-20 shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                        <Image 
                                            src={booking.partnerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`} 
                                            alt={partnerName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-stone-50 flex items-center justify-center">
                                        <BadgeCheck className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-black text-stone-900 tracking-tight">{partnerName}</h3>
                                        <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">Verified</Badge>
                                    </div>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest leading-none">Your Professional Service Partner</p>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="rounded-full bg-white h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-stone-100/50">
                                            <Phone className="w-3.5 h-3.5 mr-2" /> Call Partner
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                                {canModify && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full bg-stone-100 h-10 w-10 text-stone-400 hover:text-stone-900">
                                                <MoreVertical className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-2xl border-stone-100 p-2 shadow-xl" align="end">
                                            <DropdownMenuItem 
                                                className="rounded-xl flex items-center gap-2 font-bold focus:bg-stone-50"
                                                onClick={() => router.push(`/bookings/reschedule?id=${booking.id}`)}
                                                disabled={isLockInPeriod}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Reschedule {isLockInPeriod && "(Locked)"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="rounded-xl flex items-center gap-2 font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                                                onClick={() => router.push(`/bookings/cancel?id=${booking.id}`)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Cancel Booking
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-full bg-stone-100 h-10 w-10 text-stone-400 hover:text-stone-900"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Cost Breakdown trigger */}
                        <div 
                            onClick={() => setShowBreakdown(true)}
                            className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl cursor-pointer border-2 border-transparent hover:border-orange-200 transition-all active:scale-95 relative"
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-stone-400">Total Amount</span>
                                <span className="text-xl font-black text-stone-900">₹{booking.totalCost?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-400 font-bold text-xs uppercase tracking-tighter">
                                Breakdown
                                <ArrowRight className="w-4 h-4" />
                            </div>

                            {/* Popup Overlay for Breakdown */}
                            {showBreakdown && (
                                <div className="absolute inset-0 bg-white rounded-2xl z-20 flex flex-col p-4 shadow-xl border-2 border-orange-500 animate-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Cost Calculation</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowBreakdown(false); }}
                                            className="p-1 hover:bg-stone-100 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-stone-400" />
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between text-[11px] font-bold text-stone-600">
                                            <span>Base Service Fee</span>
                                            <span>₹{booking.totalCost - 50}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-stone-600">
                                            <span>Platform Fee</span>
                                            <span>₹50</span>
                                        </div>
                                        <div className="h-px bg-stone-100 my-1" />
                                        <div className="flex justify-between text-xs font-black text-stone-900">
                                            <span>Payable Amount</span>
                                            <span>₹{booking.totalCost}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Partner Card (If delivered or has partner) */}
                        {isDelivered && hasAssignedPartner && (
                            <div className="space-y-4">
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Assigned Professional</h3>
                                <Card className="rounded-3xl border-none bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img 
                                                src={partnerPhoto} 
                                                className="w-16 h-16 rounded-2xl bg-stone-100 object-cover" 
                                                alt={partnerName}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-lg p-1">
                                                <Star className="w-3 h-3 fill-current" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-stone-900 leading-tight">{partnerName}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-stone-400 font-bold text-xs uppercase tracking-tighter">Gold Partner</span>
                                                <span className="text-stone-300">•</span>
                                                <span className="flex items-center gap-0.5 text-xs font-black text-stone-900">
                                                    {partnerRating} <Star className="w-3 h-3 fill-current text-yellow-500" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Rating Logic */}
                        {isDelivered && (
                            <div className="space-y-4 pt-2">
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Rate your experience</h3>
                                <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {ratingOptions.map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setRating(val)}
                                                className={cn(
                                                    "w-[42px] h-[42px] rounded-xl text-xs font-black border-2 transition-all active:scale-95",
                                                    getRatingButtonColor(val, rating)
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Low Rating Flow */}
                                    {rating !== null && rating < 4 && (
                                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-black text-stone-900 tracking-tight flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                    What went wrong?
                                                </h4>
                                                <div className="grid gap-3">
                                                    {[
                                                        { id: 'partner', label: 'Partner Behaviour' },
                                                        { id: 'cleaning', label: 'Cleaning quality' },
                                                        { id: 'product', label: 'Bookeato Product' }
                                                    ].map(issue => (
                                                        <label key={issue.id} className="flex items-center gap-3 p-3 rounded-2xl border-2 border-stone-100 hover:border-stone-200 transition-colors cursor-pointer group active:scale-[0.98]">
                                                            <Checkbox 
                                                                checked={issueTypes.includes(issue.label)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) setIssueTypes([...issueTypes, issue.label]);
                                                                    else setIssueTypes(issueTypes.filter(i => i !== issue.label));
                                                                }}
                                                                className="rounded-[6px] border-stone-300 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900" 
                                                            />
                                                            <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900">{issue.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-stone-900">Additional details</h4>
                                                <textarea
                                                    placeholder="Tell us what happened in detail..."
                                                    value={freeform}
                                                    onChange={(e) => setFreeform(e.target.value)}
                                                    className="w-full min-h-[100px] rounded-2xl bg-stone-50 border-2 border-stone-100 p-4 text-sm font-medium focus:outline-none focus:border-stone-200 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button 
                                        className="w-full rounded-2xl h-14 bg-stone-900 text-white font-black hover:bg-stone-800 transition-all disabled:opacity-50"
                                        disabled={rating === null || isSubmittingRating}
                                        onClick={handleRatingSubmit}
                                    >
                                        {isSubmittingRating ? 'Saving...' : 'Submit Feedback'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Tipping Section */}
                        {isDelivered && hasAssignedPartner && (
                            <div className="space-y-4 pt-2">
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Add a tip to thank {partnerName.split(' ')[0]}</h3>
                                <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6 text-center">
                                    <div className="grid grid-cols-4 gap-2">
                                        {tipOptions.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleTipSubmit(opt)}
                                                className={cn(
                                                    "h-12 rounded-xl text-sm font-black border-2 transition-all active:scale-95 flex flex-col items-center justify-center relative overflow-hidden",
                                                    tipSelected === opt 
                                                        ? 'bg-orange-50 border-orange-500 text-orange-600' 
                                                        : 'border-stone-100 hover:border-stone-200 text-stone-600'
                                                )}
                                            >
                                                ₹{opt}
                                                {opt === 75 && (
                                                    <span className="absolute -bottom-1 left-0 right-0 bg-orange-500 text-[6px] text-white font-black uppercase tracking-tighter py-0.5">Popular</span>
                                                )}
                                            </button>
                                        ))}
                                        {/* Custom Tip */}
                                        <button
                                            className="h-12 rounded-xl text-xs font-black border-2 border-stone-100 hover:border-stone-200 text-stone-600 transition-all active:scale-95"
                                        >
                                            Custom
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold italic">100% of the tip goes directly to the partner profile.</p>
                                </div>
                            </div>
                        )}

                        {/* Booking Details Section */}
                        <div className="space-y-4 pt-2">
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Booking Information</h3>
                            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                                <div className="grid gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Date & Day</p>
                                            <p className="text-sm font-black text-stone-900">{format(parseISO(booking.bookingDate), 'PPP, EEEE')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Service Time</p>
                                            <p className="text-sm font-black text-stone-900">{booking.time || 'Schedule confirmed'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Service Address</p>
                                            <p className="text-sm font-bold text-stone-600 leading-snug">{booking.customerAddress || 'No address provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Customer Details</p>
                                            <p className="text-sm font-black text-stone-900">{booking.customerName || 'Guest User'}</p>
                                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">{booking.customerContact || ''}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
