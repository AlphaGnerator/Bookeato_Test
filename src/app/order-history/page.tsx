
'use client';
import { AppLayout } from '@/components/app-layout';
import { OrderHistory } from './order-history';
import { FirebaseClientProvider } from '@/firebase';

export default function OrderHistoryPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Order History">
        <OrderHistory />
      </AppLayout>
    </FirebaseClientProvider>
  );
}

    