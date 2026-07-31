'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLoginForm } from './admin-login-form';
import { FirebaseClientProvider } from '@/firebase';

export default function AdminLoginPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Admin Login">
        <div className="flex justify-center items-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                Enter your credentials to access the portals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminLoginForm />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
