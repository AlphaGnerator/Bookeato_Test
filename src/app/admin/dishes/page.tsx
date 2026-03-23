
'use client';
import { AppLayout } from '@/components/app-layout';
import { DishList } from './dish-list';
import { FirebaseClientProvider } from '@/firebase';

export default function AdminDishesPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Dish Playbook">
        <DishList />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
