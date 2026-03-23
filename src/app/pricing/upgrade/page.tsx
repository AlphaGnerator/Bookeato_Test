
'use client';
import { AppLayout } from '@/components/app-layout';
import { UpgradePlan } from './upgrade-plan';
import { FirebaseClientProvider } from '@/firebase';

export default function UpgradePlanPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Upgrade Your Plan">
        <UpgradePlan />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
