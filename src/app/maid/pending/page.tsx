'use client';

import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider } from '@/firebase';
import { Clock, ShieldCheck, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MaidPendingPage() {
    return (
        <FirebaseClientProvider>
            <AppLayout pageTitle="Application Status">
                <div className="py-12 md:py-20 px-4">
                    <div className="max-w-md mx-auto text-center space-y-8">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 animate-pulse">
                            <Clock className="w-12 h-12 text-amber-500" />
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-3xl font-black tracking-tight text-stone-900">Application Under Review</h1>
                            <p className="text-stone-500 font-medium leading-relaxed px-4">
                                Great job! Your basic profile is submitted. Our verification team will reach out to you within 24 hours to collect your KYC documents.
                            </p>
                        </div>
                        
                        <div className="grid gap-4 mt-8">
                            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-stone-100 text-left shadow-sm">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-900 leading-tight">Identity Verification</h3>
                                    <p className="text-xs text-stone-400 font-medium">Keep your Aadhaar card ready for our call.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-stone-100 text-left shadow-sm">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <PhoneCall className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-900 leading-tight">Verification Call</h3>
                                    <p className="text-xs text-stone-400 font-medium">We will call you from a verified Bookeato number.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button asChild className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold">
                                <Link href="/">Back to Home</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </FirebaseClientProvider>
    );
}
