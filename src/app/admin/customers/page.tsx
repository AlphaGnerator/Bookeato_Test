'use client';
import { AppLayout } from '@/components/app-layout';
import { CustomerList } from './customer-list';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

function AdminCustomersContent() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // This is the critical check. We only render the list if the user is authenticated.
  // In a real app, we'd check for an admin custom claim. For now, any logged-in user is admin.
  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You must be logged in as an admin to view this page. Please
          return to the admin login page.
        </AlertDescription>
      </Alert>
    );
  }

  // If the user is authenticated, we render the component that fetches data.
  return <CustomerList />;
}


export default function AdminCustomersPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Customer Data">
        <AdminCustomersContent />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
