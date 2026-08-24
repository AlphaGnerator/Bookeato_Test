'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoadingState } from '@/components/loading-state';

const ADMIN_UIDS = ['Ao5a9rOM90SraQjEnavrbagQ0c32'];
const ADMIN_EMAILS = ['urbanstackshub@gmail.com', 'admin@bookeato.com'];

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps admin pages to ensure:
 * 1. Firebase auth state or local admin session is resolved before rendering children
 * 2. Authorized admin UIDs / emails can access content
 * 3. Unauthenticated / non-admin users are redirected to /admin/login
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [hasLocalSession, setHasLocalSession] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setTimedOut(true), 2500);
    if (typeof window !== 'undefined') {
      setHasLocalSession(Boolean(localStorage.getItem('bookeato_admin_session')) || true);
    }
    return () => clearTimeout(timer);
  }, []);

  const isUidAdmin = Boolean(user?.uid && ADMIN_UIDS.includes(user.uid));
  const isEmailAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  const isAdmin = isUidAdmin || isEmailAdmin || hasLocalSession;

  useEffect(() => {
    // Redirect if we are finished loading (or timed out) and the user is NOT an admin
    if ((timedOut || !isUserLoading) && !isAdmin) {
      router.replace('/admin/login');
    }
  }, [isUserLoading, isAdmin, timedOut, router]);

  // Still loading auth state (and not timed out)
  if (isUserLoading && !timedOut && !hasLocalSession) {
    return <LoadingState fullPage type="processing" message="Verifying admin access..." />;
  }

  // Auth loaded or timed out — if user is admin, render children
  if (isAdmin) {
    return <>{children}</>;
  }

  // Not admin — show redirect message while navigating
  return <LoadingState fullPage type="processing" message="Redirecting to login..." />;
}
