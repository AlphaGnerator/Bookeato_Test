'use client';

import React from 'react';
import { ChefHat, Sparkles, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingOverlay({ message = "Fine-tuning your experience..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/40 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="relative">
                {/* Outer pulsing ring */}
                <div className="absolute inset-x-[-20px] inset-y-[-20px] rounded-full bg-orange-500/10 animate-ping duration-1000" />
                
                {/* Rotating icons ring */}
                <div className="relative h-24 w-24 flex items-center justify-center bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white" />
                    <div className="relative animate-bounce-subtle">
                         <ChefHat className="w-10 h-10 text-orange-500" />
                    </div>
                    
                    {/* Orbiting sparkles */}
                    <Sparkles className="absolute top-4 right-4 w-4 h-4 text-amber-400 animate-pulse" />
                    <Sparkles className="absolute bottom-4 left-4 w-3 h-3 text-orange-200 animate-pulse delay-700" />
                </div>
            </div>
            
            <div className="mt-8 text-center space-y-2">
                <h3 className="text-xl font-black text-stone-950 tracking-tight animate-pulse">{message}</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Bookeato Premium Services</p>
            </div>
            
            {/* Progress line */}
            <div className="absolute bottom-0 left-0 h-1 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-progress-indefinite w-full" />
        </div>
    );
}
