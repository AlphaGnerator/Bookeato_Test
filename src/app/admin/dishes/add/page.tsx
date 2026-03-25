
'use client';
import { AppLayout } from '@/components/app-layout';
import { AddDishForm } from './add-dish-form';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AdminAddDishPage() {
  const router = useRouter();

  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Add New Dish">
          <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/admin/dishes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dish Playbook
            </Button>
            <AddDishForm />
          </div>
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
