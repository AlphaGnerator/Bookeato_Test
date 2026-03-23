
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

export function AssignCook({ bookingId, customerId, bookingDate }: { bookingId: string, customerId: string, bookingDate: string }) {
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

  const filteredCooks = useMemo(() => {
    if (!allCooks) return [];
    return allCooks.filter(cook => {
      const nameMatch = nameQuery ? cook.name.toLowerCase().includes(nameQuery.toLowerCase()) : true;
      const pincodeMatch = pincodeQuery ? cook.pincode.startsWith(pincodeQuery) : true;
      return nameMatch && pincodeMatch;
    });
  }, [allCooks, nameQuery, pincodeQuery]);
  
  const handleAssignCook = async (cook: CookProfile) => {
    if (!firestore || !customerId || !bookingId) return;

    try {
        const batch = writeBatch(firestore);

        // Fetch customer data to denormalize
        const customerRef = doc(firestore, 'customers', customerId);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
            throw new Error("Customer profile not found. Cannot assign cook.");
        }
        const customerData = customerSnap.data() as UserProfile;

        // 1. Update the original booking document with cook and denormalized customer data
        const bookingRef = doc(firestore, 'customers', customerId, 'bookings', bookingId);
        batch.update(bookingRef, {
            cookId: cook.id,
            cookName: cook.name,
            status: 'confirmed',
            // Denormalized fields for the cook to access
            customerName: customerData.name,
            customerAddress: customerData.address,
            customerPincode: customerData.pincode,
            customerContact: customerData.contactNumber,
        });

        // 2. Create a new document in the top-level 'assignments' collection
        const assignmentRef = doc(firestore, 'assignments', bookingId);
        batch.set(assignmentRef, {
            id: bookingId,
            cookId: cook.id,
            customerId: customerId,
            bookingDate: bookingDate,
        });

        await batch.commit();

        toast({
            title: 'Cook Assigned!',
            description: `${cook.name} has been assigned to this booking. The status is now "Confirmed".`
        });
    } catch (e: any) {
        console.error("Failed to assign cook:", e);
        toast({
            variant: "destructive",
            title: "Assignment Failed",
            description: e.message || "Could not assign the cook. Please check the console for errors."
        })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign a Cook</CardTitle>
        <CardDescription>
          Find an available and approved cook and assign them to this booking request.
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
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by pincode..."
              value={pincodeQuery}
              onChange={(e) => setPincodeQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        
        {error && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Cooks</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        )}

        {!isLoading && !error && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredCooks.length > 0 ? (
              filteredCooks.map(cook => (
                <div key={cook.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                  <div>
                    <p className="font-semibold">{cook.name}</p>
                    <p className="text-sm text-muted-foreground">Pincode: {cook.pincode} | Rating: {cook.rating}</p>
                  </div>
                  <Button size="sm" onClick={() => handleAssignCook(cook)}>
                    <UserCheck className="mr-2 h-4 w-4" /> Assign
                  </Button>
                </div>
              ))
            ) : (
              <Alert>
                <ChefHat className="h-4 w-4" />
                <AlertTitle>No Cooks Found</AlertTitle>
                <AlertDescription>No approved cooks match your search criteria.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
