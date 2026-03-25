
'use client';

import { AppLayout } from '@/components/app-layout';
import { DishList } from './dish-list';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminDishesPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Dish Playbook">
          <DishList />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
