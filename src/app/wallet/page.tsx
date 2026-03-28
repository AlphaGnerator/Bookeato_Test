

'use client';
import { AppLayout } from '@/components/app-layout';
import { WalletManager } from './wallet-manager';
import { FirebaseClientProvider } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const router = useRouter();

  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="My Wallet">
        <div className="max-w-md mx-auto space-y-6 pb-20">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 pt-4 px-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.back()}
                    className="rounded-full bg-stone-100 h-10 w-10 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Wallet</h1>
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Manage your credits</p>
                </div>
            </div>
            <WalletManager />
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
