
'use client';
import { AppLayout } from '@/components/app-layout';
import { PincodeAvailabilityManager } from './availability-manager';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export const dynamic = 'force-dynamic';

export default function AdminAvailabilityPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Pincode Slot Availability">
          <PincodeAvailabilityManager />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
