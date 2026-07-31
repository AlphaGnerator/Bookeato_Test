
'use client';
import { useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, List, ChefHat, AlertTriangle, Info, BookOpen, UserCircle, MapPin, Calendar, PlayCircle, Check, Hourglass, Phone, ArrowLeft, Upload, Soup, Award } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Booking, UserProfile, Dish } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function BookingDetailsCard({ booking }: { booking: Booking | null }) {
    if (!booking) {
        return <Skeleton className="h-56 w-full" />
    }

    const { customerName, customerAddress, customerPincode, customerContact, bookingDate, items } = booking;
    const dishes = items || [];

    return (
        <Card className="bg-primary/5 h-full">
            <CardHeader>
                <CardTitle className="text-xl">Booking Details</CardTitle>
                <CardDescription>Details for your upcoming session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <UserCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">Customer:</span>
                        <span>{customerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">Location:</span>
                        <span>{customerAddress || 'Not specified'}, {customerPincode || '--'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">Contact:</span>
                        <span>{customerContact || 'Not Provided'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">When:</span>
                        <span>{bookingDate ? format(new Date(bookingDate), 'EEE, MMM d, h:mm a') : 'N/A'}</span>
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="font-medium flex items-center gap-3 mb-2">
                        <Soup className="h-5 w-5 text-primary" />
                        Dishes to Prepare
                    </h4>
                    <ul className="space-y-1 list-disc pl-5 text-sm text-muted-foreground">
                        {dishes.map(dish => <li key={dish.dishId}>{dish.dishName}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

function SessionStatusCard() {
    const { toast } = useToast();
    const [status, setStatus] = useState<'not-started' | 'in-progress' | 'upload-proof' | 'completed'>('not-started');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isEarningsDialogOpen, setIsEarningsDialogOpen] = useState(false);
    
    // Placeholder for actual earnings
    const sessionEarnings = 250; 

    const handleStartCooking = () => {
        setStatus('in-progress');
        toast({
            title: 'Cooking Started!',
            description: 'The customer has been notified that you are on your way.',
        });
    };
    
    const handleEndCooking = () => {
        setStatus('upload-proof');
        toast({
            title: 'Session Ready to Complete',
            description: 'Please upload a photo of the final dish.',
            variant: 'default',
        });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    }

    const handleConfirmUpload = async () => {
        if (!selectedFile) {
            toast({ title: 'No File Selected', description: 'Please select an image to upload.', variant: 'destructive'});
            return;
        }

        // Simulate upload
        const simulateUpload = () => new Promise<void>(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                setUploadProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 300);
        });

        await simulateUpload();
        
        setStatus('completed');
        toast({
            title: 'Session Completed!',
            description: 'Thank you for your hard work. The session is now marked as complete.',
            variant: 'default',
        });
        
        // Open the earnings dialog
        setIsEarningsDialogOpen(true);
    }


    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Session Status</CardTitle>
                    <CardDescription>Update the session status as you proceed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
                        <div className="flex items-center gap-2">
                            {status === 'not-started' && <Clock className="h-5 w-5 text-muted-foreground" />}
                            {status === 'in-progress' && <Hourglass className="h-5 w-5 text-blue-500 animate-spin" />}
                            {status === 'upload-proof' && <Upload className="h-5 w-5 text-accent" />}
                            {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            <span className="font-medium capitalize">
                                {status.replace('-', ' ')}
                            </span>
                        </div>
                    </div>

                    {status === 'not-started' && (
                         <Button className="w-full" onClick={handleStartCooking}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Start Cooking
                        </Button>
                    )}
                     {status === 'in-progress' && (
                         <Button className="w-full" onClick={handleEndCooking}>
                            <Check className="mr-2 h-4 w-4" /> Mark as Complete
                        </Button>
                    )}
                    {status === 'upload-proof' && (
                        <div className="space-y-4 pt-4 border-t">
                            <Label htmlFor="dish-photo">Upload Proof of Dish</Label>
                            <Input id="dish-photo" type="file" accept="image/*" onChange={handleFileChange} />
                            {uploadProgress > 0 && <Progress value={uploadProgress} />}
                            <Button className="w-full" variant="accent" onClick={handleConfirmUpload} disabled={!selectedFile || uploadProgress > 0}>
                                <Check className="mr-2 h-4 w-4" /> Confirm & Complete
                            </Button>
                        </div>
                    )}
                     {status === 'completed' && (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Session successfully completed!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={isEarningsDialogOpen} onOpenChange={setIsEarningsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                            <Award className="h-10 w-10 text-green-600" />
                        </div>
                        <AlertDialogTitle className="text-2xl">Session Complete!</AlertDialogTitle>
                        <AlertDialogDescription>
                            Great job! Your earnings for this session have been added to your wallet.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">You Earned</p>
                        <p className="text-5xl font-bold text-primary">₹{sessionEarnings.toLocaleString()}</p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsEarningsDialogOpen(false)} className="w-full">
                            Awesome!
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function DishTutorialCard({ dish, language }: { dish: Dish; language: 'english' | 'telugu' }) {
    const { videoUrl, ingredients, instructions } = dish;

    const specialInstructions = (instructions || [])
        .map(inst => inst.specialInstruction)
        .filter((inst): inst is string => !!inst);

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{dish.displayName_en}</CardTitle>
                <CardDescription>Cuisine: {dish.cuisine} | Course: {dish.course}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <span className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5" /> Cooking Instructions</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            {videoUrl && (
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden border mb-4">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={videoUrl.replace('watch?v=', 'embed/')}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                </div>
                            )}
                            <ol className="space-y-4">
                            {(instructions || []).sort((a,b) => a.stepNumber - b.stepNumber).map((step, index) => (
                                <li key={index} className="flex items-start gap-4">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                                    {step.stepNumber}
                                </div>
                                <p className="pt-1">{language === 'telugu' && step.instruction_hi ? step.instruction_hi : step.instruction_en}</p>
                                </li>
                            ))}
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>
                             <span className="flex items-center gap-2 text-lg font-semibold"><List className="h-5 w-5" /> Ingredients</span>
                        </AccordionTrigger>
                        <AccordionContent>
                             <ul className="space-y-2 text-muted-foreground columns-2">
                              {(ingredients || []).map((item, index) => (
                                 <li key={index} className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-primary rounded-full" />
                                    <span>{item.quantity} {item.unit} {item.name}</span>
                                </li>
                              ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                     {specialInstructions.length > 0 && (
                         <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <span className="flex items-center gap-2 text-lg font-semibold"><Info className="h-5 w-5" /> Special Notes</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-3">
                                    {specialInstructions.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 p-3 rounded-md bg-secondary/30 border border-border">
                                            <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                     )}
                </Accordion>
            </CardContent>
        </Card>
    );
}

export default function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const bookingId = slug;
    const customerId = searchParams.get('customerId');
    
    const [language, setLanguage] = useState<'english' | 'telugu'>('english');
    
    const bookingRef = useMemoFirebase(() => {
        if (firestore && customerId && bookingId) {
            return doc(firestore, 'customers', customerId, 'bookings', bookingId);
        }
        return null;
    }, [firestore, customerId, bookingId]);

    const { data: booking, isLoading: isBookingLoading } = useDoc<Booking>(bookingRef);

    const allDishesRef = useMemoFirebase(() => firestore ? collection(firestore, 'dishes') : null, [firestore]);
    const { data: allDishes, isLoading: areDishesLoading } = useCollection<Dish>(allDishesRef);

    const handleLanguageToggle = (isChecked: boolean) => {
        setLanguage(isChecked ? 'telugu' : 'english');
    };
    
    const isLoading = isBookingLoading || areDishesLoading;

    if (isLoading) {
        return (
             <AppLayout pageTitle="Loading Session...">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                        <Skeleton className="h-56 w-full" />
                        <Skeleton className="h-56 w-full" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </div>
             </AppLayout>
        )
    }

    if (!booking) {
        return (
            <AppLayout pageTitle="Error">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Booking Not Found</AlertTitle>
                    <AlertDescription>The requested booking could not be found.</AlertDescription>
                </Alert>
            </AppLayout>
        );
    }
    
    const bookingDishes = (booking.items || []).map(item => allDishes?.find(d => d.id === item.dishId)).filter((d): d is Dish => !!d);

  return (
    <AppLayout pageTitle="Cooking Session">
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/cook/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
            <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-4xl capitalize">Your Cooking Session</CardTitle>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="language-toggle">English</Label>
                    <Switch 
                        id="language-toggle" 
                        checked={language === 'telugu'}
                        onCheckedChange={handleLanguageToggle}
                    />
                    <Label htmlFor="language-toggle">Telugu</Label>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <BookingDetailsCard booking={booking} />
            <SessionStatusCard />
        </div>
        
        <div className="space-y-8">
            {bookingDishes.length > 0 ? (
                bookingDishes.map(dish => (
                    <DishTutorialCard key={dish.id} dish={dish} language={language} />
                ))
            ) : (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Dishes Assigned</AlertTitle>
                    <AlertDescription>There are no dishes assigned to this booking.</AlertDescription>
                </Alert>
            )}
        </div>
    </AppLayout>
  );
}
