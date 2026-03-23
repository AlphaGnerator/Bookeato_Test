'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useCulinaryStore, type DraftBookingItem } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { Flame, AlertTriangle, ChefHat, Beef, Clock, ArrowLeft, Minus, Plus, Search, Filter, X, Wrench } from 'lucide-react';
import type { Dish } from '@/lib/types';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';

function DishCard({ dish, onPortionChange, portions, onSideChange, sideSelection }: { dish: Dish, onPortionChange: (newPortion: number) => void, portions: number, onSideChange: (dishId: string, side: 'rice' | 'roti', value: string | number) => void, sideSelection: { rice: string, roti: number } }) {
    const safeDietaryTags = dish.dietaryTags || [];
    const isNonVeg = safeDietaryTags.some(tag => tag.toLowerCase().includes('non_veg'));
    const spiceLevel = dish.spiceLevel || 0;
    const isMainCourse = dish.course === 'Main';

    return (
      <Card className="overflow-hidden transition-all hover:shadow-lg w-full border-2 border-[#fde047]">
        <div className="flex flex-col sm:flex-row">
            <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
                 <Image
                    src={dish.heroImageUrl || "https://picsum.photos/seed/1/300/200"}
                    alt={dish.displayName_en}
                    fill
                    className="object-cover"
                 />
            </div>
            <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                    <div className="flex items-center gap-2">
                        {isNonVeg ? (
                            <div className="h-6 w-6 border-2 border-red-600 bg-white flex items-center justify-center flex-shrink-0" title="Non-Vegetarian">
                                <div className="h-3 w-3 bg-red-600 rounded-full"></div>
                            </div>
                        ) : (
                             <div className="h-6 w-6 border-2 border-green-600 bg-white flex items-center justify-center flex-shrink-0" title="Vegetarian">
                                <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                            </div>
                        )}
                        <h4 className="font-bold text-lg text-text-primary">{dish.displayName_en}</h4>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{dish.cuisine}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary my-2">
                        <div className="flex items-center gap-1" title="Spice Level">
                            {Array.from({ length: 5 }).map((_, i) => (
                               <Flame key={i} className={cn("h-4 w-4", i < spiceLevel ? 'text-destructive fill-destructive' : 'text-black/30')} />
                           ))}
                        </div>
                        <div className="flex items-center gap-1" title="Calories">
                           <Flame className="h-4 w-4 text-orange-500" />
                           <span>{dish.calories || 'N/A'} kcal</span>
                        </div>
                         <div className="flex items-center gap-1" title="Protein">
                           <Flame className="h-4 w-4 text-orange-600" />
                           <span>{dish.protein_grams || 'N/A'} g</span>
                        </div>
                        <div className="flex items-center gap-1" title="Total Cook Time">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{dish.totalCookTimeMinutes ? `${dish.totalCookTimeMinutes} mins` : '-'}</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-text-muted mt-2 line-clamp-3 italic">"{dish.story_en || dish.shortDescription_en}"</p>
                    
                    {dish.allergenAlerts && dish.allergenAlerts.length > 0 && (
                        <div className="mt-3 text-xs flex items-center gap-2 text-amber-600">
                           <AlertTriangle className="h-4 w-4" />
                           Contains: {dish.allergenAlerts.join(', ')}
                        </div>
                    )}

                    {dish.equipmentNeeded && dish.equipmentNeeded.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                <Wrench className="h-3 w-3" />
                                Requires:
                            </div>
                            {dish.equipmentNeeded.map((eq, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/30">
                                    {eq}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="flex-shrink-0">
                         {portions > 0 ? (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-9 w-9 bg-white touch-manipulation active:scale-95" onClick={() => onPortionChange(portions - 1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-lg w-8 text-center">{portions}</span>
                                 <Button variant="outline" size="icon" className="h-9 w-9 bg-white touch-manipulation active:scale-95" onClick={() => onPortionChange(portions + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                         ) : (
                            <Button 
                                variant="outline"
                                size="sm" 
                                className="w-24 h-9 bg-green-primary text-white hover:bg-green-primary/90 touch-manipulation active:scale-95" 
                                onClick={() => onPortionChange(1)}
                            >
                                Add
                            </Button>
                         )}
                    </div>
                     {isMainCourse && portions > 0 && (
                        <div className="flex items-center gap-2">
                             <Select value={sideSelection.rice} onValueChange={(val) => onSideChange(dish.id, 'rice', val)}>
                                <SelectTrigger className="w-[140px] h-9 text-xs bg-accent text-accent-foreground border-accent-foreground/50 touch-manipulation">
                                    <SelectValue placeholder="Rice Portion" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Rice</SelectItem>
                                    <SelectItem value="1">For 1 person</SelectItem>
                                    <SelectItem value="2">For 2 people</SelectItem>
                                    <SelectItem value="3">For 3 people</SelectItem>
                                    <SelectItem value="4">For 4 people</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={String(sideSelection.roti)} onValueChange={(val) => onSideChange(dish.id, 'roti', Number(val))}>
                                <SelectTrigger className="w-[120px] h-9 text-xs bg-accent text-accent-foreground border-accent-foreground/50 touch-manipulation">
                                    <SelectValue placeholder="Roti" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No Roti</SelectItem>
                                     {[4, 8, 12, 16, 20, 24].map(num => <SelectItem key={num} value={String(num)}>Roti x{num}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                     )}
                </div>
            </div>
        </div>
      </Card>
    )
}

export function MenuSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const { toast } = useToast();

    const { dishes, addOrUpdateDraftBooking, removeDraftBooking, getDraftBookingForSlot } = useCulinaryStore();

    const activeDishes = useMemo(() => (dishes || []).filter(d => d.isActive), [dishes]);
    
    const [itemPortions, setItemPortions] = useState<Record<string, number>>({});
    const [sideSelections, setSideSelections] = useState<Record<string, { rice: string, roti: number }>>({});
    
    // Staging state for filters
    const [stagedSearchTerm, setStagedSearchTerm] = useState('');
    const [stagedCourse, setStagedCourse] = useState<string>('');
    const [stagedCuisines, setStagedCuisines] = useState<string[]>([]);
    const [stagedDiet, setStagedDiet] = useState<'all' | 'veg' | 'non-veg'>('all');

    // Active state for filters
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [activeCourse, setActiveCourse] = useState<string>('');
    const [activeCuisines, setActiveCuisines] = useState<string[]>([]);
    const [activeDiet, setActiveDiet] = useState<'all' | 'veg' | 'non-veg'>('all');

    const bookingDateFromUrl = useMemo(() => {
        if (!dateParam) return null;
        const date = parseISO(dateParam);
        return isNaN(date.getTime()) ? null : date;
    }, [dateParam]);

    const getMealTypeFromTime = (isoDate: string): 'Breakfast' | 'Lunch' | 'Dinner' => {
        const hour = new Date(isoDate).getHours();
        if (hour < 11) return 'Breakfast';
        if (hour < 16) return 'Lunch';
        return 'Dinner';
    }

    useEffect(() => {
        if (bookingDateFromUrl) {
            const existingDraft = getDraftBookingForSlot(bookingDateFromUrl.toISOString());
            if (existingDraft) {
                const portionsMap = existingDraft.items.reduce((acc, item) => {
                    acc[item.dishId] = item.numberOfPortions;
                    return acc;
                }, {} as Record<string, number>);
                setItemPortions(portionsMap);

                const sidesMap: Record<string, { rice: string, roti: number }> = {};
                existingDraft.items.forEach(item => {
                    if (item.notes) {
                        const riceMatch = item.notes.match(/Rice for (\d+)/);
                        const rotiMatch = item.notes.match(/Roti x(\d+)/);
                        sidesMap[item.dishId] = {
                            rice: riceMatch ? riceMatch[1] : 'none',
                            roti: rotiMatch ? parseInt(rotiMatch[1]) : 0,
                        };
                    }
                });
                setSideSelections(sidesMap);
            }
        }
    }, [bookingDateFromUrl, getDraftBookingForSlot]);


    const courseCategories = useMemo(() => {
        const courses = new Set<string>();
        (dishes || []).forEach(dish => {
            courses.add(dish.course || 'Others');
        });
        courses.add("Breads & Rice"); 
        return Array.from(courses).sort();
    }, [dishes]);
    
    const cuisineTypes = useMemo(() => {
        const cuisines = new Set<string>();
        (dishes || []).forEach(dish => {
            if(dish.cuisine) cuisines.add(dish.cuisine);
        });
        return Array.from(cuisines).sort();
    }, [dishes]);
    
    const filteredDishes = useMemo(() => {
        return activeDishes.filter(dish => {
            const courseMatch = !activeCourse || (dish.course || 'Others') === activeCourse || (activeCourse === 'Breads & Rice' && (dish.course === 'Breads' || dish.course === 'Rice'));
            const cuisineMatch = activeCuisines.length === 0 || (dish.cuisine && activeCuisines.includes(dish.cuisine));
            const searchMatch = !activeSearchTerm || dish.displayName_en.toLowerCase().includes(activeSearchTerm.toLowerCase());
            
            const isNonVeg = (dish.dietaryTags || []).some(tag => tag.toLowerCase().includes('non_veg'));
            const dietMatch = activeDiet === 'all' || (activeDiet === 'veg' && !isNonVeg) || (activeDiet === 'non-veg' && isNonVeg);

            return courseMatch && cuisineMatch && searchMatch && dietMatch;
        });
    }, [activeDishes, activeCourse, activeCuisines, activeSearchTerm, activeDiet]);
    
    const handleCuisineChange = (cuisine: string) => {
        setStagedCuisines(prev => 
            prev.includes(cuisine) 
                ? prev.filter(c => c !== cuisine)
                : [...prev, cuisine]
        );
    }

    const handleApplyFilters = () => {
        setActiveSearchTerm(stagedSearchTerm);
        setActiveCourse(stagedCourse);
        setActiveCuisines(stagedCuisines);
        setActiveDiet(stagedDiet);
    }
    
    const handleDietToggle = (diet: 'veg' | 'non-veg') => {
        if (stagedDiet === diet) {
            setStagedDiet('all');
        } else {
            setStagedDiet(diet);
        }
    }

    const handlePortionChange = (dishId: string, newPortions: number) => {
        setItemPortions(prev => {
            const newPortionsMap = { ...prev };
            if (newPortions > 0) {
                newPortionsMap[dishId] = newPortions;
            } else {
                delete newPortionsMap[dishId];
                setSideSelections(prevSides => {
                    const newSides = {...prevSides};
                    delete newSides[dishId];
                    return newSides;
                })
            }
            return newPortionsMap;
        });
    };

    const handleSideChange = (dishId: string, side: 'rice' | 'roti', value: string | number) => {
        setSideSelections(prev => ({
            ...prev,
            [dishId]: {
                ...(prev[dishId] || { rice: 'none', roti: 0 }),
                [side]: value
            }
        }))
    }
    
    const handleConfirm = () => {
        const items: DraftBookingItem[] = Object.entries(itemPortions)
            .map(([dishId, numberOfPortions]) => {
                const dish = dishes.find(d => d.id === dishId);
                if (!dish) return null;
                 const sides = sideSelections[dishId];
                const notes: string[] = [];
                if (sides?.rice && sides.rice !== 'none') notes.push(`Rice for ${sides.rice}`);
                if (sides?.roti > 0) notes.push(`Roti x${sides.roti}`);
                return {
                    dishId,
                    dishName: dish.displayName_en,
                    numberOfPortions,
                    notes: notes.join(', ') || undefined,
                }
            })
            .filter((item): item is DraftBookingItem => item !== null);

        if (items.length > 0) {
            let targetDate = bookingDateFromUrl;
            if (!targetDate) {
                targetDate = addDays(new Date(), 1);
                targetDate.setHours(13, 0, 0, 0);
            }

            addOrUpdateDraftBooking({
                bookingDate: targetDate.toISOString(),
                mealType: getMealTypeFromTime(targetDate.toISOString()),
                items: items,
            });
            
            const params = new URLSearchParams(searchParams.toString());
            router.push(`/booking/summary/${format(targetDate, 'yyyy-MM-dd')}?${params.toString()}`);
        } else {
            toast({ title: "No Dishes Selected", description: "Please add at least one dish to your menu.", variant: 'destructive'});
        }
    }

    const handleBack = () => {
        router.push('/');
    }

    const totalItems = Object.keys(itemPortions).length;
    const confirmButtonText = totalItems > 0 ? `Review ${totalItems} Item(s) & Schedule` : `Select Dishes`;

    return (
        <div className="container mx-auto py-4 md:py-8 px-4">
            <div className="sticky top-0 bg-background/90 backdrop-blur-md z-30 py-4 -mx-4 px-4 mb-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10 touch-manipulation active:scale-90">
                            <ArrowLeft className="h-6 w-6"/>
                        </Button>
                        <Logo className="scale-75 origin-left hidden sm:flex" />
                    </div>
                     <h1 className="font-headline text-xl md:text-3xl flex items-center gap-3 text-text-primary">
                        <ChefHat className="h-6 w-6 md:h-8 md:w-8 hidden xs:flex"/>
                        Select Dishes
                    </h1>
                    <div className="sm:hidden">
                        <Logo className="scale-50 origin-right" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10 hidden sm:flex touch-manipulation active:scale-90">
                        <X className="h-6 w-6"/>
                    </Button>
                </div>
                <div className="mt-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search menu..."
                            value={stagedSearchTerm}
                            onChange={(e) => setStagedSearchTerm(e.target.value)}
                            className="pl-10 h-11 md:h-12 text-base"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-muted rounded-full p-1 border">
                            <button 
                                onClick={() => handleDietToggle('veg')}
                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", stagedDiet === 'veg' ? 'bg-green-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >
                                Veg
                            </button>
                            <button 
                                onClick={() => handleDietToggle('non-veg')}
                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", stagedDiet === 'non-veg' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >
                                Non-Veg
                            </button>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs touch-manipulation active:scale-95">
                                    Course: <span className="font-bold">{stagedCourse || 'All'}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <RadioGroup value={stagedCourse} onValueChange={setStagedCourse} className="p-2">
                                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                                        <RadioGroupItem value="" id="course-all" />
                                        <Label htmlFor="course-all" className="flex-grow cursor-pointer">All Courses</Label>
                                    </div>
                                    {courseCategories.map(course => (
                                        <div key={course} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                                            <RadioGroupItem value={course} id={`course-${course}`} />
                                            <Label htmlFor={`course-${course}`} className="flex-grow cursor-pointer">{course}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </PopoverContent>
                        </Popover>
                         <Button onClick={handleApplyFilters} variant="cta" size="sm" className="h-9 text-xs ml-auto sm:ml-0 touch-manipulation active:scale-95">
                            <Filter className="mr-1 h-3 w-3" />
                            Apply
                        </Button>
                    </div>
                </div>
            </div>

            <main className="space-y-4 pb-32">
                {filteredDishes.length > 0 ? (
                    filteredDishes.map(dish => (
                        <DishCard 
                            key={dish.id} 
                            dish={dish}
                            onPortionChange={(newPortions) => handlePortionChange(dish.id, newPortions)}
                            portions={itemPortions[dish.id] || 0}
                            onSideChange={handleSideChange}
                            sideSelection={sideSelections[dish.id] || { rice: 'none', roti: 0 }}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20 px-4">
                        <Search className="h-12 w-12 opacity-20 mb-4" />
                        <p className="font-bold text-lg">No dishes found</p>
                        <p className="text-sm">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t z-40">
                <div className="container max-w-lg mx-auto">
                    <Button onClick={handleConfirm} size="lg" className="w-full h-14 text-lg font-bold shadow-lg touch-manipulation active:scale-95" disabled={totalItems === 0}>
                        {confirmButtonText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
