
'use client';
import { AppLayout } from '@/components/app-layout';
import { CookRequestList } from './cook-request-list';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

function AdminCooksContent() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You must be logged in as an admin to view this page.
        </AlertDescription>
      </Alert>
    );
  }

  return <CookRequestList />;
}


export default function AdminCookRequestsPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Cook Approval Requests">
        <AdminCooksContent />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
