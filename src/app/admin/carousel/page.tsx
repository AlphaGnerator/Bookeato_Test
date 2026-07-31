
'use client';

import { AppLayout } from '@/components/app-layout';
import { CarouselManager } from './carousel-manager';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminCarouselPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Manage Landing Page Carousel">
          <CarouselManager />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
