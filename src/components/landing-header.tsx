'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, LogOut, User as UserIcon, Activity } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

const getNavLinks = (firebaseUser: any) => [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Foods' },
  { href: '/cooks', label: 'Cooks' },
  { href: firebaseUser ? '/dashboard' : '/login', label: firebaseUser ? 'Dashboard' : 'My Bookings' },
];

export function LandingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user: firebaseUser, isUserLoading } = useUser();
  const { user: appUser, isInitialized } = useCulinaryStore();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/');
  };

  const isLoading = isUserLoading || !isInitialized;

  const getAvatarName = () => {
    if (appUser?.name) return appUser.name.charAt(0).toUpperCase();
    if (firebaseUser?.displayName) return firebaseUser.displayName.charAt(0).toUpperCase();
    return 'G';
  };

  const getDisplayName = () => {
    return appUser?.name || firebaseUser?.displayName || 'User';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b md:border-none">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {getNavLinks(firebaseUser).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium text-text-muted transition-colors hover:text-text-primary',
                pathname === link.href && 'text-text-primary font-bold'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : firebaseUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${firebaseUser.uid}/40/40`} alt={getDisplayName()} />
                    <AvatarFallback>{getAvatarName()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{firebaseUser.email || 'Welcome!'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <Activity className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="secondaryCta" size="secondaryCta">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="cta" size="secondaryCta">
                <Link href="/signup">Register</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="p-6 flex flex-col h-full">
                <Logo />
                <nav className="mt-8 flex flex-col gap-6">
                  {getNavLinks(firebaseUser).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'text-lg font-medium text-text-muted transition-colors hover:text-text-primary',
                        pathname === link.href && 'text-text-primary font-bold'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t pt-6">
                   {isLoading ? (
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ) : firebaseUser ? (
                        <div className="flex flex-col gap-4">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://picsum.photos/seed/${firebaseUser.uid}/40/40`} alt={getDisplayName()} />
                                    <AvatarFallback>{getAvatarName()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{getDisplayName()}</p>
                                    <p className="text-xs text-muted-foreground">{firebaseUser.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="justify-start mt-2">
                                <Link href="/dashboard">
                                  <Activity className="mr-2 h-4 w-4" />
                                  Dashboard
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleLogout} className="justify-start">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Button asChild variant="secondaryCta" size="cta">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild variant="cta" size="cta">
                                <Link href="/signup">Register</Link>
                            </Button>
                        </div>
                    )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}