import { PartnerSignUpForm } from './signup-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PartnerSignUpPage() {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg mb-8">
                <Link 
                    href="/"
                    className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-900 transition-colors uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>
            
            <PartnerSignUpForm />

            <div className="mt-12 text-center max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">
                    Secure & Verified Platform
                </p>
                <p className="text-stone-400 text-sm mt-2 font-medium">
                    By joining, you agree to Bookeato's Terms of Service and Professional Guidelines.
                </p>
            </div>
        </div>
    );
}
