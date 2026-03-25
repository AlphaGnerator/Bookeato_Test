'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, where, writeBatch } from 'firebase/firestore';
import type { CookProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, AlertTriangle, ChefHat, Check, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function CookRequestList() {
  const firestore = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');


  const cooksCollectionRef = useMemoFirebase(() => {
    if (firestore && firebaseUser && !isUserLoading) {
        return collection(firestore, 'cooks');
    }
    return null;
  }, [firestore, firebaseUser, isUserLoading]);

  const { data: allCooks, isLoading: isAllLoading, error: allError } = useCollection<CookProfile>(cooksCollectionRef);

  const pendingCooks = useMemo(() => {
    if (!allCooks) return [];
    return allCooks.filter(cook => cook.status === 'pending');
  }, [allCooks]);

  const filteredCooks = useMemo(() => {
    if (!allCooks) return [];
    if (statusFilter === 'all') return allCooks;
    return allCooks.filter(cook => cook.status === statusFilter);
  }, [allCooks, statusFilter]);


  const handleUpdateRequest = (cookId: string, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !cookId) return;

    const cookDocRef = doc(firestore, 'cooks', cookId);
    updateDocumentNonBlocking(cookDocRef, { status: newStatus });

    toast({
      title: `Request ${newStatus}`,
      description: `The cook's status has been updated.`,
    });
  };
  
  const handleRemoveCook = (cookId: string, cookName: string) => {
    if (!firestore || !cookId) return;

    if (confirm(`Are you sure you want to permanently remove ${cookName}? This action cannot be undone.`)) {
        deleteDocumentNonBlocking(doc(firestore, 'cooks', cookId));
        toast({
            title: 'Cook Removed',
            description: `${cookName} has been removed from the platform.`,
            variant: 'destructive',
        });
    }
  }

  const isLoading = isUserLoading || isAllLoading;
  const error = allError;

  if (isUserLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }
  
  if (!firebaseUser) {
    return (
      <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
              You must be logged in as an admin to view this page.
          </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pending Applications</CardTitle>
                <CardDescription>
                Review and approve or reject new cooks who have signed up.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isAllLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                )}
                
                {allError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Fetching Pending Requests</AlertTitle>
                        <AlertDescription>{allError.message}</AlertDescription>
                    </Alert>
                )}

                {!isAllLoading && !allError && (
                pendingCooks && pendingCooks.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Number</TableHead>
                            <TableHead>Pincode</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingCooks.map((cook) => (
                            <TableRow key={cook.id}>
                                <TableCell className="font-medium">{cook.name}</TableCell>
                                <TableCell>{cook.contactNumber}</TableCell>
                                <TableCell>{cook.pincode}</TableCell>
                                <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleUpdateRequest(cook.id, 'approved')}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateRequest(cook.id, 'rejected')}>
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Alert>
                        <ChefHat className="h-4 w-4" />
                        <AlertTitle>No Pending Requests</AlertTitle>
                        <AlertDescription>
                            There are no new cook applications to review at this time.
                        </AlertDescription>
                    </Alert>
                )
                )}
            </CardContent>
        </Card>

        <Separator />
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Full Registry</CardTitle>
                <CardDescription>A complete list of all cooks on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-2 mb-4">
                    <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
                    <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
                    <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
                    <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
                </div>
                {isAllLoading && (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
                {allError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Fetching Cook List</AlertTitle>
                        <AlertDescription>{allError.message}</AlertDescription>
                    </Alert>
                )}
                {!isAllLoading && !allError && (
                    filteredCooks && filteredCooks.length > 0 ? (
                         <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Pincode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCooks.map(cook => (
                                        <TableRow key={cook.id}>
                                            <TableCell className="font-medium">{cook.name}</TableCell>
                                            <TableCell>{cook.contactNumber}</TableCell>
                                            <TableCell>{cook.pincode}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    cook.status === 'approved' ? 'default' :
                                                    cook.status === 'rejected' ? 'destructive' :
                                                    'secondary'
                                                }>
                                                    {cook.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {cook.status !== 'approved' && (
                                                    <Button variant="outline" size="xs" onClick={() => handleUpdateRequest(cook.id, 'approved')}>
                                                        <Check className="mr-1 h-3 w-3" /> Approve
                                                    </Button>
                                                )}
                                                {cook.status !== 'rejected' && (
                                                    <Button variant="outline" size="xs" onClick={() => handleUpdateRequest(cook.id, 'rejected')}>
                                                        <X className="mr-1 h-3 w-3" /> Reject
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="xs" onClick={() => handleRemoveCook(cook.id, cook.name)}>
                                                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    ) : (
                        <Alert>
                            <Users className="h-4 w-4" />
                            <AlertTitle>No Cooks Found</AlertTitle>
                            <AlertDescription>There are no cooks that match the current filter.</AlertDescription>
                        </Alert>
                    )
                )}
            </CardContent>
        </Card>
    </div>
  );
}
