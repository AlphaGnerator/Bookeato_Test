
'use client';
import { AppLayout } from '@/components/app-layout';
import { EditDishForm } from './edit-dish-form';
import { FirebaseClientProvider } from '@/firebase';
import { use } from 'react';

export default function AdminEditDishPage({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId } = use(params);

  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Edit Dish">
        <EditDishForm dishId={dishId} />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
