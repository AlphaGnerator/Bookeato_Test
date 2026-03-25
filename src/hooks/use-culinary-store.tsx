'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { CookingSlot, UserProfile, Booking, Dish, DraftBooking, DraftBookingItem, Transaction, Subscription } from '@/lib/types';
import { defaultUser } from '@/lib/mock-data';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, getDocs, writeBatch, updateDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { addDays, format, isSameDay, isFuture, isPast, parseISO } from 'date-fns';

interface CulinaryStore {
  user: UserProfile;
  slots: CookingSlot[];
  bookings: Booking[];
  draftBookings: DraftBooking[];
  dishes: Dish[];
  isInitialized: boolean;
  guestConfig: { pincode: string; familySize: number; address?: string; city?: string; state?: string } | null;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  rechargeWallet: (amount: number) => void;
  deductFromWallet: (amount: number) => void;
  checkBalance: (requiredAmount: number) => boolean;
  canPurchasePlan: (planToBuy: { planId: 'weekly' | 'monthly'; tier: number }) => { allowed: boolean; reason: string };
  purchaseSubscription: (planDetails: { type: 'weekly' | 'monthly'; cost: number; configuration: { people: string; meals: string; diet: string; timeSlot: string; dinnerTimeSlot?: string | null; }; startDate: Date }) => Promise<void>;
  upgradeSubscription: (details: { newPlanType: 'monthly'; netAmount: number; fullMonthlyCost: number }) => Promise<void>;
  cancelCurrentPlan: () => Promise<void>;
  requestPlanModification: () => Promise<void>;
  removeDishes: (dishIds: string[]) => void;
  refreshDishes: () => Promise<void>;
  addOrUpdateDraftBooking: (draft: DraftBooking) => void;
  removeDraftBooking: (bookingDate: string) => void;
  getDraftBookingForSlot: (bookingDate: string) => DraftBooking | undefined;
  submitAllDraftBookings: (totalCost?: number) => Promise<void>;
  clearDraftsAndSubmitCurationRequest: (bookingDate: string) => Promise<void>;
  cancelSlot: (bookingId: string) => void;
  setGuestConfig: (config: { pincode: string; familySize: number; address?: string; city?: string; state?: string } | null) => void;
  executeUnifiedCheckout: (planDetails: any, requiredRecharge: number) => Promise<void>;
}

const CulinaryStoreContext = createContext<CulinaryStore | undefined>(undefined);

const DRAFT_BOOKINGS_STORAGE_KEY = 'culinary-canvas-draft-bookings';
const GUEST_CONFIG_STORAGE_KEY = 'culinary-canvas-guest-config';


const PLAN_TIERS = {
    daily: 1,
    weekly: 2,
    monthly: 3
};

