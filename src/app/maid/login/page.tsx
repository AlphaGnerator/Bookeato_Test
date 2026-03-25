'use client';

import { MaidLoginForm } from './login-form';
import { Logo } from '@/components/logo';

export default function MaidLoginPage() {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="flex justify-center flex-col items-center gap-4">
                    <Logo />
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Partner Login</h1>
                        <p className="text-stone-500 font-medium text-sm mt-1">Access your service dashboard</p>
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
                    <MaidLoginForm />
                </div>

                <p className="text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                    &copy; 2024 Bookeato Partner Network
                </p>
            </div>
        </div>
    );
}
