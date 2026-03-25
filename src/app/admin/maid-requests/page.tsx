'use client';

import { AppLayout } from '@/components/app-layout';
import { MaidRequestList } from './maid-request-list';
import { FirebaseClientProvider } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function MaidRequestsPage() {
    return (
        <FirebaseClientProvider>
            <AdminAuthGuard>
                <AppLayout pageTitle="Maid Applications">
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter text-stone-900">Maid Network</h1>
                                <p className="text-stone-500 font-medium">Verify and approve professional partners for the platform.</p>
                            </div>
                            <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-100 text-xs font-black py-1.5 px-4 rounded-full border-none">
                                System Automated
                            </Badge>
                        </div>

                        <MaidRequestList />
                    </div>
                </AppLayout>
            </AdminAuthGuard>
        </FirebaseClientProvider>
    );
}
