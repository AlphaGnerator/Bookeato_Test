'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';
import { FirebaseClientProvider } from '@/firebase';
import Link from 'next/link';

export default function CookLoginPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Cook Login">
        <div className="flex justify-center items-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome Back, Cook!</CardTitle>
              <CardDescription>
                Sign in with your phone number to manage your schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don&apos;t have an account yet?{' '}
                <Link href="/cook/signup" className="text-primary hover:underline">
                  Sign up here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
