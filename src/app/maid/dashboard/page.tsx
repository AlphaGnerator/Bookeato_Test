'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Phone, 
    MapPin, 
    Clock, 
    Play, 
    CheckCircle2, 
    Timer, 
    ExternalLink,
    LogOut,
    User,
    Sparkles,
    Check,
    Briefcase,
    GraduationCap,
    Star,
    FileText,
    ShieldCheck,
    CreditCard
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Booking, MaidProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaidDashboard() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const [maidSession, setMaidSession] = useState<{ id: string; name: string } | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<MaidProfile | null>(null);
    const [activeTab, setActiveTab] = useState('schedule');

    const effectiveMaidId = maidSession?.id || auth?.currentUser?.uid;

    const assignmentsQuery = useMemoFirebase(() => {
        if (firestore && effectiveMaidId) {
            return query(
                collection(firestore, 'assignments'),
                where('maidId', '==', effectiveMaidId)
            );
        }
        return null;
    }, [firestore, effectiveMaidId]);

    // Denormalized assignments fetch
    const { data: assignments, isLoading: isAssignmentsLoading } = useCollection<any>(assignmentsQuery);

    useEffect(() => {
        const sessionId = localStorage.getItem('maid_session_id');
        const sessionName = localStorage.getItem('maid_session_name');
        
        if (sessionId && sessionName) {
            setMaidSession({ id: sessionId, name: sessionName });
        }
        setIsCheckingSession(false);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!firestore || !effectiveMaidId) return;
            try {
                const docSnap = await getDoc(doc(firestore, 'maids', effectiveMaidId));
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as MaidProfile);
                }
            } catch (e) {
                console.error("Error fetching profile", e);
            }
        };
        fetchProfile();
    }, [firestore, effectiveMaidId]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleStartTask = async () => {
        if (!selectedBooking || !firestore || !effectiveMaidId) return;
        
        if (otpInput !== selectedBooking.otp) {
            toast({ variant: 'destructive', title: 'Incorrect OTP', description: 'Please ask the customer for the correct code.' });
            return;
        }

        setIsLoading(true);
        try {
            const customerId = selectedBooking.customerId;
            const bookingId = selectedBooking.id;

            // 1. Update assignment document
            await updateDoc(doc(firestore, 'assignments', bookingId), {
                status: 'in_progress',
                startTime: new Date().toISOString()
            });

            // 2. Update actual booking document
            await updateDoc(doc(firestore, 'customers', customerId, 'bookings', bookingId), {
                status: 'in_progress',
                startTime: new Date().toISOString()
            });

            toast({ title: 'Task Started', description: 'Timer is now running. Good luck!' });
            setIsOtpDialogOpen(false);
            setOtpInput('');
            setSelectedBooking(null);
        } catch (error: any) {
            console.error('Failed to start task', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to start task.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteTask = async (booking: any) => {
        if (!firestore) return;

        setIsLoading(true);
        try {
            const customerId = booking.customerId;
            const bookingId = booking.id;

            await updateDoc(doc(firestore, 'assignments', bookingId), {
                status: 'completed',
                endTime: new Date().toISOString()
            });

            await updateDoc(doc(firestore, 'customers', customerId, 'bookings', bookingId), {
                status: 'completed',
                endTime: new Date().toISOString()
            });

            toast({ title: 'Task Completed', description: 'Well done! Your earnings will be updated soon.' });
        } catch (error: any) {
            console.error('Failed to complete task', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete task.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('maid_session_id');
        localStorage.removeItem('maid_session_name');
        localStorage.removeItem('maid_session_phone');
        if (auth) {
            await signOut(auth);
        }
        router.push('/');
    };

    if (isAssignmentsLoading || isCheckingSession) return (
        <AppLayout pageTitle="Loading Dashboard">
            <div className="p-8 text-center animate-pulse space-y-4">
                <div className="h-12 w-12 bg-stone-100 rounded-full mx-auto" />
                <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Syncing Schedule...</p>
            </div>
        </AppLayout>
    );

    return (
        <AppLayout pageTitle="Partner Dashboard">
            <div className="space-y-8 pb-24">
                {/* Header Stats */}
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-stone-900">Welcome back!</h1>
                        <p className="text-stone-500 font-bold flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-500" /> Active Service Partner
                        </p>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleLogout} className="rounded-full h-12 w-12 border-2 border-stone-100">
                        <LogOut className="w-5 h-5 text-stone-400" />
                    </Button>
                </div>

                {/* Dashboard Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-900 text-white p-6 rounded-[2rem] space-y-2 shadow-xl shadow-stone-900/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Tasks</p>
                        <p className="text-4xl font-black">{assignments?.length || 0}</p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-100 p-6 rounded-[2rem] space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Earnings</p>
                        <p className="text-4xl font-black text-green-900">₹0</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-stone-100 rounded-2xl h-14 p-1 mb-8">
                        <TabsTrigger value="schedule" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Clock className="w-3.5 h-3.5 mr-2" /> Schedule
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <User className="w-3.5 h-3.5 mr-2" /> My Profile
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="space-y-6">
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Today's Schedule</h2>
                        
                        {assignments?.length === 0 ? (
                            <Card className="border-dashed border-2 border-stone-100 py-16 text-center rounded-[2.5rem] bg-transparent">
                                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-stone-200" />
                                </div>
                                <p className="text-stone-400 font-bold max-w-[200px] mx-auto">No tasks assigned for today yet.</p>
                            </Card>
                        ) : (
                        assignments?.map((booking: any) => {
                            const isInProgress = booking.status === 'in_progress';
                            const isCompleted = booking.status === 'completed';
                            const startTime = booking.startTime ? new Date(booking.startTime) : null;
                            const elapsedSecs = isInProgress && startTime ? differenceInSeconds(now, startTime) : 0;
                            const hours = Math.floor(elapsedSecs / 3600);
                            const mins = Math.floor((elapsedSecs % 3600) / 60);
                            const secs = elapsedSecs % 60;

                            return (
                                <Card key={booking.id} className={`rounded-[2.5rem] transition-all duration-500 overflow-hidden border-2 ${
                                    isInProgress ? 'bg-green-500 border-green-600 text-white shadow-2xl shadow-green-500/30' : 
                                    isCompleted ? 'bg-stone-50 border-stone-100 opacity-60' :
                                    'bg-white border-stone-100'
                                }`}>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-2xl font-black tracking-tight ${isInProgress ? 'text-white' : 'text-stone-900'}`}>
                                                        {booking.customerName || 'Premium Customer'}
                                                    </h3>
                                                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                                </div>
                                                <p className={`text-sm font-bold flex items-center gap-2 ${isInProgress ? 'text-green-100' : 'text-stone-400'}`}>
                                                    <Clock className="w-4 h-4" /> {booking.bookingDate ? format(new Date(booking.bookingDate), 'hh:mm a') : 'TBD'}
                                                </p>
                                            </div>
                                            {isInProgress && (
                                                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-xl flex items-center gap-2">
                                                    <Timer className="w-5 h-5 animate-pulse" />
                                                    {hours > 0 ? `${hours}:` : ''}{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-4">
                                            <a 
                                                href={`tel:${booking.customerContact}`} 
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                                                    isInProgress ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-stone-50 border-stone-100 hover:bg-stone-100'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isInProgress ? 'bg-white/20' : 'bg-white'}`}>
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isInProgress ? 'text-green-100' : 'text-stone-400'}`}>Call Customer</p>
                                                    <p className="font-bold">{booking.customerContact || 'N/A'}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                            </a>

                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.customerAddress || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                                                    isInProgress ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-stone-50 border-stone-100 hover:bg-stone-100'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isInProgress ? 'bg-white/20' : 'bg-white'}`}>
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isInProgress ? 'text-green-100' : 'text-stone-400'}`}>Address</p>
                                                    <p className="font-bold line-clamp-1">{booking.customerAddress || 'Premium Address'}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                            </a>

                                            <div className={`p-5 rounded-3xl border ${
                                                isInProgress ? 'bg-white/10 border-white/20' : 'bg-stone-50 border-stone-100'
                                            }`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isInProgress ? 'text-green-100' : 'text-stone-400'}`}>
                                                    <Sparkles className="w-3.5 h-3.5" /> Tasks to Perform
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {booking.items && booking.items.length > 0 ? (
                                                        booking.items.map((item: any, idx: number) => (
                                                            <Badge key={idx} variant="outline" className={`px-3 py-1 rounded-full border-none font-bold text-xs ${
                                                                isInProgress ? 'bg-white text-green-600' : 'bg-white text-stone-600 shadow-sm'
                                                            }`}>
                                                                {item.dishName || item.choreName || 'Cleaning Task'}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs font-medium opacity-60 italic">Standard service package</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!isCompleted && (
                                            <div className="pt-4">
                                                {isInProgress ? (
                                                    <Button 
                                                        onClick={() => handleCompleteTask(booking)}
                                                        className="w-full h-16 rounded-2xl bg-white text-green-600 hover:bg-green-50 font-black text-lg shadow-xl"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? 'Processing...' : 'COMPLETE TASK'}
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setIsOtpDialogOpen(true);
                                                        }}
                                                        className="w-full h-16 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 font-black text-lg shadow-xl"
                                                        disabled={isLoading}
                                                    >
                                                        <Play className="w-6 h-6 mr-2 fill-current" /> START TASK
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {isCompleted && (
                                            <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-black uppercase tracking-widest text-xs">
                                                <Check className="w-4 h-4" strokeWidth={3} /> Job Done
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }) ) }
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-8">
                        {/* Profile Header */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-stone-100 rounded-[2rem] overflow-hidden flex items-center justify-center text-stone-300 relative border-4 border-white shadow-xl">
                                    {profile?.profilePhotoUrl ? (
                                        <img src={profile.profilePhotoUrl} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-stone-900">{profile?.name || maidSession?.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-bold px-3 py-1 rounded-full text-xs">
                                            VERIFIED PARTNER
                                        </Badge>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-black text-sm">{profile?.rating || '5.0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <Briefcase className="w-5 h-5 text-stone-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Experience</p>
                                        <p className="font-bold text-stone-900">{profile?.experience || 0} Years</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <GraduationCap className="w-5 h-5 text-stone-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Qualification</p>
                                        <p className="font-bold text-stone-900 truncate max-w-[100px]">{profile?.qualification || 'Verified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-stone-900 px-4">Professional Details</h3>
                            <div className="bg-white rounded-[2.5rem] border-2 border-stone-100 divide-y divide-stone-50 overflow-hidden">
                                <ProfileItem icon={<MapPin className="w-4 h-4" />} label="Permanent Address" value={profile?.address || 'Verified during onboarding'} />
                                <ProfileItem icon={<User className="w-4 h-4" />} label="Gender" value={profile?.gender || 'Not Specified'} />
                                <ProfileItem icon={<CreditCard className="w-4 h-4" />} label="KYC (Aadhaar/ID)" value={profile?.aadhaarNumber ? `********${profile.aadhaarNumber.slice(-4)}` : 'Not Available'} />
                                <ProfileItem icon={<Phone className="w-4 h-4" />} label="Registered Phone" value={profile?.contactNumber || 'N/A'} />
                            </div>
                        </div>

                        {/* Verified Documents */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-stone-900 px-4">Verified Documents</h3>
                            <div className="grid gap-3">
                                {profile?.aadhaarPhotoUrl && (
                                    <a href={profile.aadhaarPhotoUrl} target="_blank" className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border-2 border-stone-100 hover:bg-stone-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                            <span className="font-bold text-sm">Aadhaar Card Copy</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-stone-400" />
                                    </a>
                                )}
                                {profile?.contractUrl && (
                                    <a href={profile.contractUrl} target="_blank" className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border-2 border-stone-100 hover:bg-stone-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            <span className="font-bold text-sm">Service Contract Signed</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-stone-400" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 border-dashed">
                             <p className="text-xs font-bold text-amber-700 leading-relaxed text-center">
                                To update any of these details, please visit our office or contact support. These are verified professional records.
                             </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* OTP Dialog */}
            <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-sm">
                    <DialogHeader className="space-y-3">
                        <div className="w-16 h-16 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <Shield className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter text-center">Verify OTP</DialogTitle>
                        <DialogDescription className="text-stone-500 font-medium text-center">
                            Ask the customer for the 4-digit code to start the service.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <Input 
                            type="text" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="0 0 0 0" 
                            className="text-center text-4xl font-black h-20 rounded-3xl border-2 border-stone-100 tracking-[0.5em] focus-visible:ring-stone-900 focus-visible:border-stone-900"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <DialogFooter>
                        <Button 
                            onClick={handleStartTask}
                            className="bg-stone-900 hover:bg-stone-800 text-white rounded-2xl h-16 w-full font-black text-lg shadow-xl"
                            disabled={isLoading || otpInput.length < 4}
                        >
                            {isLoading ? 'Verifying...' : 'VERIFY & START'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function Shield({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 shrink-0">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</p>
                <p className="font-bold text-stone-900 text-sm leading-relaxed">{value}</p>
            </div>
        </div>
    );
}
