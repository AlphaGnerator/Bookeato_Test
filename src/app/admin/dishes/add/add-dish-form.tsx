'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, ListPlus, Trash2, Clock, FolderSearch } from 'lucide-react';
import type { Dish, Ingredient, RecipeInstruction } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TagInput } from '@/components/tag-input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { IngredientsManager } from './ingredients-manager';
import { InstructionsManager } from './instructions-manager';
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
import { Slider } from '@/components/ui/slider';
import { ImagePicker } from '@/app/admin/image-library/image-picker';
import Image from 'next/image';

const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ingredient name is required.'),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1, 'Unit is required.'),
  prepNote: z.string().optional(),
  providedBy: z.enum(['Customer', 'Cook']),
  isKeyIngredient: z.boolean(),
});

const instructionSchema = z.object({
  id: z.string(),
  stepNumber: z.coerce.number().min(1),
  instruction_en: z.string().min(1, 'Instruction is required.'),
  instruction_hi: z.string().optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  timeMinutes: z.coerce.number().min(0).optional(),
  time_category: z.enum(['ACTIVE', 'PASSIVE', 'PRE_PREP']),
  specialInstruction: z.string().optional(),
});


const dishSchema = z.object({
  displayName_en: z.string().min(1, 'Display name is required.'),
  formalName_en: z.string().min(1, 'Formal name is required.'),
  cuisine: z.string().min(1, 'Cuisine is required.'),
  course: z.string().min(1, 'Course is required.'),
  isActive: z.boolean().default(true),
  
  shortDescription_en: z.string().optional(),
  story_en: z.string().optional(),
  culinaryNote_en: z.string().optional(),
  platingInstructions_en: z.string().optional(),

  displayName_hi: z.string().optional(),
  formalName_hi: z.string().optional(),
  shortDescription_hi: z.string().optional(),
  story_hi: z.string().optional(),
  culinaryNote_hi: z.string().optional(),
  platingInstructions_hi: z.string().optional(),

  dietaryTags: z.array(z.string()).default([]),
  allergenAlerts: z.array(z.string()).default([]),
  seasonalAvailability: z.array(z.string()).default([]),
  equipmentNeeded: z.array(z.string()).default([]),

  spiceLevel: z.coerce.number().min(0).default(1),
  skillLevel: z.coerce.number().min(1).max(5).default(1),
  volume_scale_factor: z.coerce.number().min(0.1).max(1).default(0.2),

  totalCookTimeMinutes: z.coerce.number().min(0).default(45),
  calories: z.coerce.number().min(0).optional(),
  protein_grams: z.coerce.number().min(0).optional(),
  carbs_grams: z.coerce.number().min(0).optional(),
  fat_grams: z.coerce.number().min(0).optional(),
  baseIngredientCost: z.coerce.number().min(0).optional(),
  suggestedCustomerPrice: z.coerce.number().min(0).optional(),
  cookPayout: z.coerce.number().min(0).optional(),
  popularityScore: z.coerce.number().min(0).optional(),
  version: z.coerce.number().min(1).default(1),

  heroImageUrl: z.string().url().or(z.literal('')).optional(),
  videoUrl: z.string().url().or(z.literal('')).optional(),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(instructionSchema).default([]),
});

export type DishFormValues = z.infer<typeof dishSchema>;

interface AddDishFormProps {
    dish?: Dish;
}

