'use client';
import Link from 'next/link';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Skeleton } from './ui/skeleton';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { LogIn, LogOut, UserPlus, ChefHat, User, Soup, BookOpen, Flame, MapPin, ChevronRight, ChevronLeft, Timer, Home } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export function Header({ title }: { title: string }) {
  const { user: appUser, isInitialized: isAppInitialized, updateUserProfile } = useCulinaryStore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [addressInput, setAddressInput] = useState('');
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const currentAddress = appUser.address || "My Home Vihanga, Nanakramguda";

  useEffect(() => {
    setAddressInput(currentAddress);
  }, [currentAddress]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/');
  };

  const isInitialized = isAppInitialized && !isUserLoading;
  const isCook = pathname.startsWith('/cook');
  const isAdmin = pathname.startsWith('/admin');
  const isSeller = pathname.startsWith('/seller');
  const [sellerSession, setSellerSession] = useState<{ shopName?: string; email?: string } | null>(null);

  useEffect(() => {
    try {
      const savedSeller = localStorage.getItem('bookeato_active_seller');
      if (savedSeller) {
        setSellerSession(JSON.parse(savedSeller));
      }
    } catch (e) {
      console.error("Error loading seller session in header", e);
    }
  }, [pathname]);

  const handleSellerLogout = () => {
    localStorage.removeItem('bookeato_active_seller');
    router.push('/seller-signup');
  };

  const getAvatarName = () => {
      if (isSeller) return 'S';
      if (firebaseUser?.isAnonymous) return 'D';
      if (appUser.name) return appUser.name.charAt(0).toUpperCase();
      if (firebaseUser?.displayName) return firebaseUser.displayName.charAt(0).toUpperCase();
      return 'G';
  }
  
  const getDisplayName = () => {
      if (isSeller) return sellerSession?.shopName || 'Swadeshi Organic Farm';
      if (firebaseUser?.isAnonymous) return firebaseUser.uid.startsWith('demo-cook') ? 'Demo Cook' : 'Demo Customer';
      if(isCook && firebaseUser?.email) {
          return "Cook";
      }
      return appUser.name || firebaseUser?.displayName || 'User';
  }

  const getProfileLink = () => {
      return isCook ? '/cook/profile' : isSeller ? '/seller-dashboard?tab=profile' : '/profile';
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-stone-950 text-white border-b border-stone-800/80 shadow-md">
      {/* Primary Top Bar */}
      <div className="flex h-14 md:h-16 items-center justify-between px-3.5 sm:px-5 md:px-6 w-full max-w-full">
        {/* Left: Title & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger className="flex text-stone-300 hover:text-white" />
          
          {/* 🌟 UNIVERSAL BACK BUTTON ON EVERY PAGE 🌟 */}
          {pathname !== '/' && (
            <button
              type="button"
              onClick={() => {
                if (pathname.startsWith('/admin/') && pathname !== '/admin') {
                  router.push('/admin');
                } else if (pathname.startsWith('/seller-dashboard')) {
                  router.push('/');
                } else {
                  router.back();
                }
              }}
              className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-orange-400 hover:text-orange-300 px-2.5 py-1 rounded-xl text-xs font-black transition-all border border-stone-700 active:scale-95 shadow-xs shrink-0"
              title="Go back to previous page"
            >
              <ChevronLeft className="w-4 h-4 text-orange-400" />
              <span>Back</span>
            </button>
          )}

          <h1 className="text-sm sm:text-base font-black font-headline tracking-tight text-white whitespace-nowrap truncate">
            {title}
          </h1>
        </div>

        {/* Desktop & Mobile Header Controls */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Desktop Address Selector */}
          {!isCook && !isAdmin && !isSeller && isInitialized && (
            <div className="hidden sm:block">
              <Popover open={isAddressOpen} onOpenChange={setIsAddressOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-left px-3 py-1.5 rounded-xl border border-stone-800 transition-all max-w-[260px] active:scale-95 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0 leading-none">
                      <span className="text-[8px] font-black uppercase tracking-wider text-stone-400">Delivering to</span>
                      <span className="text-xs font-bold text-stone-100 truncate mt-0.5">{currentAddress}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl border-stone-800 bg-stone-900 text-white shadow-2xl p-4 z-50" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs text-white">Update Delivery Address</h4>
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">⚡ 35 mins delivery</span>
                    </div>
                    <div className="space-y-2">
                      <Input 
                        value={addressInput} 
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Enter full address or society"
                        className="rounded-xl border-stone-700 bg-stone-800 font-semibold text-xs h-9 text-white placeholder:text-stone-500 focus-visible:ring-amber-400"
                      />
                      <Button 
                        className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs h-9"
                        onClick={() => {
                          updateUserProfile({ address: addressInput });
                          setIsAddressOpen(false);
                        }}
                      >
                        Save Address
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* User Profile Avatar Dropdown (Shifted left comfortably from screen edge) */}
          {isInitialized ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-stone-800 focus-visible:ring-amber-400 touch-manipulation active:scale-95 shrink-0 mr-1 sm:mr-0">
                  <Avatar className="h-9 w-9 border-2 border-amber-400 shadow-md">
                    <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${firebaseUser?.uid || 'guest'}/40/40`} alt={getDisplayName()} />
                    <AvatarFallback className="bg-amber-400 text-stone-950 font-black text-xs">{getAvatarName()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl z-50" align="end" forceMount>
                {isSeller ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{getDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {sellerSession?.email || 'seller@bookeato.com'} • Verified Seller
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="h-10 cursor-pointer">
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4 text-amber-400" />
                        <span>Home (Landing Page)</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="h-10 cursor-pointer">
                      <Link href="/seller-dashboard?tab=orders">
                        <User className="mr-2 h-4 w-4 text-emerald-400" />
                        <span>Seller Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSellerLogout} className="h-10 text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : firebaseUser ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{getDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {firebaseUser.isAnonymous ? "Demo Session" : (appUser.email || firebaseUser.email || firebaseUser.phoneNumber)}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="h-10 cursor-pointer">
                      <Link href={getProfileLink()}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {!isCook && !isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="h-10 cursor-pointer">
                          <Link href="/cooks">
                            <Soup className="mr-2 h-4 w-4" />
                            <span>Find a Cook</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-10 cursor-pointer">
                          <Link href="/order-history">
                            <BookOpen className="mr-2 h-4 w-4" />
                            <span>Order History</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="h-10 cursor-pointer">
                          <Link href="/admin/bookings">
                            <BookOpen className="mr-2 h-4 w-4" />
                            <span>Bookings Hub</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-10 cursor-pointer">
                          <Link href="/admin/dishes">
                            <Flame className="mr-2 h-4 w-4" />
                            <span>Manage Dishes</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="h-10 text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>Get Started</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="h-10 cursor-pointer">
                        <Link href="/login">
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>Customer Login</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="h-10 cursor-pointer">
                        <Link href="/signup">
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Customer Signup</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="h-10 cursor-pointer">
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
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          )}
        </div>
      </div>

      {/* Mobile Sub-Header: Delivery Address Pill & Delivery Speed */}
      {!isCook && !isAdmin && isInitialized && (
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-stone-900/90 border-t border-stone-800/70 sm:hidden">
          <Popover open={isAddressOpen} onOpenChange={setIsAddressOpen}>
            <PopoverTrigger asChild>
              <button 
                type="button" 
                className="flex items-center gap-1.5 text-left bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800 min-w-0 max-w-[240px] active:scale-95 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[7px] font-black uppercase tracking-wider text-stone-400">Delivering to</span>
                  <span className="text-[10px] font-bold text-stone-100 truncate mt-0.5">{currentAddress}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 rounded-2xl border-stone-800 bg-stone-900 text-white shadow-2xl p-4 z-50" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-white">Update Delivery Address</h4>
                  <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">⚡ 35 mins delivery</span>
                </div>
                <div className="space-y-2">
                  <Input 
                    value={addressInput} 
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter full address or society"
                    className="rounded-xl border-stone-700 bg-stone-800 font-semibold text-xs h-9 text-white placeholder:text-stone-500 focus-visible:ring-amber-400"
                  />
                  <Button 
                    className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs h-9"
                    onClick={() => {
                      updateUserProfile({ address: addressInput });
                      setIsAddressOpen(false);
                    }}
                  >
                    Save Address
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 px-2 py-1 rounded-xl">
            <Timer className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">⚡ 35 MINS</span>
          </div>
        </div>
      )}
    </header>
  );
}
