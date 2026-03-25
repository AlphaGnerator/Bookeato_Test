'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoadingState } from '@/components/loading-state';

const ADMIN_UID = 'Ao5a9rOM90SraQjEnavrbagQ0c32';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps admin pages to ensure:
 * 1. Firebase auth state is resolved before rendering children
 * 2. Only the specific admin UID can access the content
 * 3. Unauthenticated / non-admin users are redirected to /admin/login
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  // Add a hard timeout so we never get stuck loading forever
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    // Redirect if we are finished loading (or timed out) and the user is NOT an admin
    if ((timedOut || !isUserLoading) && !isAdmin) {
      router.replace('/admin/login');
    }
  }, [isUserLoading, isAdmin, timedOut, router]);

  // Still loading auth state (and not timed out)
  if (isUserLoading && !timedOut) {
    return <LoadingState fullPage type="processing" message="Verifying admin access..." />;
  }

  // Auth loaded or timed out — if user is admin, render children
  if (isAdmin) {
    return <>{children}</>;
  }

  // Not admin — show redirect message while navigating
  return <LoadingState fullPage type="processing" message="Redirecting to login..." />;
}
