
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDoc } from 'firebase/firestore';
import type { CookProfile, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChefHat, Search, UserCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function AssignCook({ 
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
  
  const approvedCooksQuery = useMemoFirebase(() => {
    if (firestore) {
      return query(collection(firestore, 'cooks'), where('status', '==', 'approved'));
    }
    return null;
  }, [firestore]);

  const { data: allCooks, isLoading, error } = useCollection<CookProfile>(approvedCooksQuery);

  // Fetch ALL assignments to check for conflicts
  const assignmentsQuery = useMemoFirebase(() => {
    if (firestore) {
      return query(collection(firestore, 'assignments'), where('bookingDate', '==', bookingDate));
    }
    return null;
  }, [firestore, bookingDate]);
  const { data: dayAssignments } = useCollection<any>(assignmentsQuery);

  const filteredCooks = useMemo(() => {
    if (!allCooks) return [];
    return allCooks.filter(cook => {
      const nameMatch = nameQuery ? cook.name.toLowerCase().includes(nameQuery.toLowerCase()) : true;
      const pincodeMatch = pincodeQuery ? cook.pincode.startsWith(pincodeQuery) : true;
      return nameMatch && pincodeMatch;
    });
  }, [allCooks, nameQuery, pincodeQuery]);

  const getCookStatus = (cookId: string) => {
    if (!dayAssignments || !bookingTime) return null;
    const conflict = dayAssignments.find(a => a.cookId === cookId && a.bookingTime === bookingTime);
    return conflict ? 'busy' : 'available';
  };
  
  const handleAssignCook = async (cook: CookProfile) => {
    if (!firestore || !customerId || !bookingId) return;

    if (getCookStatus(cook.id) === 'busy') {
        if (!confirm(`${cook.name} is already assigned to another session at ${bookingTime}. Assign anyway?`)) {
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
            throw new Error("Data not found. Cannot assign cook.");
        }
        
        const customerData = customerSnap.data() as UserProfile;
        const bookingData = bookingSnap.data() as any;

        // 1. Update the original booking document
        const bookingRef = doc(firestore, 'customers', customerId, 'bookings', bookingId);
        batch.update(bookingRef, {
            cookId: cook.id,
            cookName: cook.name,
            partnerPhotoUrl: cook.profilePhotoUrl || '',
            partnerRating: cook.rating || 4.5,
            status: 'confirmed',
            customerName: customerData.name || '',
            customerAddress: customerData.address || '',
            customerPincode: customerData.pincode || '',
            customerContact: customerData.contactNumber || '',
        });

        // 2. Create a new document in the top-level 'assignments' collection
        const assignmentRef = doc(firestore, 'assignments', bookingId);
        batch.set(assignmentRef, {
            id: bookingId,
            cookId: cook.id,
            cookName: cook.name,
            customerId: customerId,
            customerName: customerData.name || '',
            customerContact: customerData.contactNumber || '',
            customerAddress: customerData.address || '',
            bookingDate: bookingDate,
            bookingTime: bookingTime || '',
            type: 'cook',
            status: 'pending',
            items: bookingData.items || [],
            createdAt: new Date().toISOString()
        });

        await batch.commit();

        toast({
            title: 'Cook Assigned!',
            description: `${cook.name} has been assigned to this booking.`
        });
    } catch (e: any) {
        console.error("Failed to assign cook:", e);
        toast({
            variant: "destructive",
            title: "Assignment Failed",
            description: e.message || "Could not assign the cook."
        })
    }
  }

  return (
    <Card className="border-none shadow-none bg-stone-50/50 rounded-[2rem]">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Assign a Chef Partner
        </CardTitle>
        <CardDescription className="font-medium">
          Select an approved chef. Slot: <span className="text-stone-900 font-bold">{bookingTime || 'N/A'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-stone-200 bg-white"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by pincode..."
              value={pincodeQuery}
              onChange={(e) => setPincodeQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-stone-200 bg-white"
            />
          </div>
        </div>

        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        )}
        
        {error && (
             <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Cooks</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        )}

        {!isLoading && !error && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {filteredCooks.length > 0 ? (
              filteredCooks.map(cook => {
                const status = getCookStatus(cook.id);
                const isBusy = status === 'busy';

                return (
                  <div key={cook.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all group ${isBusy ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-stone-100 hover:border-stone-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors text-sm ${isBusy ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-900 group-hover:text-white'}`}>
                          {cook.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 flex items-center gap-2">
                            {cook.name}
                            {isBusy && <Badge variant="outline" className="text-[9px] h-4 bg-orange-100 border-orange-200 text-orange-700 font-black uppercase tracking-tighter">Day Conflict</Badge>}
                        </p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Pincode: {cook.pincode} | Exp: {cook.experience} yrs</p>
                      </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => handleAssignCook(cook)}
                        className={`font-bold rounded-xl h-10 px-4 ${isBusy ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-stone-900 hover:bg-stone-800 text-white'}`}
                    >
                      {isBusy ? <AlertTriangle className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                      {isBusy ? 'Assign Conflict' : 'Assign'}
                    </Button>
                  </div>
                );
              })
            ) : (
              <Alert className="rounded-xl border-dashed border-2 bg-transparent text-stone-500">
                <ChefHat className="h-4 w-4" />
                <AlertTitle className="font-bold">No Cooks Found</AlertTitle>
                <AlertDescription className="font-medium text-xs">No approved cooks match your search criteria.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
