
'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Dish } from '@/lib/types';
import { AddDishForm } from '../../add/add-dish-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function EditDishForm({ dishId }: { dishId: string }) {
  const firestore = useFirestore();
  const dishRef = useMemoFirebase(() => {
    if (firestore && dishId) {
      return doc(firestore, 'dishes', dishId);
    }
    return null;
  }, [firestore, dishId]);

  const { data: dish, isLoading, error } = useDoc<Dish>(dishRef);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dish</AlertTitle>
        <AlertDescription>
          There was a problem loading the dish details.
          <p className="mt-2 text-xs font-mono bg-destructive-foreground/20 p-2 rounded">{error.message}</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dish) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dish Not Found</AlertTitle>
        <AlertDescription>The dish you are trying to edit does not exist.</AlertDescription>
      </Alert>
    );
  }

  return <AddDishForm dish={dish} />;
}
