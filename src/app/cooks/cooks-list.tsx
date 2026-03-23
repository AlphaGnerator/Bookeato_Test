'use client';

import type { CookProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Soup, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

const demoCooks: CookProfile[] = [
    {
        id: 'demo-1',
        name: 'Hariom',
        experience: 20,
        rating: 4.9,
        specialties: ['North Indian', 'Street Food', 'Tandoori'],
        contactNumber: 'N/A',
        address: 'N/A',
        pincode: 'N/A',
    },
    {
        id: 'demo-2',
        name: 'Priya Sharma',
        experience: 8,
        rating: 4.7,
        specialties: ['South Indian', 'Chettinad', 'Vegan'],
        contactNumber: 'N/A',
        address: 'N/A',
        pincode: 'N/A',
    },
    {
        id: 'demo-3',
        name: 'Rajesh Kumar',
        experience: 12,
        rating: 4.8,
        specialties: ['Italian', 'Baking', 'Desserts'],
        contactNumber: 'N/A',
        address: 'N/A',
        pincode: 'N/A',
    }
];


function CookCard({ cook }: { cook: CookProfile }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="font-headline text-3xl">{cook.name}</CardTitle>
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-5 h-5 fill-amber-500" />
                        <span className="font-bold text-lg">{cook.rating?.toFixed(1) || 'New'}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Soup className="h-5 w-5" />
                    <p className="text-sm">Specialties:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {cook.specialties?.slice(0, 3).map(specialty => (
                        <Badge key={specialty} variant="secondary">{specialty}</Badge>
                    ))}
                    {cook.specialties?.length > 3 && <Badge variant="outline">+{cook.specialties.length - 3} more</Badge>}
                </div>
                 <div className="flex items-center gap-2 text-muted-foreground pt-2">
                    <Clock className="h-5 w-5" />
                    <p className="text-sm">{cook.experience || 0} years of experience</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" variant="accent">View Availability</Button>
            </CardFooter>
        </Card>
    );
}

function CookCardSkeleton() {
    return (
        <div className="space-y-4 rounded-lg border p-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-7 w-12" />
            </div>
            <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
            <div className="pt-4">
                <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
        </div>
    )
}

export function CooksList() {
    const [cooks, setCooks] = useState<CookProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching data
        const timer = setTimeout(() => {
            setCooks(demoCooks);
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);


    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <CookCardSkeleton />
                <CookCardSkeleton />
                <CookCardSkeleton />
            </div>
        )
    }

    if (!cooks || cooks.length === 0) {
        return (
            <Alert>
                <Soup className="h-4 w-4" />
                <AlertTitle>No Cooks Found</AlertTitle>
                <AlertDescription>
                    There are currently no cooks available in our system. Please check back later.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cooks.map(cook => (
                <CookCard key={cook.id} cook={cook} />
            ))}
        </div>
    );
}
