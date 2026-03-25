'use client';

import { AppLayout } from '@/components/app-layout';
import { ImageLibraryManager } from './image-library-manager';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminImageLibraryPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Image Library">
          <ImageLibraryManager />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
