
'use client';
import React, { useState, useMemo } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flame, PlusCircle, Trash2, Pencil, Upload, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DishList() {
  const { dishes, isInitialized, removeDishes, refreshDishes } = useCulinaryStore();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDishes = useMemo(() => {
    if (!searchTerm) {
      return dishes;
    }
    return dishes.filter(dish =>
      dish.displayName_en.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dishes, searchTerm]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedDishes([]); // Reset selection when toggling mode
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDishes(filteredDishes.map(d => d.id));
    } else {
      setSelectedDishes([]);
    }
  };

  const handleSelectDish = (dishId: string, checked: boolean) => {
    if (checked) {
      setSelectedDishes(prev => [...prev, dishId]);
    } else {
      setSelectedDishes(prev => prev.filter(id => id !== dishId));
    }
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedDishes.length === 0) return;
    
    setIsDeleting(true);
    
    try {
        const batch = writeBatch(firestore);
        selectedDishes.forEach(dishId => {
            const docRef = doc(firestore, 'dishes', dishId);
            batch.delete(docRef);
        });
        
        await batch.commit();

        toast({
            title: 'Deletion Successful',
            description: `${selectedDishes.length} dish(es) have been deleted.`,
        });

        // Optimistically update the UI by calling the store's local state update function
        removeDishes(selectedDishes);
        
    } catch (e: any) {
        toast({
            title: "Deletion Failed",
            description: e.message || "An unexpected error occurred.",
            variant: "destructive",
        })
        console.error("Deletion failed:", e);
    } finally {
        setIsSelectionMode(false);
        setSelectedDishes([]);
        setIsDeleting(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDishes();
    setIsRefreshing(false);
    toast({
      title: 'Dishes Refreshed',
      description: 'The list has been updated with the latest data from the server.',
    });
  };


  if (!isInitialized) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Dish Playbook</CardTitle>
          <CardDescription>
            Manage the master list of all dishes available on the platform.
          </CardDescription>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isSelectionMode ? (
            <>
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button
                        variant="destructive"
                        disabled={selectedDishes.length === 0 || isDeleting}
                        className="w-full"
                      >
                        {isDeleting ? <Trash2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete ({selectedDishes.length})
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedDishes.length} dish(es).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              <Button variant="outline" onClick={handleToggleSelectionMode} className="w-full">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleRefresh} variant="ghost" size="icon" disabled={isRefreshing}>
                {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="sr-only">Refresh</span>
              </Button>
              <Button onClick={handleToggleSelectionMode} variant="outline" className="w-full">
                Manage
              </Button>
               <Button asChild variant="outline" className="w-full">
                <Link href="/admin/dishes/add">
                  <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/admin/dishes/add">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by dish name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
        </div>

        {filteredDishes.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {isSelectionMode && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedDishes.length > 0 && selectedDishes.length === filteredDishes.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  <TableHead>Dish</TableHead>
                  <TableHead>Formal Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDishes.map((dish) => {
                  return (
                  <TableRow key={dish.id} data-state={selectedDishes.includes(dish.id) ? 'selected' : ''}>
                    {isSelectionMode && (
                       <TableCell>
                        <Checkbox
                          checked={selectedDishes.includes(dish.id)}
                          onCheckedChange={(checked) => handleSelectDish(dish.id, !!checked)}
                          aria-label={`Select ${dish.displayName_en}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium flex items-center gap-4">
                      <Image
                        src={dish.heroImageUrl || 'https://picsum.photos/seed/default-dish/40/40'}
                        alt={dish.displayName_en}
                        width={40}
                        height={40}
                        className="rounded-md object-cover h-10 w-10"
                      />
                      <span>{dish.displayName_en}</span>
                    </TableCell>
                    <TableCell>{dish.formalName_en}</TableCell>
                    <TableCell>
                      <Badge variant={dish.isActive ? 'default' : 'secondary'}>
                        {dish.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/dishes/edit/${dish.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <Flame className="h-4 w-4" />
            <AlertTitle>No Dishes Found</AlertTitle>
            <AlertDescription>
              The playbook is empty or no dishes match your search. Click 'Add New Dish' to get started or 'Refresh' to load new data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
