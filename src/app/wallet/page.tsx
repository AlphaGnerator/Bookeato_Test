

'use client';
import { AppLayout } from '@/components/app-layout';
import { WalletManager } from './wallet-manager';
import { FirebaseClientProvider } from '@/firebase';

export default function WalletPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="My Wallet">
        <WalletManager />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
