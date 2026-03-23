'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpForm } from './signup-form';
import { FirebaseClientProvider } from '@/firebase';

export default function CookSignUpPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Cook Account Creation">
        <div className="flex justify-center items-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Become a Cook</CardTitle>
              <CardDescription>
                Create your profile to start offering your culinary skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
