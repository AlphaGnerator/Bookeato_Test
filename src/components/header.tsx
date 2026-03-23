'use client';
import Link from 'next/link';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Skeleton } from './ui/skeleton';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { LogIn, LogOut, UserPlus, ChefHat, User, Soup } from 'lucide-react';
import { Separator } from './ui/separator';

export function Header({ title }: { title: string }) {
  const { user: appUser, isInitialized: isAppInitialized } = useCulinaryStore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/');
  };

  const isInitialized = isAppInitialized && !isUserLoading;
  const isCook = pathname.startsWith('/cook');

  const getAvatarName = () => {
      if (firebaseUser?.isAnonymous) return 'D';
      if (appUser.name) return appUser.name.charAt(0).toUpperCase();
      if (firebaseUser?.displayName) return firebaseUser.displayName.charAt(0).toUpperCase();
      return 'G';
  }
  
  const getDisplayName = () => {
      if (firebaseUser?.isAnonymous) return firebaseUser.uid.startsWith('demo-cook') ? 'Demo Cook' : 'Demo Customer';
      if(isCook && firebaseUser?.email) {
          return "Cook";
      }
      return appUser.name || firebaseUser?.displayName || 'User';
  }

  const getProfileLink = () => {
      return isCook ? '/cook/profile' : '/profile';
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-surface px-4 text-text-primary md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold font-headline">{title}</h1>
      </div>
       {isInitialized ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-black/10 focus-visible:ring-black touch-manipulation active:scale-90">
              <Avatar className="h-9 w-9">
                 <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${firebaseUser?.uid || 'guest'}/40/40`} alt={getDisplayName()} />
                <AvatarFallback>{getAvatarName()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {firebaseUser ? (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {firebaseUser.isAnonymous ? "Demo Session" : (appUser.email || firebaseUser.email || firebaseUser.phoneNumber)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="h-11">
                    <Link href={getProfileLink()}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                 {!isCook && (
                    <>
                        <DropdownMenuItem asChild className="h-11">
                            <Link href="/cooks">
                                <Soup className="mr-2 h-4 w-4" />
                                <span>Find a Cook</span>
                            </Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild className="h-11">
                            <Link href="/order-history">Order History</Link>
                        </DropdownMenuItem>
                    </>
                 )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="h-11 text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Get Started</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="h-11">
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Customer Login</span>
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild className="h-11">
                        <Link href="/signup">
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Customer Signup</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="h-11">
                        <Link href="/cook/login">
                            <ChefHat className="mr-2 h-4 w-4" />
                            <span>Cook Portal</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            
          </DropdownMenuContent>
        </DropdownMenu>
       ) : (
         <Skeleton className="h-9 w-9 rounded-full" />
       )}
    </header>
  );
}
