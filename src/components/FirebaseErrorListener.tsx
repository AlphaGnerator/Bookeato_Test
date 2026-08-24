'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const loggedPaths = new Set<string>();
    const handleError = (err: FirestorePermissionError) => {
      const path = err?.options?.path || 'unknown';
      if (!loggedPaths.has(path)) {
        loggedPaths.add(path);
        console.debug("Firestore Notice:", path);
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
