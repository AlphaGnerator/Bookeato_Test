
'use client';
import { AppLayout } from '@/components/app-layout';
import { CookRequestList } from './cook-request-list';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminCookRequestsPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Cook Approval Requests">
          <CookRequestList />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
