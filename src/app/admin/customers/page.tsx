'use client';
import { AppLayout } from '@/components/app-layout';
import { CustomerList } from './customer-list';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminCustomersPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Customer Data">
          <CustomerList />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
