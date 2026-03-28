
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
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
import { Users, AlertTriangle } from 'lucide-react';

export function CustomerList() {
  const firestore = useFirestore();
  
  // This query is now only created when this component is rendered,
  // which only happens after the parent page confirms the user is authenticated.
  const customersCollectionRef = useMemoFirebase(() => {
    if (firestore) {
      return collection(firestore, 'customers');
    }
    return null;
  }, [firestore]);

  const { data: customers, isLoading, error } = useCollection<UserProfile>(customersCollectionRef);

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          A list of all registered customers and their daily calorie targets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Data</AlertTitle>
                <AlertDescription>
                    Could not retrieve customer list. This may be due to a network issue or security rule permissions.
                    <p className="mt-2 text-xs font-mono bg-destructive-foreground/20 p-2 rounded">
                        {error.message}
                    </p>
                </AlertDescription>
            </Alert>
        )}

        {!isLoading && !error && (
          customers && customers.length > 0 ? (
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Daily Calorie Target</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => (
                    <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name || 'Anonymous'}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell className="text-right">{(customer.calorieTarget || 0).toLocaleString()} kcal</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Customers Found</AlertTitle>
                <AlertDescription>
                    There are no customer profiles in the database yet.
                </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
    </Card>
  );
}
