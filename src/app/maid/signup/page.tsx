'use client';

import { AppLayout } from '@/components/app-layout';
import { MaidSignUpForm } from './signup-form';
import { FirebaseClientProvider } from '@/firebase';
import { Sparkles } from 'lucide-react';

export default function MaidSignUpPage() {
    return (
        <FirebaseClientProvider>
            <AppLayout pageTitle="Professional Onboarding">
                <div className="py-12 md:py-20 px-4">
                    <div className="max-w-md mx-auto space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-black uppercase tracking-widest mb-4 border border-green-100">
                                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Join the Network
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-stone-900 mb-2">Bookeato for Professionals</h1>
                            <p className="text-stone-500 font-medium">Earn more with India's most premium home service platform.</p>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-stone-100">
                            <MaidSignUpForm />
                        </div>
                        
                        <div className="text-center pt-8">
                            <p className="text-sm text-stone-400 font-medium italic">
                                "Bookeato has transformed how I work. The UI is so simple, I never miss a task!" 
                                <br />
                                <span className="text-stone-900 font-bold not-italic mt-2 block">— Sunita, Partner since 2024</span>
                            </p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </FirebaseClientProvider>
    );
}
