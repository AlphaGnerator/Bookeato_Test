
'use client';

import React, { useState } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, CreditCard, Loader2, Sparkles, Delete } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingState } from "@/components/loading-state";
import { useRouter, useSearchParams } from 'next/navigation';

const keypadLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '<'],
];

const quickChips = [100, 500, 1000];

export function WalletManager() {
  const { user, rechargeWallet, isInitialized } = useCulinaryStore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSummary = searchParams.get('fromSummary') === 'true';
  const redirectUrl = searchParams.get('redirect');
  const requiredAmount = searchParams.get('requiredAmount');

  const [amount, setAmount] = useState(requiredAmount || '');
  const [isLoading, setIsLoading] = useState(false); // Renamed from isSubmitting for full-page loading

  const handleKeypadClick = (key: string) => {
    if (key === '<') {
      setAmount(current => current.slice(0, -1));
    } else {
      setAmount(current => current + key);
    }
  };
  
  const handleQuickChipClick = (value: number) => {
      setAmount(current => String((Number(current) || 0) + value));
  }

  const handleAddFunds = async () => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true); // Use isLoading for full-page processing
    // Simulate payment gateway interaction
    await new Promise(resolve => setTimeout(resolve, 1500));

    rechargeWallet(numericAmount);

    toast({
      title: 'Funds Added!',
      description: `₹${numericAmount.toLocaleString('en-IN')} has been successfully added to your wallet.`,
    });

    setIsLoading(false); // Reset loading state
    
    if (redirectUrl) {
        router.push(redirectUrl);
    } else if (fromSummary) {
        router.back();
    } else {
        setAmount('');
    }
  };

  if (isLoading) return <LoadingState fullPage type="generic" message="Securing your digital wallet..." />;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="text-center">
        <CardHeader>
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="text-5xl font-bold tracking-tight">
             ₹{(user.walletBalance || 0).toLocaleString('en-IN')}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recharge Wallet</CardTitle>
          <CardDescription>Enter an amount to add funds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
              ₹
            </span>
            <Input
              className="h-20 text-4xl font-bold text-center bg-muted/50"
              value={amount}
              placeholder="0"
              readOnly
            />
          </div>
          
          <div className="flex justify-center gap-2">
            {quickChips.map(value => (
                <Button key={value} variant="outline" size="sm" onClick={() => handleQuickChipClick(value)}>
                    +₹{value}
                </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keypadLayout.flat().map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-16 text-2xl"
                onClick={() => handleKeypadClick(key)}
              >
                {key === '<' ? <Delete/> : key}
              </Button>
            ))}
          </div>

          <Button onClick={handleAddFunds} disabled={!amount} size="lg" className="w-full">
            Add ₹{Number(amount || 0).toLocaleString('en-IN')} to Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
