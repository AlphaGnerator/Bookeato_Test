'use client';
import { AppLayout } from '@/components/app-layout';
import { SlotSelector } from './slot-selector';
import { FirebaseClientProvider } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SlotSelectorContent() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/booking')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Plan Selection
      </Button>
      <SlotSelector />
    </div>
  );
}


export default function BookingSlotsPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Select Your Time & Dish">
        <SlotSelectorContent />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
