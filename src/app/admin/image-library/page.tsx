'use client';

import { AppLayout } from '@/components/app-layout';
import { ImageLibraryManager } from './image-library-manager';
import { FirebaseClientProvider } from '@/firebase';

export default function AdminImageLibraryPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Image Library">
        <ImageLibraryManager />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
