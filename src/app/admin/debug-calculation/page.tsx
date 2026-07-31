
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Calculator, Sparkles, User as UserIcon } from 'lucide-react';
import { calculateTotalCookingTime } from '@/lib/timeEngine';
import type { Dish } from '@/lib/types';
import { useRouter } from 'next/navigation';

function SanityCheckComponent() {
  const { user: userProfile, dishes: allDishes, updateUserProfile } = useCulinaryStore();
  const router = useRouter();
  
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [numPeople, setNumPeople] = useState<number>(userProfile.familySize || 1);
  const [calculationResult, setCalculationResult] = useState<{ total_minutes: number; breakdown: { active: number; passive: number; } } | null>(null);

  const isContextValid = userProfile && userProfile.familySize > 0;

  const selectedDishes = useMemo(() => {
    return selectedDishIds.map(id => allDishes.find(d => d.id === id)).filter((d): d is Dish => !!d);
  }, [selectedDishIds, allDishes]);

  useEffect(() => {
    if (selectedDishes.length > 0 && isContextValid) {
      const dishesWithQty = selectedDishes.map(d => ({ ...d, qty: 1 })); // Assume quantity of 1 for debug
      const result = calculateTotalCookingTime(numPeople, dishesWithQty);
      setCalculationResult(result);
    } else {
      setCalculationResult(null);
    }
  }, [selectedDishes, numPeople, isContextValid]);
  
  const handleResetContext = () => {
    // In a real app with localStorage for user context, you'd clear it here.
    // For now, we reset the store and redirect.
    updateUserProfile({ familySize: 1 });
    router.push('/profile');
  };

  const handleSelectDish = (dishId: string, checked: boolean) => {
    setSelectedDishIds(prev =>
      checked ? [...prev, dishId] : prev.filter(id => id !== dishId)
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Time Calculation Debugger</CardTitle>
          <CardDescription>
            This tool helps verify the `calculateTotalCookingTime` engine by testing it with real data.
          </CardDescription>
        </CardHeader>
      </Card>

      {!isContextValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>User Context is Invalid!</AlertTitle>
          <AlertDescription>
            The user profile is missing `familySize`. This will cause calculation errors.
            <Button onClick={handleResetContext} variant="link" className="p-0 h-auto ml-2">Reset Household Details</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Dishes to Calculate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Dish Name</TableHead>
                      <TableHead>Base Cook Time</TableHead>
                      <TableHead>Scale Factor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDishes.map(dish => (
                      <TableRow key={dish.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDishIds.includes(dish.id)}
                            onCheckedChange={(checked) => handleSelectDish(dish.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>{dish.displayName_en}</TableCell>
                        <TableCell>{dish.totalCookTimeMinutes || 'N/A'}</TableCell>
                        <TableCell>{dish.volume_scale_factor ?? `0.2 (default)`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 sticky top-24">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserIcon/> User Input</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="numPeople">Number of People</Label>
                        <Input 
                            id="numPeople"
                            type="number"
                            value={numPeople}
                            onChange={(e) => setNumPeople(Number(e.target.value))}
                            min="1"
                        />
                    </div>
                </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator /> Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculationResult ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Computed Time</p>
                    <p className="text-4xl font-bold">{calculationResult.total_minutes} mins</p>
                  </div>
                  <div className="text-xs space-y-1 pt-2 border-t">
                      <p>Breakdown:</p>
                      <p><strong>Total Active Time:</strong> {calculationResult.breakdown.active} mins</p>
                      <p><strong>Max Passive Time:</strong> {calculationResult.breakdown.passive} mins</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Select dishes to see the calculation.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DebugCalculationPage() {
    return (
        <FirebaseClientProvider>
            <AdminAuthGuard>
                <AppLayout pageTitle="Debug Time Calculation">
                    <SanityCheckComponent />
                </AppLayout>
            </AdminAuthGuard>
        </FirebaseClientProvider>
    )
}
