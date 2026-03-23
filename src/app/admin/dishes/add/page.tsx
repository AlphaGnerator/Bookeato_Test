
'use client';
import { AppLayout } from '@/components/app-layout';
import { AddDishForm } from './add-dish-form';
import { FirebaseClientProvider } from '@/firebase';

export default function AdminAddDishPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Add New Dish">
        <AddDishForm />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
