'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Phone, 
    MapPin, 
    Clock, 
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
    CreditCard,
    ChefHat,
    Timer,
    Play
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Booking, CookProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

export default function CookDashboard() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState('schedule');
    const [profile, setProfile] = useState<CookProfile | null>(null);
    const [now, setNow] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);

    const effectiveCookId = auth?.currentUser?.uid;

    const assignmentsQuery = useMemoFirebase(() => {
        if (firestore && effectiveCookId) {
            return query(
                collection(firestore, 'assignments'),
                where('cookId', '==', effectiveCookId)
            );
        }
        return null;
    }, [firestore, effectiveCookId]);

    const { data: assignments, isLoading: isAssignmentsLoading } = useCollection<any>(assignmentsQuery);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!firestore || !effectiveCookId) return;
            try {
                const docSnap = await getDoc(doc(firestore, 'cooks', effectiveCookId));
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as CookProfile);
                }
            } catch (e) {
                console.error("Error fetching profile", e);
            }
        };
        fetchProfile();
    }, [firestore, effectiveCookId]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/');
    };

    if (isAssignmentsLoading) return (
        <AppLayout pageTitle="Loading Dashboard">
            <div className="p-8 text-center animate-pulse space-y-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full mx-auto" />
                <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Syncing Culinary Schedule...</p>
            </div>
        </AppLayout>
    );

    return (
        <AppLayout pageTitle="Partner Dashboard">
            <div className="space-y-8 pb-24">
                {/* Header Stats */}
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-stone-900">Chef {profile?.name || 'Partner'}</h1>
                        <p className="text-stone-500 font-bold flex items-center gap-2">
                             <ChefHat className="w-4 h-4 text-orange-500" /> Active Service Partner
                        </p>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleLogout} className="rounded-full h-12 w-12 border-2 border-stone-100">
                        <LogOut className="w-5 h-5 text-stone-400" />
                    </Button>
                </div>

                {/* Dashboard Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-900 text-white p-6 rounded-[2rem] space-y-2 shadow-xl shadow-stone-900/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Sessions</p>
                        <p className="text-4xl font-black">{assignments?.length || 0}</p>
                    </div>
                    <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Earnings</p>
                        <p className="text-4xl font-black text-orange-900">₹0</p>
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
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Upcoming Sessions</h2>
                        
                        {assignments?.length === 0 ? (
                            <Card className="border-dashed border-2 border-stone-100 py-16 text-center rounded-[2.5rem] bg-transparent">
                                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ChefHat className="w-8 h-8 text-stone-200" />
                                </div>
                                <p className="text-stone-400 font-bold max-w-[200px] mx-auto">No cooking sessions assigned yet.</p>
                            </Card>
                        ) : (
                            assignments?.map((booking: any) => (
                                <Card key={booking.id} className="rounded-[2.5rem] border-2 border-stone-100 overflow-hidden bg-white">
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black tracking-tight text-stone-900">
                                                    {booking.customerName || 'Premium Customer'}
                                                </h3>
                                                <p className="text-sm font-bold flex items-center gap-2 text-stone-400">
                                                    <Clock className="w-4 h-4" /> {booking.bookingDate ? format(new Date(booking.bookingDate), 'EEE, MMM d, hh:mm a') : 'TBD'}
                                                </p>
                                            </div>
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-bold">
                                                {booking.status?.toUpperCase() || 'ASSIGNED'}
                                            </Badge>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Customer Contact</p>
                                                    <p className="font-bold">{booking.customerContact || 'Revealed 1hr Before'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Address</p>
                                                    <p className="font-bold line-clamp-1">{booking.customerAddress || 'Premium Address'}</p>
                                                </div>
                                            </div>

                                            <div className="p-5 rounded-3xl bg-stone-50 border border-stone-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-stone-400">
                                                    <Sparkles className="w-3.5 h-3.5" /> Menu Details
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {booking.items?.map((item: any, idx: number) => (
                                                        <Badge key={idx} variant="outline" className="px-3 py-1 rounded-full border-none font-bold text-xs bg-white text-stone-600 shadow-sm">
                                                            {item.dishName}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <Button 
                                            asChild
                                            className="w-full h-16 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 font-black text-lg shadow-xl"
                                        >
                                            <Link href={`/cook/tutorials/${booking.id}?customerId=${booking.customerId}`}>
                                                VIEW SESSION DETAILS <ArrowRight className="w-5 h-5 ml-2" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-8">
                        {/* Profile Header */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-stone-100 rounded-[2rem] overflow-hidden flex items-center justify-center text-stone-300 relative border-4 border-white shadow-xl">
                                    {profile?.profilePhotoUrl ? (
                                        <img src={profile.profilePhotoUrl} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ChefHat className="w-10 h-10" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-stone-900">{profile?.name || 'Chef Partner'}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-bold px-3 py-1 rounded-full text-xs">
                                            CERTIFIED CHEF
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
                                        <p className="font-bold text-stone-900 truncate max-w-[100px]">{profile?.qualification || 'Culinary Artist'}</p>
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

                        <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 border-dashed">
                             <p className="text-xs font-bold text-orange-700 leading-relaxed text-center">
                                To update any of these details, please visit our office or contact support. These are verified professional records.
                             </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
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
