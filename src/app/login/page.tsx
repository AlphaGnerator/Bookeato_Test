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
              <p className="text-center text-sm text-muted-foreground mt-6">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-primary hover:underline">
                      Sign up
                  </Link>
              </p>
               <p className="text-center text-sm text-muted-foreground mt-4">
                  Are you a cook?{' '}
                  <Link href="/cook/login" className="text-accent-foreground hover:underline">
                      Go to Cook Portal
                  </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
