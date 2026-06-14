'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';
import Link from 'next/link';
import { FirebaseClientProvider } from '@/firebase';

export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Customer Login">
        <div className="flex justify-center items-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Customer Portal</CardTitle>
              <CardDescription>
                Sign in to book sessions and manage your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
