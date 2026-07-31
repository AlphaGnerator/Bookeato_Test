'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { Flame, AlertTriangle, ChefHat, Beef, Clock, ArrowLeft, Minus, Plus, Search, Filter, X, Wrench, Sparkles, Check } from 'lucide-react';
import type { Dish, DraftBookingItem } from '@/lib/types';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from 'embla-carousel-autoplay';

const popularMealPlanPills = [
    { id: 'all', label: 'All Dishes', icon: '🍽️' },
    { id: 'plan-high-protein', label: 'High Protein', icon: '🏋️', badge: 'High Protein Pick' },
    { id: 'plan-kids-friendly', label: 'Kids Friendly', icon: '👧', badge: 'Kids Favorite' },
    { id: 'plan-elderly', label: 'Elderly Care', icon: '👵', badge: 'Elderly Care Pick' },
    { id: 'plan-quick-recipes', label: 'Quick Recipes', icon: '⚡', badge: '20-Min Quick Prep' },
    { id: 'plan-bld', label: 'Full Day Package', icon: '🍱', badge: 'Full Day Thali' },
];

function DishCard({ dish, onPortionChange, portions, onSideChange, sideSelection, activeMealPlan }: { dish: Dish, onPortionChange: (newPortion: number) => void, portions: number, onSideChange: (dishId: string, side: 'rice' | 'roti', value: string | number) => void, sideSelection: { rice: string, roti: number }, activeMealPlan?: string }) {
    const safeDietaryTags = dish.dietaryTags || [];
    const isNonVeg = safeDietaryTags.some(tag => tag.toLowerCase().includes('non_veg'));
    const spiceLevel = dish.spiceLevel || 0;
    const isMainCourse = dish.course === 'Main';

    const mealPlanBadge = useMemo(() => {
        if (!activeMealPlan || activeMealPlan === 'all') return null;
        const matchingPill = popularMealPlanPills.find(p => p.id === activeMealPlan);
        return matchingPill?.badge || null;
    }, [activeMealPlan]);

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
                 {mealPlanBadge && (
                    <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-orange-500 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 border-none shadow-md">
                            ✨ {mealPlanBadge}
                        </Badge>
                    </div>
                 )}
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
    const mealPlanParam = searchParams.get('mealPlan');
    const { toast } = useToast();

    const { dishes, addOrUpdateDraftBooking, removeDraftBooking, getDraftBookingForSlot } = useCulinaryStore();

    const activeDishes = useMemo(() => (dishes || []).filter(d => d.isActive), [dishes]);
    
    const [itemPortions, setItemPortions] = useState<Record<string, number>>({});
    const [sideSelections, setSideSelections] = useState<Record<string, { rice: string, roti: number }>>({});
    
    // Meal Plan Combo Filter
    const [activeMealPlan, setActiveMealPlan] = useState<string>(() => mealPlanParam || 'all');

    // Search and category filters
    const [stagedSearchTerm, setStagedSearchTerm] = useState('');
    const [stagedCourse, setStagedCourse] = useState<string>('');
    const [stagedCuisines, setStagedCuisines] = useState<string[]>([]);
    const [stagedDiet, setStagedDiet] = useState<'all' | 'veg' | 'non-veg'>('all');

    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [activeCourse, setActiveCourse] = useState<string>('');
    const [activeCuisines, setActiveCuisines] = useState<string[]>([]);
    const [activeDiet, setActiveDiet] = useState<'all' | 'veg' | 'non-veg'>('all');

    useEffect(() => {
        if (mealPlanParam) {
            setActiveMealPlan(mealPlanParam);
        }
    }, [mealPlanParam]);

    // Auto-populate recommended dish combo if opening a popular plan with empty portions
    useEffect(() => {
        if (activeMealPlan && activeMealPlan !== 'all' && Object.keys(itemPortions).length === 0 && dishes.length > 0) {
            let defaultDishes: Dish[] = [];
            const planLower = activeMealPlan.toLowerCase();
            
            if (planLower.includes('protein')) {
                defaultDishes = dishes.filter(d => (d.protein_grams || 0) >= 15 || d.displayName_en.toLowerCase().includes('paneer') || d.displayName_en.toLowerCase().includes('biryani') || d.displayName_en.toLowerCase().includes('dal')).slice(0, 2);
            } else if (planLower.includes('kids')) {
                defaultDishes = dishes.filter(d => (d.spiceLevel || 0) <= 2 || d.displayName_en.toLowerCase().includes('dosa') || d.displayName_en.toLowerCase().includes('paneer')).slice(0, 2);
            } else if (planLower.includes('elderly')) {
                defaultDishes = dishes.filter(d => (d.spiceLevel || 0) <= 1 || d.displayName_en.toLowerCase().includes('dal') || d.displayName_en.toLowerCase().includes('palak')).slice(0, 2);
            } else if (planLower.includes('quick')) {
                defaultDishes = dishes.filter(d => (d.totalCookTimeMinutes || 0) <= 30 || d.displayName_en.toLowerCase().includes('dosa') || d.displayName_en.toLowerCase().includes('paneer')).slice(0, 2);
            } else {
                defaultDishes = dishes.slice(0, 2);
            }

            if (defaultDishes.length > 0) {
                const initialPortions: Record<string, number> = {};
                defaultDishes.forEach(d => { initialPortions[d.id] = 1; });
                setItemPortions(initialPortions);
                
                const selectedPill = popularMealPlanPills.find(p => p.id === activeMealPlan);
                toast({
                    title: `Loaded ${selectedPill?.label || 'Meal Plan'} Combo`,
                    description: `Pre-loaded ${defaultDishes.length} recommended dishes for your plan. You can adjust portions or add more dishes below.`,
                });
            }
        }
    }, [activeMealPlan, dishes, itemPortions]);

    const bookingDateFromUrl = useMemo(() => {
        if (!dateParam) return null;
        const date = parseISO(dateParam);
        if (isNaN(date.getTime())) return null;
        const timeSlotParam = searchParams.get('timeSlot');
        if (timeSlotParam) {
            const [hours, minutes] = timeSlotParam.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                date.setHours(hours, minutes, 0, 0);
            }
        }
        return date;
    }, [dateParam, searchParams]);

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

            let mealPlanMatch = true;
            if (activeMealPlan && activeMealPlan !== 'all') {
                const tags = (dish.dietaryTags || []).map(t => t.toLowerCase());
                const name = dish.displayName_en.toLowerCase();
                const course = (dish.course || '').toLowerCase();
                
                if (activeMealPlan === 'plan-high-protein') {
                    mealPlanMatch = (dish.protein_grams || 0) >= 15 || tags.some(t => t.includes('protein') || t.includes('paneer') || t.includes('chicken') || t.includes('egg') || t.includes('dal')) || name.includes('paneer') || name.includes('biryani') || name.includes('dal');
                } else if (activeMealPlan === 'plan-kids-friendly') {
                    mealPlanMatch = (dish.spiceLevel || 0) <= 2 || tags.some(t => t.includes('sweet') || t.includes('mild') || t.includes('paneer') || t.includes('dosa')) || name.includes('dosa') || name.includes('paneer');
                } else if (activeMealPlan === 'plan-elderly') {
                    mealPlanMatch = (dish.spiceLevel || 0) <= 1 || tags.some(t => t.includes('healthy') || t.includes('soup') || t.includes('dal') || t.includes('khichdi') || t.includes('phulka')) || name.includes('dal') || name.includes('phulka');
                } else if (activeMealPlan === 'plan-quick-recipes') {
                    mealPlanMatch = (dish.totalCookTimeMinutes || 0) <= 30 || course.includes('quick') || course.includes('breads') || name.includes('dosa');
                } else if (activeMealPlan === 'plan-bld') {
                    mealPlanMatch = true;
                }
            }

            return courseMatch && cuisineMatch && searchMatch && dietMatch && mealPlanMatch;
        });
    }, [activeDishes, activeCourse, activeCuisines, activeSearchTerm, activeDiet, activeMealPlan]);
    
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    const slides = [
        {
            title: "Chef at Home",
            subtitle: "Gourmet meals prepared in your own kitchen. Select your favorite dishes and schedule.",
            image: "/marketplace/chef_bg_clean.png",
            badges: ["30% OFF FIRST SERVICE", "Verified professional Chefs"]
        },
        {
            title: "Customizable Menus",
            subtitle: "From daily home-style cooking to special occasion feasts. Tailored to your taste.",
            image: "/marketplace/chef_bg_clean.png",
            badges: ["Flexible Portions", "Nutritious & Fresh"]
        }
    ];

    const handleDietToggle = (diet: 'veg' | 'non-veg') => {
        if (stagedDiet === diet) {
            setStagedDiet('all');
        } else {
            setStagedDiet(diet);
        }
    };

    const handleApplyFilters = () => {
        setActiveSearchTerm(stagedSearchTerm);
        setActiveCourse(stagedCourse);
        setActiveCuisines(stagedCuisines);
        setActiveDiet(stagedDiet);
    };

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
                });
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
        const items = Object.entries(itemPortions)
            .map(([dishId, numberOfPortions]): DraftBookingItem | null => {
                const dish = dishes.find(d => d.id === dishId);
                if (!dish) return null;
                 const sides = sideSelections[dishId];
                const notes: string[] = [];
                if (sides?.rice && sides.rice !== 'none') notes.push(`Rice for ${sides.rice}`);
                if (sides?.roti > 0) notes.push(`Roti x${sides.roti}`);
                const item: DraftBookingItem = {
                    dishId,
                    dishName: dish.displayName_en,
                    numberOfPortions,
                };
                if (notes.length > 0) {
                    item.notes = notes.join(', ');
                }
                return item;
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

    const activePill = popularMealPlanPills.find(p => p.id === activeMealPlan);

    return (
        <div className="bg-stone-50 min-h-screen pb-32">
            {/* Premium Service Carousel */}
            <div className="relative w-full h-64 md:h-80 overflow-hidden mb-8">
                <Carousel 
                    plugins={[plugin.current]}
                    className="w-full h-full"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent className="h-full -ml-0">
                        {slides.map((slide, idx) => (
                            <CarouselItem key={idx} className="h-full pl-0">
                                <div className="relative w-full h-64 md:h-80 overflow-hidden">
                                    <Image 
                                        src={slide.image} 
                                        alt={slide.title} 
                                        fill 
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent p-6 md:p-12 flex flex-col justify-end">
                                        <div className="container mx-auto px-0 max-w-4xl">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {slide.badges.map((badge, bIdx) => (
                                                    <Badge key={bIdx} className={cn(
                                                        "text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border-none px-4",
                                                        badge.includes('OFF') ? "bg-orange-500" : "bg-white/20 backdrop-blur-md"
                                                    )}>
                                                        {badge}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-3">{slide.title}</h1>
                                            <p className="text-white/80 text-sm md:text-lg font-bold max-w-xl leading-snug">
                                                {slide.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                
                <div className="absolute top-6 left-6 z-10">
                    <Button 
                        variant="ghost" 
                        className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 border-none px-4 py-2"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 sm:px-6">
                
                {/* Popular Meal Plan Combination Active Banner */}
                {activeMealPlan !== 'all' && (
                    <div className="bg-amber-500/10 border-2 border-amber-400/50 p-4 rounded-2xl mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">{activePill?.icon}</span>
                            <div>
                                <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                                    <span>{activePill?.label} Combo Active</span>
                                    <Badge className="bg-amber-500 text-stone-950 font-black border-none text-[9px] uppercase px-2 py-0.5">
                                        Selected
                                    </Badge>
                                </h3>
                                <p className="text-xs text-stone-600 font-medium">Viewing curated dish combinations for this plan. Add or adjust items below.</p>
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setActiveMealPlan('all')} 
                            className="text-xs font-bold text-stone-500 hover:text-stone-900 shrink-0"
                        >
                            View All Dishes
                        </Button>
                    </div>
                )}

                {/* Sticky Filter Bar */}
                <div className="sticky top-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-[2.5rem] shadow-xl shadow-stone-200/30 border border-stone-100 mb-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" strokeWidth={3} />
                        <Input
                            placeholder="What do you want to eat today?"
                            value={stagedSearchTerm}
                            onChange={(e) => setStagedSearchTerm(e.target.value)}
                            className="pl-12 h-14 border-none bg-transparent focus-visible:ring-0 text-xl font-black tracking-tight placeholder:text-stone-300"
                        />
                    </div>

                    {/* Popular Meal Plan Presets Pills Bar */}
                    <div className="space-y-1.5 border-t border-stone-100 pt-3">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Popular Meal Plan Combinations:</span>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {popularMealPlanPills.map((pill) => (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => setActiveMealPlan(pill.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 border active:scale-95",
                                        activeMealPlan === pill.id
                                            ? "bg-amber-400 text-stone-950 border-amber-500 shadow-md scale-105"
                                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                                    )}
                                >
                                    <span>{pill.icon}</span>
                                    <span>{pill.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
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

            <main className="space-y-4 pb-32 container mx-auto max-w-4xl px-4 sm:px-6">
                {filteredDishes.length > 0 ? (
                    filteredDishes.map(dish => (
                        <DishCard 
                            key={dish.id} 
                            dish={dish}
                            onPortionChange={(newPortions) => handlePortionChange(dish.id, newPortions)}
                            portions={itemPortions[dish.id] || 0}
                            onSideChange={handleSideChange}
                            sideSelection={sideSelections[dish.id] || { rice: 'none', roti: 0 }}
                            activeMealPlan={activeMealPlan}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20 px-4">
                        <Search className="h-12 w-12 opacity-20 mb-4" />
                        <p className="font-bold text-lg">No dishes found for this combination</p>
                        <p className="text-sm">Try selecting 'All Dishes' or adjusting your search term.</p>
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
