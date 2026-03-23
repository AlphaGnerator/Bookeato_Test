
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
        <div className={cn('flex items-center gap-3 text-foreground', className)}>
        <Image 
          src="/bookeato-logo-genz-flame.png" 
          alt="Bookeato GenZ Logo" 
          width={38} 
          height={38} 
          className="rounded-lg shadow-sm border border-stone-100 object-cover" 
        />
        <h1 className="font-headline text-3xl font-black tracking-tight text-green-600">
            Bookeato
        </h1>
        </div>
    </Link>
  );
}
