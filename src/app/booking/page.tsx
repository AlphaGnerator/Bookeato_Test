'use client';
import { AppLayout } from '@/components/app-layout';
import { BookingStepper } from './booking-stepper';
import { FirebaseClientProvider } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function BookingStepperContent() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <BookingStepper />
    </div>
  );
}

export default function BookingPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Create Your Meal Plan">
        <div className="bg-hero-alt-bg -m-8 p-8 min-h-[calc(100vh-64px)]">
          <BookingStepperContent />
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