export function AddDishForm({ dish }: AddDishFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [tsvData, setTsvData] = React.useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const isEditMode = !!dish;

  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: dish ? { ...dish } : {
      displayName_en: '',
      formalName_en: '',
      cuisine: '',
      course: '',
      isActive: true,
      shortDescription_en: '',
      story_en: '',
      culinaryNote_en: '',
      platingInstructions_en: '',
      displayName_hi: '',
      formalName_hi: '',
      shortDescription_hi: '',
      story_hi: '',
      culinaryNote_hi: '',
      platingInstructions_hi: '',
      dietaryTags: [],
      allergenAlerts: [],
      seasonalAvailability: [],
      equipmentNeeded: [],
      spiceLevel: 1,
      skillLevel: 1,
      volume_scale_factor: 0.2,
      version: 1,
      heroImageUrl: '',
      videoUrl: '',
      ingredients: [],
      instructions: [],
      calories: 0,
      protein_grams: 0,
      carbs_grams: 0,
      fat_grams: 0,
      baseIngredientCost: 0,
      suggestedCustomerPrice: 0,
      cookPayout: 0,
      popularityScore: 0,
      totalCookTimeMinutes: 45,
    },
  });

  const { watch, formState: { isSubmitting } } = form;
  const instructions = watch('instructions');
  const heroImageUrl = watch('heroImageUrl');

  const timeSummary = React.useMemo(() => {
    if (!instructions) return { active: 0, passive: 0, prep: 0 };
    return instructions.reduce((acc, instruction) => {
        const time = instruction.timeMinutes || 0;
        if(instruction.time_category === 'ACTIVE') {
            acc.active += time;
        } else if (instruction.time_category === 'PASSIVE') {
            acc.passive += time;
        } else if (instruction.time_category === 'PRE_PREP') {
            acc.prep += time;
        }
        return acc;
    }, { active: 0, passive: 0, prep: 0 });
  }, [instructions]);

  React.useEffect(() => {
      form.setValue('totalCookTimeMinutes', timeSummary.active + timeSummary.passive, { shouldDirty: true });
  }, [timeSummary, form]);

  const handleImageSelect = (image: { name: string; url: string }) => {
    form.setValue('heroImageUrl', image.url, { shouldDirty: true });
    if (!form.getValues('displayName_en')) {
        form.setValue('displayName_en', image.name, { shouldDirty: true });
    }
    setIsPickerOpen(false);
  };

  const onSubmit = async (data: DishFormValues) => {
    if (!firestore) return;

    if (isEditMode) {
        const dishRef = doc(firestore, 'dishes', dish.id);
        const updatedDish: Dish = {
            ...dish,
            ...data,
        };
        setDocumentNonBlocking(dishRef, updatedDish);
        toast({
            title: 'Dish Updated',
            description: `${data.displayName_en} has been updated.`,
        });
    } else {
        const dishesCollectionRef = collection(firestore, 'dishes');
        const newDishRef = doc(dishesCollectionRef);
        const newDish: Dish = {
            ...data,
            id: newDishRef.id,
            heroImageUrl: data.heroImageUrl || `https://picsum.photos/seed/${newDishRef.id}/600/400`,
        };
        addDocumentNonBlocking(newDishRef, newDish);
        toast({
            title: 'Dish Added',
            description: `${data.displayName_en} has been added to the playbook.`,
        });
    }
    
    router.push('/admin/dishes');
  };

  const handleDelete = async () => {
    if (!firestore || !dish) return;
    setIsDeleting(true);
    try {
        const dishRef = doc(firestore, 'dishes', dish.id);
        await deleteDoc(dishRef);
        toast({
            title: 'Dish Deleted',
            description: `${dish.displayName_en} has been permanently removed.`,
            variant: 'default',
        });
        router.push('/admin/dishes');
    } catch(e: any) {
        console.error("Delete failed:", e);
        toast({
            title: 'Deletion Failed',
            description: e.message || "Could not delete the dish.",
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <>
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dish Playbook
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Dish' : 'Create New Dish'}</CardTitle>
          <CardDescription>
            {isEditMode 
                ? 'Update the details for this dish.' 
                : 'Fill out the form to add a new dish to the playbook.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-headline">Dish Details</h3>
                        <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel>Active</FormLabel>
                            </FormItem>
                        )}
                        />
                    </div>
                    
                    <h4 className="font-semibold text-muted-foreground">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="displayName_en" render={({ field }) => (
                            <FormItem><FormLabel>Display Name (EN)</FormLabel><FormControl><Input placeholder="e.g., Butter Chicken" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="displayName_hi" render={({ field }) => (
                            <FormItem><FormLabel>Display Name (HI)</FormLabel><FormControl><Input placeholder="e.g., बटर चिकन" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="formalName_en" render={({ field }) => (
                            <FormItem><FormLabel>Formal Name (EN)</FormLabel><FormControl><Input placeholder="e.g., Murgh Makhani" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="formalName_hi" render={({ field }) => (
                            <FormItem><FormLabel>Formal Name (HI)</FormLabel><FormControl><Input placeholder="e.g., मुर्ग मखनी" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="cuisine" render={({ field }) => (
                            <FormItem><FormLabel>Cuisine</FormLabel><FormControl><Input placeholder="e.g., North Indian" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="course" render={({ field }) => (
                            <FormItem><FormLabel>Course</FormLabel><FormControl><Input placeholder="e.g., Main" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    
                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Descriptions & Story</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="shortDescription_en" render={({ field }) => (
                            <FormItem><FormLabel>Short Description (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="shortDescription_hi" render={({ field }) => (
                            <FormItem><FormLabel>Short Description (HI)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="story_en" render={({ field }) => (
                            <FormItem><FormLabel>Story (EN)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="story_hi" render={({ field }) => (
                            <FormItem><FormLabel>Story (HI)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="culinaryNote_en" render={({ field }) => (
                            <FormItem><FormLabel>Culinary Note (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="culinaryNote_hi" render={({ field }) => (
                            <FormItem><FormLabel>Culinary Note (HI)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Classifications & Tags</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField name="spiceLevel" render={({ field }) => (
                            <FormItem><FormLabel>Spice Level (0-5)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="skillLevel" render={({ field }) => (
                            <FormItem><FormLabel>Skill Level (1-5)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="volume_scale_factor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Volume Scaling Factor: {field.value}</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={0.1}
                                            max={1}
                                            step={0.1}
                                            defaultValue={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Volume scaling logic for larger households.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="dietaryTags" render={({ field }) => (
                            <FormItem><FormLabel>Dietary Tags</FormLabel><FormControl><TagInput {...field} placeholder="Add tag..." /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="allergenAlerts" render={({ field }) => (
                            <FormItem><FormLabel>Allergen Alerts</FormLabel><FormControl><TagInput {...field} placeholder="Add allergen..." /></FormControl></FormItem>
                        )} />
                        <FormField name="equipmentNeeded" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Equipment Needed</FormLabel><FormControl><TagInput {...field} placeholder="Add equipment (e.g. Mixer, Oven)..." /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Ingredients</h4>
                    <FormField
                        control={form.control}
                        name="ingredients"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <IngredientsManager value={field.value || []} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Instructions</h4>
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <InstructionsManager value={field.value || []} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="rounded-lg border p-4 space-y-2 bg-secondary/30">
                        <h4 className="font-medium flex items-center gap-2"><Clock className="h-5 w-5" />Time Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <p><strong>Active Time:</strong> {timeSummary.active} mins</p>
                            <p><strong>Passive Time:</strong> {timeSummary.passive} mins</p>
                            <p><strong>Total Billable:</strong> {timeSummary.active + timeSummary.passive} mins</p>
                        </div>
                    </div>


                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Nutrition (Optional)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <FormField name="calories" render={({ field }) => (
                            <FormItem><FormLabel>Calories</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="protein_grams" render={({ field }) => (
                            <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="carbs_grams" render={({ field }) => (
                            <FormItem><FormLabel>Carbs (g)</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="fat_grams" render={({ field }) => (
                            <FormItem><FormLabel>Fat (g)</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    
                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Pricing (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField name="baseIngredientCost" render={({ field }) => (
                            <FormItem><FormLabel>Base Ingredient Cost</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="suggestedCustomerPrice" render={({ field }) => (
                            <FormItem><FormLabel>Suggested Customer Price</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="cookPayout" render={({ field }) => (
                            <FormItem><FormLabel>Cook Payout</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Media & Plating</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="heroImageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hero Image URL</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" onClick={() => setIsPickerOpen(true)}>
                                        <FolderSearch className="h-4 w-4" />
                                    </Button>
                                </div>
                                {heroImageUrl && (
                                    <div className="p-2 border rounded-md">
                                        <Image src={heroImageUrl} alt="Selected hero image" width={120} height={80} className="h-20 w-30 object-cover rounded-sm" />
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="videoUrl" render={({ field }) => (
                            <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="platingInstructions_en" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Plating Instructions (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="platingInstructions_hi" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Plating Instructions (HI)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditMode ? 'Update Dish' : 'Add Dish'}
                      </Button>

                      {isEditMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                              Delete Dish
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Yes, delete dish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
    <ImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onImageSelect={handleImageSelect}
    />
    </>
  );
}
