'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
    User, Wallet, Star, MapPin, CreditCard, 
    FileText, Settings, Info, Share2, LogOut, 
    ChevronRight, List, LifeBuoy, Sparkles, ArrowLeft
} from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface AccountActionProps {
    icon: React.ElementType;
    label: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    color?: string;
    badge?: string;
}

function AccountAction({ icon: Icon, label, description, href, onClick, color = "text-stone-500", badge }: AccountActionProps) {
    const content = (
        <div className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors cursor-pointer group rounded-2xl">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-stone-100 ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black text-stone-900 leading-tight">{label}</h4>
                    {description && <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {badge && <Badge variant="secondary" className="bg-stone-100 text-stone-600 font-bold border-none capitalize">{badge}</Badge>}
                <ChevronRight className="w-5 h-5 text-stone-300" />
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return <div onClick={onClick}>{content}</div>;
}

export default function AccountPage() {
    const { user: firebaseUser } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { user: profile, isInitialized } = useCulinaryStore();

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({ title: 'Logged Out', description: 'See you again soon!' });
            router.push('/');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Logout Failed' });
        }
    };

    if (!isInitialized) return null;

    return (
        <AppLayout pageTitle="Account Center">
            <div className="max-w-xl mx-auto space-y-8 pb-32 px-4">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 pt-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full bg-stone-100 h-10 w-10 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Account Center</h1>
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Manage your profile & settings</p>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center gap-3 pt-4">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} />
                        <AvatarFallback className="bg-stone-100 font-black text-2xl text-stone-500">{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-black text-stone-950 tracking-tight">{profile.name}</h2>
                        <p className="text-sm font-bold text-stone-400 tracking-wider uppercase">{profile.email}</p>
                    </div>
                    {profile.subscription?.status === 'active' && (
                        <Badge className="mt-2 bg-gradient-to-r from-stone-900 to-stone-700 text-white font-black px-4 py-1.5 rounded-full border-none shadow-lg items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            PLUS MEMBER
                        </Badge>
                    )}
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-[2.5rem] border-stone-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/bookings')}>
                        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                            <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 group-hover:scale-110 transition-transform">
                                <List className="w-6 h-6" />
                            </div>
                            <span className="font-black text-stone-900 text-sm">My Bookings</span>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2.5rem] border-stone-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/wallet')}>
                        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                            <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="font-black text-stone-900 text-sm">₹{profile.walletBalance?.toLocaleString()}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Account List Groups */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4">Subscription & Loyalty</h3>
                    <Card className="rounded-[2.5rem] border-stone-100 shadow-sm overflow-hidden p-2">
                        <AccountAction icon={Sparkles} label="My Plan" description="Manage current membership" href="/plan-details" color="text-orange-600" />
                        <AccountAction icon={Star} label="Plus Membership" description="Exclusive benefits & perks" href="/pricing" color="text-purple-600" />
                        <AccountAction icon={Share2} label="Refer & Earn" description="Invite friends, get credits" color="text-green-600" />
                    </Card>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4 mt-8">Configuration</h3>
                    <Card className="rounded-[2.5rem] border-stone-100 shadow-sm overflow-hidden p-2">
                        <AccountAction icon={MapPin} label="Manage Address" description="Home, Work, Other" href="/profile" color="text-blue-600" />
                        <AccountAction icon={CreditCard} label="Payment Methods" description="Saved cards & UPI" color="text-stone-900" />
                        <AccountAction icon={FileText} label="Manage Documents" description="KYC & Identity proof" color="text-stone-900" />
                        <AccountAction icon={Settings} label="Settings" description="Notifications & Privacy" color="text-stone-900" />
                    </Card>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4 mt-8">Support & Legal</h3>
                    <Card className="rounded-[2.5rem] border-stone-100 shadow-sm overflow-hidden p-2">
                        <AccountAction icon={LifeBuoy} label="Help & Support" description="Get instant resolution" color="text-orange-500" />
                        <AccountAction icon={Info} label="About Application" description="Version 2.0.4 Premium" color="text-stone-900" />
                        <AccountAction icon={LogOut} label="Logout" description="Safely exit session" onClick={handleLogout} color="text-red-500" />
                    </Card>
                </div>

                <p className="text-center text-[10px] font-black text-stone-300 uppercase tracking-widest pt-8 pb-4">
                    Proudly built for Bookeato
                </p>
            </div>
        </AppLayout>
    );
}
