
'use client';
import { AppLayout } from '@/components/app-layout';
import { PlanDetailsView } from './plan-details-view';
import { FirebaseClientProvider } from '@/firebase';

export default function PlanDetailsPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Plan Details">
        <PlanDetailsView />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
