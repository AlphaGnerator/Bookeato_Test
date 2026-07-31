
'use client';
import { AppLayout } from '@/components/app-layout';
import { BookingSummary } from './booking-summary';
import { FirebaseClientProvider } from '@/firebase';
import { use } from 'react';

export const dynamic = 'force-dynamic';

export default function BookingSummaryPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Booking Summary">
        <div className="space-y-6">
          <BookingSummary date={date} />
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