export const CulinaryStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
      return doc(firestore, 'customers', firebaseUser.uid);
    }
    return null;
  }, [firestore, firebaseUser]);

   const userBookingsRef = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
        return collection(firestore, 'customers', firebaseUser.uid, 'bookings');
    }
    return null;
  }, [firestore, firebaseUser]);

  const dishesQueryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'dishes')) : null, [firestore]);
  const { data: dishesData, isLoading: areDishesLoading } = useCollection<Dish>(dishesQueryRef);
  const dishes = dishesData || [];

  const { data: userProfileFromDb, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: bookingsData, isLoading: areBookingsLoading } = useCollection<Booking>(userBookingsRef);
  const bookings = bookingsData || [];

  
  const [slots, setSlots] = useState<CookingSlot[]>([]);
  const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);
  const [guestConfig, setGuestConfigState] = useState<{ pincode: string; familySize: number; address?: string; city?: string; state?: string } | null>(null);


  const [user, setUser] = useState<UserProfile>(defaultUser);

  // Load draft bookings and guest config from localStorage on initial mount
  useEffect(() => {
    try {
      const storedDrafts = localStorage.getItem(DRAFT_BOOKINGS_STORAGE_KEY);
      if (storedDrafts) {
        setDraftBookings(JSON.parse(storedDrafts));
      }
      const storedGuestConfig = localStorage.getItem(GUEST_CONFIG_STORAGE_KEY);
      if (storedGuestConfig) {
        setGuestConfigState(JSON.parse(storedGuestConfig));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const loading = isUserLoading || isProfileLoading;
    if (!loading) {
      if (userProfileFromDb) {
        // HARD STOP LOGIC: Check for expired plan on load
        const sub = userProfileFromDb.subscription;
        if (sub && sub.status === 'active' && sub.expiryDate && isPast(parseISO(sub.expiryDate))) {
            const expiredSub: Subscription = { ...sub, status: 'expired' };
            const expiredProfile = { ...userProfileFromDb, subscription: expiredSub };
            setUser(expiredProfile);
            // Persist the change to Firestore
            if(userProfileRef) {
                setDocumentNonBlocking(userProfileRef, { subscription: expiredSub }, { merge: true });
            }
        } else {
            setUser(userProfileFromDb);
        }
      } else if (!firebaseUser) {
        setUser(defaultUser);
      } else if (firebaseUser && !userProfileFromDb) {
          setUser({
              ...defaultUser,
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'New User',
          })
      }
    }
  }, [userProfileFromDb, isUserLoading, isProfileLoading, firebaseUser, userProfileRef]);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    setUser(currentUser => ({ ...currentUser, ...profile }));
    if (userProfileRef) {
      setDocumentNonBlocking(userProfileRef, profile, { merge: true });
    }
  }, [userProfileRef]);

  const rechargeWallet = useCallback((amount: number) => {
    const newBalance = (user.walletBalance || 0) + amount;
    updateUserProfile({ walletBalance: newBalance });
  }, [user.walletBalance, updateUserProfile]);

  const deductFromWallet = useCallback((amount: number) => {
    const newBalance = (user.walletBalance || 0) - amount;
    updateUserProfile({ walletBalance: newBalance });
  }, [user.walletBalance, updateUserProfile]);

  const checkBalance = useCallback((requiredAmount: number) => {
    return (user.walletBalance || 0) - requiredAmount >= -100;
  }, [user.walletBalance]);
  
  const canPurchasePlan = useCallback((planToBuy: { planId: 'weekly' | 'monthly', tier: number }): { allowed: boolean, reason: string } => {
    const currentSub = user.subscription;

    // If user has no plan, or it's expired/cancelled, they can always buy.
    if (!currentSub || ['none', 'expired', 'cancelled'].includes(currentSub.status)) {
        return { allowed: true, reason: 'User has no active plan.' };
    }
    
    // If user has an active or upcoming plan
    const currentTier = currentSub.tier || PLAN_TIERS.daily;
    
    // Allow upgrades
    if (planToBuy.tier > currentTier) {
        return { allowed: true, reason: 'Upgrade allowed.' };
    }

    // Block downgrades
    if (planToBuy.tier < currentTier) {
        return { allowed: false, reason: 'You cannot downgrade to a lower-tier plan while your current plan is active.' };
    }
    
    // Block repurchasing the same active plan. renewals are handled by buying a new plan which will be queued.
    if (planToBuy.tier === currentTier) {
        return { allowed: false, reason: 'You already have this plan active. It will renew automatically if enabled, or you can repurchase after it expires.' };
    }

    // Default to allowing, purchase logic will handle sequencing.
    return { allowed: true, reason: 'Purchase is allowed, sequence will be determined.' };

}, [user.subscription]);


  const purchaseSubscription = useCallback(async (planDetails: { type: 'weekly' | 'monthly'; cost: number; configuration: { people: string; meals: string; diet: string; timeSlot: string; dinnerTimeSlot?: string | null; }; startDate: Date }) => {
    if (!firestore || !firebaseUser) {
        throw new Error("User not authenticated");
    }
    
    if (!checkBalance(planDetails.cost)) {
        throw new Error("Insufficient balance");
    }

    const batch = writeBatch(firestore);

    // 1. Determine the correct start date based on current subscription
    const currentSub = user.subscription;
    let finalStartDate = planDetails.startDate;
    let newStatus: Subscription['status'] = 'active';

    if (currentSub && (currentSub.status === 'active' || currentSub.status === 'upcoming') && currentSub.expiryDate) {
        // This is a RENEWAL or SEQUENTIAL purchase
        const currentExpiry = parseISO(currentSub.expiryDate);
        finalStartDate = addDays(currentExpiry, 1);
        newStatus = 'upcoming'; // All renewals are queued as 'upcoming'
    } else {
        // This is a NEW purchase (no active plan)
        if (isFuture(planDetails.startDate)) {
            newStatus = 'upcoming';
        }
    }


    // 2. Update user profile with new subscription object
    const profileRef = doc(firestore, 'customers', firebaseUser.uid);
    const newBalance = (user.walletBalance || 0) - planDetails.cost;
    const planDuration = planDetails.type === 'weekly' ? 7 : 30;
    const expiryDate = addDays(finalStartDate, planDuration);
    
    const newSubscription: Subscription = {
        status: newStatus,
        planId: planDetails.type,
        tier: PLAN_TIERS[planDetails.type],
        cost: planDetails.cost,
        startDate: finalStartDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        config: planDetails.configuration,
        totalVisits: planDetails.type === 'weekly' ? 7 : 30,
        usedVisits: 0,
    };
    
    batch.update(profileRef, {
        walletBalance: newBalance,
        subscription: newSubscription
    });

    // 3. Log transaction
    const transactionRef = doc(collection(firestore, 'customers', firebaseUser.uid, 'transactions'));
    const newTransaction: Omit<Transaction, 'id'> = {
        type: 'subscription_purchase',
        amount: planDetails.cost,
        date: serverTimestamp(),
        details: {
            planType: planDetails.type,
            description: `${planDetails.type.charAt(0).toUpperCase() + planDetails.type.slice(1)} Plan Purchase`
        }
    };
    batch.set(transactionRef, newTransaction);

    await batch.commit();
    
    // 4. Optimistically update local user state
    setUser(prevUser => ({
        ...prevUser,
        walletBalance: newBalance,
        subscription: newSubscription
    }));


  }, [firestore, firebaseUser, user.walletBalance, user.subscription, checkBalance]);

  const upgradeSubscription = useCallback(async (details: { newPlanType: 'monthly', netAmount: number, fullMonthlyCost: number }) => {
    if (!firestore || !firebaseUser || !user.subscription?.config) {
        throw new Error("User not authenticated or missing plan configuration.");
    }
    if (!checkBalance(details.netAmount)) {
        throw new Error("Insufficient balance for upgrade.");
    }

    const batch = writeBatch(firestore);

    // 1. Update User Profile with new subscription object
    const profileRef = doc(firestore, 'customers', firebaseUser.uid);
    const newBalance = (user.walletBalance || 0) - details.netAmount;
    
    const today = new Date();
    const tomorrow = addDays(new Date(today.setHours(0, 0, 0, 0)), 1);
    const expiryDate = addDays(tomorrow, 30);

    const upgradedSubscription: Subscription = {
        status: 'active',
        planId: details.newPlanType,
        tier: PLAN_TIERS[details.newPlanType],
        cost: details.fullMonthlyCost,
        startDate: tomorrow.toISOString(),
        expiryDate: expiryDate.toISOString(),
        config: user.subscription.config, // Carry over config from old plan
        totalVisits: 30, // Upgrade to monthly
        usedVisits: user.subscription.usedVisits || 0, // Preserve used visits
    };
    
    batch.update(profileRef, {
        walletBalance: newBalance,
        subscription: upgradedSubscription
    });


    // 2. Log Transaction
    const transactionRef = doc(collection(firestore, 'customers', firebaseUser.uid, 'transactions'));
    const newTransaction: Omit<Transaction, 'id'> = {
        type: 'plan_upgrade',
        amount: details.netAmount,
        date: serverTimestamp(),
        details: {
            planType: details.newPlanType,
            description: `Upgrade to ${details.newPlanType} plan (Credit Applied)`
        }
    };
    batch.set(transactionRef, newTransaction);

    await batch.commit();

    // Optimistically update local state
    setUser(prevUser => ({
        ...prevUser,
        walletBalance: newBalance,
        subscription: upgradedSubscription,
    }));

  }, [firestore, firebaseUser, user.walletBalance, user.subscription, checkBalance]);

  const cancelCurrentPlan = useCallback(async () => {
    if (!firestore || !firebaseUser || !user.subscription || !user.subscription.startDate) {
        throw new Error("Cannot cancel plan: missing data.");
    }
    
    const currentSub = user.subscription;
    const startDate = new Date(currentSub.startDate);
    const isRefundable = isFuture(startDate); // Only refund if plan hasn't started
    const refundAmount = currentSub.cost;

    const batch = writeBatch(firestore);
    const profileRef = doc(firestore, 'customers', firebaseUser.uid);
    
    const newSubState: Partial<Subscription> = { ...currentSub, status: 'cancelled' };
    const updates: Partial<UserProfile> = { subscription: newSubState as Subscription };
    let newBalance = user.walletBalance || 0;

    if (isRefundable && refundAmount > 0) {
        newBalance += refundAmount;
        updates.walletBalance = newBalance;

        // Log refund transaction
        const transactionRef = doc(collection(firestore, 'customers', firebaseUser.uid, 'transactions'));
        const refundTransaction: Omit<Transaction, 'id'> = {
            type: 'refund',
            amount: refundAmount,
            date: serverTimestamp(),
            details: {
                planType: currentSub.planId as any,
                description: `Refund for cancelled ${currentSub.planId} plan.`
            }
        };
        batch.set(transactionRef, refundTransaction);
    }
    
    batch.update(profileRef, updates);
    await batch.commit();

    setUser(prev => ({...prev, ...updates, walletBalance: newBalance}));

  }, [firestore, firebaseUser, user]);

  const requestPlanModification = useCallback(async () => {
      if (!firestore || !firebaseUser || !user.subscription) {
        throw new Error("User or subscription not found.");
      }
      
      const profileRef = doc(firestore, 'customers', firebaseUser.uid);
      const updatedSubscription: Subscription = {
          ...user.subscription,
          modificationStatus: 'requested'
      };

      await updateDoc(profileRef, { subscription: updatedSubscription });
      
      setUser(prev => ({
          ...prev,
          subscription: updatedSubscription
      }));

  }, [firestore, firebaseUser, user.subscription]);


  const removeDishes = useCallback((dishIds: string[]) => {
    if (dishIds.length === 0) return;
  }, []);

  const refreshDishes = useCallback(async () => {
    // Since we use useCollection (real-time), manual refresh is mostly redundant,
    // but we can provide it for UX or to handle edge cases by re-mounting or similar logic.
    // For now, we'll just log and rely on Firebase's auto-sync.
    console.log("Refreshing dishes...");
    return Promise.resolve();
  }, []);

  const addOrUpdateDraftBooking = useCallback((draft: DraftBooking) => {
    setDraftBookings(prevDrafts => {
      const existingIndex = prevDrafts.findIndex(d => isSameDay(new Date(d.bookingDate), new Date(draft.bookingDate)));
      let newDrafts;
      if (existingIndex > -1) {
        newDrafts = [...prevDrafts];
        newDrafts[existingIndex] = draft;
      } else {
        newDrafts = [...prevDrafts, draft];
      }
      try {
        localStorage.setItem(DRAFT_BOOKINGS_STORAGE_KEY, JSON.stringify(newDrafts));
      } catch (error) {
        console.error("Failed to save draft bookings to localStorage:", error);
      }
      return newDrafts;
    });
  }, []);

  const removeDraftBooking = useCallback((bookingDate: string) => {
    setDraftBookings(prevDrafts => {
        const newDrafts = prevDrafts.filter(d => !isSameDay(new Date(d.bookingDate), new Date(bookingDate)));
        try {
            localStorage.setItem(DRAFT_BOOKINGS_STORAGE_KEY, JSON.stringify(newDrafts));
        } catch (error) {
            console.error("Failed to save draft bookings to localStorage:", error);
        }
        return newDrafts;
    });
  }, []);

  const getDraftBookingForSlot = useCallback((bookingDate: string) => {
    return draftBookings.find(d => isSameDay(new Date(d.bookingDate), new Date(bookingDate)));
  }, [draftBookings]);

  const submitAllDraftBookings = useCallback(async (totalCost?: number) => {
    if (!firestore || !firebaseUser || draftBookings.length === 0) return;

    const batch = writeBatch(firestore);
    draftBookings.forEach(draft => {
        if (!userBookingsRef) return;
      const newBookingRef = doc(userBookingsRef);
      
      const finalItems = draft.items.map(item => {
        const finalItem: DraftBookingItem = {
          dishId: item.dishId,
          dishName: item.dishName,
          numberOfPortions: item.numberOfPortions,
        };
        if (item.notes) {
          finalItem.notes = item.notes;
        }
        return finalItem;
      });

      const finalBooking: Omit<Booking, 'id'> = {
        customerId: firebaseUser.uid,
        bookingDate: draft.bookingDate,
        mealType: draft.mealType,
        status: 'pending',
        type: 'cook',
        items: finalItems,
        totalCost: totalCost ?? 0,
      };
      batch.set(newBookingRef, finalBooking);
    });

    // Increment used visits if on a subscription
    if (user.subscription && user.subscription.status === 'active') {
        const newUsed = (user.subscription.usedVisits || 0) + draftBookings.length;
        const profileRef = doc(firestore, 'customers', firebaseUser.uid);
        batch.update(profileRef, {
            'subscription.usedVisits': newUsed
        });
        
        // Optimistic update
        setUser(prev => ({
            ...prev,
            subscription: prev.subscription ? { ...prev.subscription, usedVisits: newUsed } : undefined
        }));
    }

    await batch.commit();
    setDraftBookings([]);
    try {
        localStorage.removeItem(DRAFT_BOOKINGS_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear draft bookings from localStorage:", error);
    }
  }, [firestore, firebaseUser, userBookingsRef, draftBookings]);

  const clearDraftsAndSubmitCurationRequest = useCallback(async (bookingDate: string) => {
    if (!userBookingsRef || !firebaseUser) return;

    setDraftBookings([]);
     try {
        localStorage.removeItem(DRAFT_BOOKINGS_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear draft bookings from localStorage:", error);
    }

    const curationRequest: Omit<Booking, 'id'> = {
        customerId: firebaseUser.uid,
        bookingDate: bookingDate,
        mealType: 'Lunch',
        items: [],
        status: 'pending',
        notes: 'EXPERT_CURATION_REQUEST',
        totalCost: 0,
    };

    addDocumentNonBlocking(userBookingsRef, curationRequest);
    router.push('/dashboard');
  }, [userBookingsRef, firebaseUser, router]);


  const cancelSlot = useCallback((bookingId: string) => {
    if (!firestore || !firebaseUser) return;
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) return;
    const bookingRef = doc(firestore, 'customers', firebaseUser.uid, 'bookings', bookingId);
    updateDocumentNonBlocking(bookingRef, { status: 'cancelled' });
  }, [firestore, firebaseUser, bookings]);

  const setGuestConfig = useCallback((config: {pincode: string; familySize: number; address?: string; city?: string; state?: string } | null) => {
    setGuestConfigState(config);
    try {
        if (config) {
            localStorage.setItem(GUEST_CONFIG_STORAGE_KEY, JSON.stringify(config));
        } else {
            localStorage.removeItem(GUEST_CONFIG_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Failed to save guest config to localStorage:", error);
    }
  }, []);

  const executeUnifiedCheckout = useCallback(async (planDetails: any, requiredRecharge: number) => {
    if (!firestore || !firebaseUser) {
        throw new Error("User not authenticated for checkout.");
    }
    if (requiredRecharge > 0) {
        rechargeWallet(requiredRecharge);
    }

    if (planDetails.type !== 'daily' && planDetails.type !== 'day') {
        await purchaseSubscription(planDetails);
    } else {
        // Daily plan is a one-off payment
        deductFromWallet(planDetails.cost);
        const transactionRef = doc(collection(firestore, 'customers', firebaseUser.uid, 'transactions'));
        const newTransaction: Omit<Transaction, 'id'> = {
            type: 'booking_payment',
            amount: planDetails.cost,
            date: serverTimestamp(),
            details: {
                description: `Daily booking on ${format(new Date(), 'PPP')}`
            }
        };
        setDocumentNonBlocking(transactionRef, newTransaction, {});
    }

    await submitAllDraftBookings(planDetails.cost);

    try {
        localStorage.removeItem(GUEST_CONFIG_STORAGE_KEY);
        setGuestConfigState(null);
    } catch (error) {
        console.error("Failed to clear guest config from localStorage:", error);
    }
    router.push('/dashboard');
  }, [rechargeWallet, purchaseSubscription, submitAllDraftBookings, deductFromWallet, firestore, firebaseUser, router]);


  const isInitialized = !isUserLoading && !isProfileLoading && !areBookingsLoading && !areDishesLoading;

  const value = {
    user,
    slots,
    bookings,
    dishes,
    draftBookings,
    isInitialized,
    guestConfig,
    updateUserProfile,
    rechargeWallet,
    deductFromWallet,
    checkBalance,
    canPurchasePlan,
    purchaseSubscription,
    upgradeSubscription,
    cancelCurrentPlan,
    requestPlanModification,
    removeDishes,
    refreshDishes,
    addOrUpdateDraftBooking,
    removeDraftBooking,
    getDraftBookingForSlot,
    submitAllDraftBookings,
    clearDraftsAndSubmitCurationRequest,
    cancelSlot,
    setGuestConfig,
    executeUnifiedCheckout,
  };

  return (
    <CulinaryStoreContext.Provider value={value}>
      {children}
    </CulinaryStoreContext.Provider>
  );
};

export const useCulinaryStore = () => {
  const context = useContext(CulinaryStoreContext);
  if (context === undefined) {
    throw new Error('useCulinaryStore must be used within a CulinaryStoreProvider');
  }
  return context;
};
export type { DraftBooking, DraftBookingItem };
