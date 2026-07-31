
'use client';
import { AppLayout } from '@/components/app-layout';
import { AvailabilityManager } from './availability-manager';
import { FirebaseClientProvider } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function AvailabilityContent() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <AvailabilityManager />
    </div>
  );
}


export default function CookAvailabilityPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Manage Availability">
        <AvailabilityContent />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
