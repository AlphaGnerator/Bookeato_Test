'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CookProfileForm } from './profile-form';
import { FirebaseClientProvider } from '@/firebase';

export default function CookProfilePage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="My Cook Profile">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Manage Your Profile</CardTitle>
            <CardDescription>
              Keep your information up to date for customers to see.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CookProfileForm />
          </CardContent>
        </Card>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
