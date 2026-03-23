
'use client';
import { AppLayout } from '@/components/app-layout';
import { PincodeAvailabilityManager } from './availability-manager';
import { FirebaseClientProvider } from '@/firebase';

export const dynamic = 'force-dynamic';

export default function AdminAvailabilityPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Pincode Slot Availability">
        <PincodeAvailabilityManager />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
