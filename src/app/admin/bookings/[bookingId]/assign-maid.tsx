'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDoc } from 'firebase/firestore';
import type { MaidProfile, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Search, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function AssignMaid({ 
    bookingId, 
    customerId, 
    bookingDate, 
    bookingTime 
}: { 
    bookingId: string, 
    customerId: string, 
    bookingDate: string,
    bookingTime?: string 
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [nameQuery, setNameQuery] = useState('');
  const [pincodeQuery, setPincodeQuery] = useState('');
  
  const approvedMaidsQuery = useMemoFirebase(() => {
    if (firestore) {
      return query(collection(firestore, 'maids'), where('status', '==', 'approved'));
    }
    return null;
  }, [firestore]);

  const { data: allMaids, isLoading, error } = useCollection<MaidProfile>(approvedMaidsQuery);

  // Fetch ALL assignments to check for conflicts
  const assignmentsQuery = useMemoFirebase(() => {
    if (firestore) {
      return query(collection(firestore, 'assignments'), where('bookingDate', '==', bookingDate));
    }
    return null;
  }, [firestore, bookingDate]);
  const { data: dayAssignments } = useCollection<any>(assignmentsQuery);

  const filteredMaids = useMemo(() => {
    if (!allMaids) return [];
    return allMaids.filter(maid => {
      const nameMatch = nameQuery ? maid.name.toLowerCase().includes(nameQuery.toLowerCase()) : true;
      const pincodeMatch = pincodeQuery ? maid.pincode?.startsWith(pincodeQuery) : true;
      return nameMatch && pincodeMatch;
    });
  }, [allMaids, nameQuery, pincodeQuery]);

  const getMaidStatus = (maidId: string) => {
    if (!dayAssignments || !bookingTime) return null;
    const conflict = dayAssignments.find(a => a.maidId === maidId && a.bookingTime === bookingTime);
    return conflict ? 'busy' : 'available';
  };
  
  const handleAssignMaid = async (maid: MaidProfile) => {
    if (!firestore || !customerId || !bookingId) return;

    if (getMaidStatus(maid.id) === 'busy') {
        if (!confirm(`${maid.name} is already assigned to another task at ${bookingTime}. Assign anyway?`)) {
            return;
        }
    }

    try {
        const batch = writeBatch(firestore);

        // Fetch customer data and booking data to denormalize
        const [customerSnap, bookingSnap] = await Promise.all([
            getDoc(doc(firestore, 'customers', customerId)),
            getDoc(doc(firestore, 'customers', customerId, 'bookings', bookingId))
        ]);

        if (!customerSnap.exists() || !bookingSnap.exists()) {
            throw new Error("Data not found. Cannot assign maid.");
        }
        
        const customerData = customerSnap.data() as UserProfile;
        const bookingData = bookingSnap.data() as any;

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // 1. Update the original booking document
        const bookingRef = doc(firestore, 'customers', customerId, 'bookings', bookingId);
        batch.update(bookingRef, {
            maidId: maid.id,
            maidName: maid.name,
            partnerPhotoUrl: maid.profilePhotoUrl || '',
            partnerRating: maid.rating || 4.5,
            status: 'confirmed',
            otp: otp,
            customerName: customerData.name || '',
            customerAddress: customerData.address || '',
            customerPincode: customerData.pincode || '',
            customerContact: customerData.contactNumber || '',
        });

        // 2. Create a new document in the top-level 'assignments' collection
        const assignmentRef = doc(firestore, 'assignments', bookingId);
        batch.set(assignmentRef, {
            id: bookingId,
            maidId: maid.id,
            maidName: maid.name,
            customerId: customerId,
            customerName: customerData.name || '',
            customerContact: customerData.contactNumber || '',
            customerAddress: customerData.address || '',
            bookingDate: bookingDate,
            bookingTime: bookingTime || '',
            type: 'maid',
            otp: otp,
            status: 'pending',
            items: bookingData.items || [],
            createdAt: new Date().toISOString()
        });

        await batch.commit();

        toast({
            title: 'Maid Assigned!',
            description: `${maid.name} has been assigned. OTP: ${otp}`
        });
    } catch (e: any) {
        console.error("Failed to assign maid:", e);
        toast({
            variant: "destructive",
            title: "Assignment Failed",
            description: e.message || "Could not assign the maid."
        })
    }
  }

  return (
    <Card className="border-none shadow-none bg-stone-50/50 rounded-[2rem]">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-500" strokeWidth={2.5} />
            Assign a Maid Partner
        </CardTitle>
        <CardDescription className="font-medium">
          Select an approved maid. Currently showing slot: <span className="text-stone-900 font-bold">{bookingTime || 'N/A'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Filter by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-stone-200 bg-white"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Filter by pincode..."
              value={pincodeQuery}
              onChange={(e) => setPincodeQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-stone-200 bg-white"
            />
          </div>
        </div>

        {isLoading && (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
        )}
        
        {error && (
             <Alert variant="destructive" className="rounded-2xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Maids</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        )}

        {!isLoading && !error && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {filteredMaids.length > 0 ? (
              filteredMaids.map(maid => {
                const status = getMaidStatus(maid.id);
                const isBusy = status === 'busy';

                return (
                  <div key={maid.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all group ${isBusy ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-stone-100 hover:border-stone-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors text-sm ${isBusy ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-900 group-hover:text-white'}`}>
                          {maid.name.charAt(0)}
                      </div>
                      <div>
                          <p className="font-bold text-stone-900 flex items-center gap-2">
                             {maid.name}
                             {isBusy && <Badge variant="outline" className="text-[9px] h-4 bg-orange-100 border-orange-200 text-orange-700 font-black uppercase tracking-tighter">Already Booked</Badge>}
                          </p>
                          <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Pincode: {maid.pincode || 'N/A'}</p>
                      </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => handleAssignMaid(maid)} 
                        className={`font-bold rounded-xl h-10 px-4 ${isBusy ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-stone-900 hover:bg-stone-800 text-white'}`}
                    >
                      {isBusy ? <AlertTriangle className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                      {isBusy ? 'Assign Match' : 'Assign'}
                    </Button>
                  </div>
                );
              })
            ) : (
              <Alert className="rounded-2xl border-dashed border-2 bg-transparent text-stone-500">
                <Sparkles className="h-4 w-4" />
                <AlertTitle className="font-bold">No Maids Found</AlertTitle>
                <AlertDescription className="font-medium text-xs">No approved maids match your search criteria.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
