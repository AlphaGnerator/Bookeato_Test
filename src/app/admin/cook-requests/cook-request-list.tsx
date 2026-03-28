'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    CheckCircle2, Clock, Search, MapPin, 
    User, ArrowRight, UserCheck, AlertTriangle, 
    Sparkles, Phone, Calendar, Shield, Upload, 
    FileText, Star, GraduationCap, Briefcase, 
    Loader2, ChefHat, Trash2, ShieldCheck, X 
} from 'lucide-react';
import { LoadingState } from "@/components/loading-state";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { CookProfile } from '@/lib/types';
import { uploadPartnerFiles } from '@/firebase/storage-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';

export function CookRequestList() {
    const firestore = useFirestore();
    const { storage } = useFirebase();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCook, setSelectedCook] = useState<CookProfile | null>(null);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [kycData, setKycData] = useState({ 
        pincode: '', 
        aadhaar: '',
        address: '',
        qualification: '',
        experience: '0',
        rating: '5',
        gender: ''
    });
    const [files, setFiles] = useState<{
        profilePhoto: File | null;
        aadhaarPhoto: File | null;
        contract: File | null;
    }>({
        profilePhoto: null,
        aadhaarPhoto: null,
        contract: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const cooksCollectionRef = useMemoFirebase(() => {
        if (firestore) {
            return collection(firestore, 'cooks');
        }
        return null;
    }, [firestore]);

    const { data: cooks, isLoading: isCollectionLoading, error } = useCollection<CookProfile>(cooksCollectionRef);

    const sortedCooks = useMemo(() => {
        if (!cooks) return [];
        return [...cooks].sort((a, b) => {
            if (a.status !== b.status) {
                if (a.status === 'pending') return -1;
                if (b.status === 'pending') return 1;
                return (a.status || '').localeCompare(b.status || '');
            }
            return 0;
        });
    }, [cooks]);

    const filteredCooks = sortedCooks.filter(c => 
        (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (c.contactNumber?.includes(searchTerm) || false)
    );

    const handleApprove = async () => {
        if (!selectedCook || !firestore || !storage) return;
        
        const isEdit = selectedCook.status === 'approved';

        if (!kycData.pincode || !kycData.aadhaar || !kycData.address) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Pincode, Aadhaar, and Address are required.' });
            return;
        }

        if (!isEdit && (!files.profilePhoto || !files.aadhaarPhoto || !files.contract)) {
            toast({ variant: 'destructive', title: 'Missing Documents', description: 'Please upload all 3 required documents.' });
            return;
        }

        setIsLoading(true);
        try {
            const uploadedUrls = await uploadPartnerFiles(storage, selectedCook.id, files);

            const cookRef = doc(firestore, 'cooks', selectedCook.id);
            const updatePayload: any = {
                status: 'approved',
                pincode: kycData.pincode,
                aadhaarNumber: kycData.aadhaar,
                address: kycData.address,
                qualification: kycData.qualification,
                experience: parseInt(kycData.experience) || 0,
                rating: parseFloat(kycData.rating) || 5.0,
                gender: kycData.gender,
                ...uploadedUrls
            };

            await updateDoc(cookRef, updatePayload);

            toast({ 
                title: isEdit ? 'Profile Updated' : 'Application Approved', 
                description: `${selectedCook.name}'s profile has been synchronized.` 
            });
            setIsApproveDialogOpen(false);
            setSelectedCook(null);
            setKycData({ pincode: '', aadhaar: '', address: '', qualification: '', experience: '0', rating: '5', gender: '' });
            setFiles({ profilePhoto: null, aadhaarPhoto: null, contract: null });
        } catch (error: any) {
            console.error('Approval/Update failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process request.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCook = async (cookId: string, cookName: string) => {
        if (!firestore) return;
        if (confirm(`Are you sure you want to permanently remove ${cookName}?`)) {
            try {
                await deleteDoc(doc(firestore, 'cooks', cookId));
                toast({ title: 'Cook Removed', variant: 'destructive' });
            } catch (e) {
                toast({ title: 'Error', description: 'Failed to remove partner.', variant: 'destructive' });
            }
        }
    };

    if (isCollectionLoading) return <LoadingState type="processing" message="Syncing culinary professionals..." />;

    if (error) {
        return (
            <Alert variant="destructive" className="rounded-3xl border-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Syncing cooks</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {isLoading && <LoadingState fullPage type="processing" message="Updating partner status..." />}
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                <Search className="w-5 h-5 text-stone-400" />
                <Input 
                    placeholder="Search by name or phone..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-lg font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid gap-4">
                {filteredCooks?.length === 0 ? (
                    <Card className="border-dashed border-2 border-stone-100 py-12 text-center text-stone-400 font-bold bg-transparent">
                        No cook requests found.
                    </Card>
                ) : filteredCooks?.map((cook) => (
                    <Card key={cook.id} className="rounded-3xl border-stone-100 hover:shadow-md transition-all overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl">
                                        <ChefHat className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-stone-900">{cook.name}</h3>
                                            <Badge className={
                                                cook.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                cook.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                'bg-red-100 text-red-700 hover:bg-red-100'
                                            }>
                                                {(cook.status || 'pending').toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm font-bold text-stone-500">
                                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {cook.contactNumber}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {cook.pincode || 'No Pincode'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {cook.status === 'pending' ? (
                                        <Button 
                                            onClick={() => {
                                                setSelectedCook(cook);
                                                setIsApproveDialogOpen(true);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold h-12 px-6"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" /> Approve
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedCook(cook);
                                                setKycData({
                                                    pincode: cook.pincode || '',
                                                    aadhaar: cook.aadhaarNumber || '',
                                                    address: cook.address || '',
                                                    qualification: cook.qualification || '',
                                                    experience: (cook.experience || 0).toString(),
                                                    rating: (cook.rating || 5).toString(),
                                                    gender: cook.gender || ''
                                                });
                                                setIsApproveDialogOpen(true);
                                            }}
                                            className="rounded-2xl border-2 border-stone-100 font-bold h-12 px-6"
                                        >
                                            Edit Profile
                                        </Button>
                                    )}
                                    <Button 
                                        variant="destructive" 
                                        size="icon"
                                        onClick={() => handleRemoveCook(cook.id, cook.name)}
                                        className="rounded-2xl h-12 w-12"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="space-y-3">
                        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-2">
                            <ChefHat className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {selectedCook?.status === 'approved' ? 'Edit Partner Profile' : 'Approve Application'}
                        </DialogTitle>
                        <DialogDescription className="text-stone-500 font-medium text-sm">
                            Complete the physical verification details for {selectedCook?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-stone-50 my-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Pincode</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input 
                                        placeholder="e.g. 110011" 
                                        className="pl-11 h-12 rounded-xl border-2 border-stone-100 font-bold"
                                        value={kycData.pincode}
                                        onChange={(e) => setKycData({...kycData, pincode: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Aadhaar / KYC ID</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input 
                                        placeholder="Enter Aadhaar Number" 
                                        className="pl-11 h-12 rounded-xl border-2 border-stone-100 font-bold"
                                        value={kycData.aadhaar}
                                        onChange={(e) => setKycData({...kycData, aadhaar: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Residential Address</label>
                                <Input 
                                    placeholder="Enter full address" 
                                    className="h-12 rounded-xl border-2 border-stone-100 font-bold px-4"
                                    value={kycData.address}
                                    onChange={(e) => setKycData({...kycData, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Qualification</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input 
                                        placeholder="e.g. Hotel Management" 
                                        className="pl-11 h-12 rounded-xl border-2 border-stone-100 font-bold"
                                        value={kycData.qualification}
                                        onChange={(e) => setKycData({...kycData, qualification: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Gender</label>
                                <div className="flex gap-2">
                                    {['Male', 'Female', 'Other'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setKycData({...kycData, gender: option})}
                                            className={cn(
                                                "flex-1 h-10 rounded-xl border-2 font-bold text-xs transition-all",
                                                kycData.gender === option 
                                                    ? "border-stone-900 bg-stone-900 text-white" 
                                                    : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                                            )}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Years of Experience</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input 
                                        type="number"
                                        placeholder="0" 
                                        className="pl-11 h-12 rounded-xl border-2 border-stone-100 font-bold"
                                        value={kycData.experience}
                                        onChange={(e) => setKycData({...kycData, experience: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initial Rating (1-5)</label>
                                <div className="relative">
                                    <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input 
                                        type="number"
                                        step="0.1"
                                        max="5"
                                        placeholder="5.0" 
                                        className="pl-11 h-12 rounded-xl border-2 border-stone-100 font-bold"
                                        value={kycData.rating}
                                        onChange={(e) => setKycData({...kycData, rating: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <FileLoader label="Profile Photo" onChange={(f) => setFiles({...files, profilePhoto: f})} icon={<Upload className="w-3 h-3" />} />
                                <FileLoader label="Aadhaar Photo" onChange={(f) => setFiles({...files, aadhaarPhoto: f})} icon={<ShieldCheck className="w-3 h-3" />} />
                                <FileLoader label="Signed Contract" onChange={(f) => setFiles({...files, contract: f})} icon={<FileText className="w-3 h-3" />} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0 mt-6">
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} className="rounded-xl h-12 font-bold border-2 border-stone-100 px-8">Cancel</Button>
                        <Button onClick={handleApprove} className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-12 font-black flex-1 shadow-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : (selectedCook?.status === 'approved' ? 'Update Profile' : 'Confirm & Approve')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function FileLoader({ label, onChange, icon }: { label: string, onChange: (f: File | null) => void, icon: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                {icon} {label}
            </label>
            <input type="file" className="text-xs font-bold" onChange={(e) => onChange(e.target.files?.[0] || null)} />
        </div>
    );
}
