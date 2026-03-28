'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Search, Filter, ShieldCheck, MapPin, User, ArrowRight, UserCheck, AlertTriangle, Sparkles, Phone, Calendar, Shield, Upload, FileText, Star, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { LoadingState } from "@/components/loading-state";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import type { MaidProfile } from '@/lib/types';
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

export function MaidRequestList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaid, setSelectedMaid] = useState<MaidProfile | null>(null);
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
    const { storage } = useFirebase();

    const maidsCollectionRef = useMemoFirebase(() => {
        if (firestore) {
            return collection(firestore, 'maids');
        }
        return null;
    }, [firestore]);

    const { data: maids, isLoading: isCollectionLoading, error } = useCollection<MaidProfile>(maidsCollectionRef);

    const sortedMaids = useMemo(() => {
        if (!maids) return [];
        return [...maids].sort((a, b) => {
            // Primary sort by status (e.g. pending first)
            if (a.status !== b.status) {
                if (a.status === 'pending') return -1;
                if (b.status === 'pending') return 1;
                return (a.status || '').localeCompare(b.status || '');
            }
            // Secondary sort by joinedDate desc
            const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
            const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
            return dateB - dateA;
        });
    }, [maids]);

    const filteredMaids = sortedMaids.filter(m => 
        (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        m.contactNumber?.includes(searchTerm)
    );

    const handleApprove = async () => {
        if (!selectedMaid || !firestore || !storage) return;
        
        const isEdit = selectedMaid.status === 'approved';

        if (!kycData.pincode || !kycData.aadhaar || !kycData.address) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Pincode, Aadhaar, and Address are required.' });
            return;
        }

        // For new approvals, files are mandatory
        if (!isEdit && (!files.profilePhoto || !files.aadhaarPhoto || !files.contract)) {
            toast({ variant: 'destructive', title: 'Missing Documents', description: 'Please upload all 3 required documents.' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Upload files if provided
            const uploadedUrls = await uploadPartnerFiles(storage, selectedMaid.id, files);

            // 2. Update Firestore
            const maidRef = doc(firestore, 'maids', selectedMaid.id);
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

            await updateDoc(maidRef, updatePayload);

            toast({ 
                title: isEdit ? 'Profile Updated' : 'Application Approved', 
                description: `${selectedMaid.name}'s profile has been synchronized.` 
            });
            setIsApproveDialogOpen(false);
            setSelectedMaid(null);
            setKycData({ pincode: '', aadhaar: '', address: '', qualification: '', experience: '0', rating: '5', gender: '' });
            setFiles({ profilePhoto: null, aadhaarPhoto: null, contract: null });
        } catch (error: any) {
            console.error('Approval/Update failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process request.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCollectionLoading) return <LoadingState type="processing" message="Syncing partner applications..." />;

    if (error) {
        return (
            <Alert variant="destructive" className="rounded-3xl border-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Syncing Applications</AlertTitle>
                <AlertDescription>
                    {error.message}
                    <p className="mt-2 text-xs font-mono opacity-70">Query: maids collection</p>
                </AlertDescription>
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
                {filteredMaids?.length === 0 ? (
                    <Card className="border-dashed border-2 border-stone-100 py-12 text-center text-stone-400 font-bold bg-transparent">
                        No maid requests found.
                    </Card>
                ) : filteredMaids?.map((maid) => (
                    <Card key={maid.id} className="rounded-3xl border-stone-100 hover:shadow-md transition-all overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 shrink-0 font-black text-xl">
                                        {maid.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-stone-900">{maid.name}</h3>
                                            <Badge className={
                                                maid.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                maid.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                'bg-red-100 text-red-700 hover:bg-red-100'
                                            }>
                                                {(maid.status || 'pending').toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm font-bold text-stone-500">
                                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {maid.contactNumber}</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {format(new Date(maid.joinedDate || ''), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {maid.status === 'pending' ? (
                                        <Button 
                                            onClick={() => {
                                                setSelectedMaid(maid);
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
                                                setSelectedMaid(maid);
                                                setKycData({
                                                    pincode: maid.pincode || '',
                                                    aadhaar: maid.aadhaarNumber || '',
                                                    address: maid.address || '',
                                                    qualification: maid.qualification || '',
                                                    experience: (maid.experience || 0).toString(),
                                                    rating: (maid.rating || 5).toString(),
                                                    gender: maid.gender || ''
                                                });
                                                setIsApproveDialogOpen(true);
                                            }}
                                            className="rounded-2xl border-2 border-stone-100 font-bold h-12 px-6"
                                        >
                                            Edit Profile
                                        </Button>
                                    )}
                                    <Button variant="outline" className="rounded-2xl border-2 border-stone-100 font-bold h-12 px-6">
                                        Details <ArrowRight className="w-4 h-4 ml-2" />
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
                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-2">
                            <Shield className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {selectedMaid?.status === 'approved' ? 'Edit Partner Profile' : 'Approve Application'}
                        </DialogTitle>
                        <DialogDescription className="text-stone-500 font-medium text-sm">
                            Complete the physical verification details for {selectedMaid?.name}. All documents must be clearly visible.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-stone-50 my-2">
                        {/* Column 1: Personal & KYC */}
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
                                        placeholder="e.g. 10th Pass" 
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

                        {/* Column 2: Professional & Ratings */}
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
                            
                            {/* File Uploads */}
                            <div className="space-y-3 pt-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                        <Upload className="w-3 h-3" /> Profile Photo (Public)
                                    </label>
                                    <input type="file" className="text-xs font-bold" onChange={(e) => setFiles({...files, profilePhoto: e.target.files?.[0] || null})} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> Aadhaar Photo
                                    </label>
                                    <input type="file" className="text-xs font-bold" onChange={(e) => setFiles({...files, aadhaarPhoto: e.target.files?.[0] || null})} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Signed Contract (PDF)
                                    </label>
                                    <input type="file" className="text-xs font-bold" onChange={(e) => setFiles({...files, contract: e.target.files?.[0] || null})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsApproveDialogOpen(false)}
                            className="rounded-xl h-12 font-bold border-2 border-stone-100 px-8"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleApprove}
                            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-12 font-black flex-1 shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : (selectedMaid?.status === 'approved' ? 'Update Profile' : 'Confirm & Approve')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

