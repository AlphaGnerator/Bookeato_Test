import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpForm } from './signup-form';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <AppLayout pageTitle="Create Your Account">
      <div className="flex justify-center items-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Join to start booking culinary experiences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
            <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Log in
                </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
