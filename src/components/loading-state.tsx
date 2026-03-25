'use client';

import React from 'react';
import { ChefHat, Sparkles, Loader2, Heart, Utensils, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  type?: 'cook' | 'maid' | 'generic' | 'processing';
  fullPage?: boolean;
}

export function LoadingState({ 
  message = "Just a moment...", 
  type = 'generic', 
  fullPage = false 
}: LoadingStateProps) {
  
  const icons = {
    cook: <ChefHat className="w-12 h-12 text-orange-500 animate-bounce" />,
    maid: <Sparkles className="w-12 h-12 text-green-500 animate-pulse" />,
    generic: <Heart className="w-12 h-12 text-rose-400 animate-pulse" />,
    processing: <Loader2 className="w-12 h-12 text-stone-900 animate-spin" />
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-6 p-12 transition-all animate-in fade-in zoom-in duration-500",
    fullPage ? "fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] h-screen w-screen" : "w-full"
  );

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer Glow effect */}
        <div className={cn(
          "absolute inset-0 blur-2xl opacity-20 rounded-full animate-pulse",
          type === 'cook' ? "bg-orange-400" : type === 'maid' ? "bg-green-400" : "bg-primary"
        )}></div>
        
        {/* Icon Container */}
        <div className="relative bg-white shadow-2xl rounded-3xl p-6 border border-stone-100 flex items-center justify-center">
          {icons[type]}
        </div>
        
        {/* Floating particles (Decorative) */}
        <div className="absolute -top-4 -right-4 w-4 h-4 bg-yellow-400 rounded-full animate-ping delay-75"></div>
        <div className="absolute -bottom-2 -left-3 w-3 h-3 bg-blue-300 rounded-full animate-bounce delay-300"></div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-stone-900 tracking-tight">
          {type === 'processing' ? 'Processing Action' : 'Preparing Magic'}
        </h3>
        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
            {message}
        </p>
      </div>

      {/* Progress Track (Decorative) */}
      <div className="w-32 h-1 bg-stone-100 rounded-full overflow-hidden">
        <div className={cn(
            "h-full rounded-full animate-progress-indefinite",
            type === 'cook' ? "bg-orange-500" : type === 'maid' ? "bg-green-500" : "bg-stone-900"
        )}></div>
      </div>

      <style jsx global>{`
        @keyframes progress-indefinite {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 40%; }
          100% { width: 0%; transform: translateX(300%); }
        }
        .animate-progress-indefinite {
          animation: progress-indefinite 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
