
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm group transition-opacity hover:opacity-90">
        <div className={cn('flex items-center gap-3 text-white', className)}>
            
            {/* "Upleveled" Pure Scalable SVG Translation of the new concentric mark */}
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" className="w-full h-full">
                    {/* Head - Concentric Circles */}
                    <circle cx="50" cy="28" r="3" fill="currentColor" stroke="none" />
                    <circle cx="50" cy="28" r="9" />
                    <circle cx="50" cy="28" r="17" />
                    <circle cx="50" cy="28" r="25" />
                    
                    {/* Body - Concentric Arches */}
                    <path d="M 46 95 v -4 a 4 4 0 0 1 8 0 v 4" />
                    <path d="M 35 95 v -4 a 15 15 0 0 1 30 0 v 4" />
                    <path d="M 24 95 v -4 a 26 26 0 0 1 52 0 v 4" />
                    <path d="M 13 95 v -4 a 37 37 0 0 1 74 0 v 4" />
                </svg>
            </div>

            {/* Wordmark */}
            <h1 className="font-headline text-2xl md:text-[28px] font-black uppercase drop-shadow-sm leading-none" style={{ letterSpacing: '0.12em' }}>
                BOOKEATO
            </h1>
            
        </div>
    </Link>
  );
}
