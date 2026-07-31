
'use client';
import { AppLayout } from '@/components/app-layout';
import { MenuSelector } from './menu-selector';
import { FirebaseClientProvider } from '@/firebase';
import { useEffect, useState, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function MenuPageContent() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // Render a skeleton or loading state on the server and initial client render
        return (
             <div className="bg-background min-h-screen p-8">
                <Skeleton className="h-24 w-full mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }
    
    return <MenuSelector />;
}

export default function BookingMenuPage() {
  return (
    <FirebaseClientProvider>
        {/* We don't use AppLayout here to have a full-screen experience */}
        <div className="bg-background min-h-screen">
            <Suspense fallback={<Skeleton className="h-screen w-full" />}>
                <MenuPageContent />
            </Suspense>
        </div>
    </FirebaseClientProvider>
  );
}
