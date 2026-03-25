'use client';

import React, { useState } from 'react';
import { MaidSmartEstimator } from '@/components/maid-smart-estimator';
import { MaidCheckoutDetails } from '@/components/maid-checkout-details';
import { MaidCheckoutSchedule } from '@/components/maid-checkout-schedule';
import { useRouter } from 'next/navigation';
import { useCulinaryStore } from '@/hooks/use-culinary-store';

export default function MaidBookingWizard() {
  const router = useRouter();
  const { user, isInitialized } = useCulinaryStore();
  const [step, setStep] = useState(1);

  const handleEstimatorNext = () => {
    // If user is logged in and has all required details, skip to step 3 (Schedule)
    const hasProfileDetails = (user.contactNumber || user.email) && user.pincode && user.address;
    if (isInitialized && user.id !== 'guest' && hasProfileDetails) {
      setStep(3); 
    } else {
      setStep(2); // Go to Details for guests or incomplete profiles
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 lg:px-6">
        {step === 1 && (
          <MaidSmartEstimator onNext={handleEstimatorNext} onBack={() => router.back()} />
        )}
        {step === 2 && (
          <MaidCheckoutDetails onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <MaidCheckoutSchedule onBack={() => setStep(2)} />
        )}
      </div>
    </div>
  );
}
