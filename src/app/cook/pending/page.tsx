'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hourglass } from 'lucide-react';
import Link from 'next/link';

export default function CookPendingPage() {
  return (
      <AppLayout pageTitle="Application Submitted">
        <div className="flex justify-center items-center h-full">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Hourglass className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="mt-4">Application Pending</CardTitle>
              <CardDescription className="text-base">
                Thank you for signing up! Your profile is currently under review by our admin team. You will be notified once your account has been approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/">Return to Homepage</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
  );
}
