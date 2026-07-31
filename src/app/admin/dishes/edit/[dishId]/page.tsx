
'use client';
import { AppLayout } from '@/components/app-layout';
import { EditDishForm } from './edit-dish-form';
import { FirebaseClientProvider } from '@/firebase';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEditDishPage({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId } = use(params);
  const router = useRouter();

  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Edit Dish">
        <div className="space-y-6">
          <Button variant="outline" onClick={() => router.push('/admin/dishes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dish Playbook
          </Button>
          <EditDishForm dishId={dishId} />
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
