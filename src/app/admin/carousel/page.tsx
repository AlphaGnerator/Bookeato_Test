
'use client';

import { AppLayout } from '@/components/app-layout';
import { CarouselManager } from './carousel-manager';
import { FirebaseClientProvider } from '@/firebase';

export default function AdminCarouselPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Manage Landing Page Carousel">
        <CarouselManager />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
