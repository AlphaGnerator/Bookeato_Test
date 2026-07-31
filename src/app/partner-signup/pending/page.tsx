'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hourglass } from 'lucide-react';
import Link from 'next/link';

export default function GenericPendingPage() {
  return (
      <AppLayout pageTitle="Application Submitted">
        <div className="flex justify-center items-center h-full pt-12">
          <Card className="w-full max-w-lg text-center shadow-xl border-2">
            <CardHeader>
              <div className="mx-auto bg-stone-100 p-6 rounded-full w-fit">
                <Hourglass className="h-12 w-12 text-stone-900 animate-pulse" />
              </div>
              <CardTitle className="mt-6 text-2xl font-black">Application Pending</CardTitle>
              <CardDescription className="text-base mt-2 font-medium">
                Thank you for signing up! Your profile is currently under review by our admin team. You will be notified once your account has been approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg">
                    <Link href="/">Return to Homepage</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
  );
}
