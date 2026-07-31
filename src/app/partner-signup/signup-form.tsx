'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Phone, User, ArrowRight, ChefHat, Sparkles, SprayCan, Check, Baby, HeartHandshake, Briefcase, Camera } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from "@/components/loading-state";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Image from 'next/image';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: "Please select your gender.",
  }),
  documentType: z.enum(['Aadhaar', 'PAN', 'Voter ID', 'Other'], {
    required_error: "Please select a document type.",
  }),
  documentNumber: z.string().min(4, 'Please enter a valid document number.'),
});

export function PartnerSignUpForm() {
    const { auth, firestore, storage } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    
    const [step, setStep] = useState<1 | 2>(1);
    const [serviceType, setServiceType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
    
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentPreview, setDocumentPreview] = useState<string | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setIsPhotoMenuOpen(false);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setDocumentFile(file);
            setDocumentPreview(URL.createObjectURL(file));
        }
    };

    const serviceOptions = [
        { id: 'maid', title: 'Maid', desc: 'Cleaning Professional', Icon: SprayCan },
        { id: 'cook', title: 'Cook', desc: 'Culinary Professional', Icon: ChefHat },
        { id: 'child_care', title: 'Child Care', desc: 'Nanny / Babysitter', Icon: Baby },
        { id: 'elderly_care', title: 'Elderly Care', desc: 'Senior Assistance', Icon: HeartHandshake },
        { id: 'other', title: 'Other', desc: 'General House Help', Icon: Briefcase },
    ];

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', phoneNumber: '', gender: undefined, documentType: undefined, documentNumber: '' },
    });

    const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
        if (!firestore || !auth || !serviceType) return;

        setIsLoading(true);
        try {
            // Sign in anonymously to get a valid UID for Firestore permissions
            const userCredential = await signInAnonymously(auth);
            const uid = userCredential.user.uid;
            const fullPhone = `+91${values.phoneNumber}`;
            
            let photoUrl = '';
            if (photoFile && storage) {
                const storageRef = ref(storage, `partner-photos/${uid}`);
                await uploadBytes(storageRef, photoFile);
                photoUrl = await getDownloadURL(storageRef);
            }

            let documentUrl = '';
            if (documentFile && storage) {
                const documentRef = ref(storage, `partner-documents/${uid}`);
                await uploadBytes(documentRef, documentFile);
                documentUrl = await getDownloadURL(documentRef);
            }
            
            const profile = {
                id: uid,
                name: values.name,
                contactNumber: fullPhone,
                status: 'pending',
                joinedDate: new Date().toISOString(),
                createdAt: serverTimestamp(),
                type: serviceType,
                gender: values.gender,
                documentType: values.documentType,
                documentNumber: values.documentNumber,
                photoUrl: photoUrl || null,
                documentUrl: documentUrl || null,
            };

            const collectionName = ['maid', 'cook'].includes(serviceType) ? `${serviceType}s` : 'other_services';
            await setDoc(doc(firestore, collectionName, uid), profile);

            toast({ 
                title: 'Application Submitted', 
                description: `Your ${serviceType} profile is under review. Our team will contact you soon.` 
            });
            
            if (['maid', 'cook'].includes(serviceType)) {
                router.push(`/${serviceType}/pending`);
            } else {
                router.push('/partner-signup/pending');
            }
        } catch (error: any) {
            console.error('Profile creation failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="w-full max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tight text-stone-900">Join Bookeato</h2>
                        <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Step 1: Select your service</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-2 font-bold h-10 px-6 mt-1">
                                Login
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl font-bold">
                            <DropdownMenuItem onClick={() => router.push('/cook/login')} className="cursor-pointer">Login as Cook</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/maid/login')} className="cursor-pointer">Login as Maid</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Portal in development', description: 'The partner portal for other services is coming soon.' })} className="cursor-pointer">Other Services Login</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {serviceOptions.map((option) => (
                        <button 
                            key={option.id}
                            onClick={() => setServiceType(option.id)}
                            className={cn(
                                "relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-[2rem] border-4 transition-all duration-300 group",
                                serviceType === option.id 
                                    ? "border-stone-900 bg-stone-50 scale-[1.02] shadow-xl shadow-stone-200" 
                                    : "border-stone-100 bg-white hover:border-stone-200"
                            )}
                        >
                            <div className="relative w-16 h-16 mb-2 flex items-center justify-center rounded-[1.5rem] bg-stone-100 text-stone-700 group-hover:scale-110 group-hover:bg-stone-200 transition-transform duration-500">
                                <option.Icon className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-stone-900">{option.title}</h3>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{option.desc}</p>
                            </div>
                            {serviceType === option.id && (
                                <div className="absolute top-3 right-3 bg-stone-900 text-white p-1 rounded-full">
                                    <Check className="w-3 h-3" strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <Button 
                    disabled={!serviceType}
                    onClick={() => setStep(2)}
                    className="w-full h-16 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xl shadow-xl disabled:opacity-30 transition-all"
                >
                    Continue <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
            </div>
        );
    }

    return (
    <>
      {isLoading && <LoadingState fullPage type={['maid', 'cook'].includes(serviceType as string) ? (serviceType as 'maid'|'cook') : 'generic'} message="Submitting your application..." />}
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    className="text-stone-400 font-bold hover:text-stone-900 mb-4"
                >
                    ← Back to selection
                </Button>
                <div className="mx-auto w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 mb-4">
                    {(() => {
                        const SelectedIcon = serviceOptions.find(o => o.id === serviceType)?.Icon || Sparkles;
                        return <SelectedIcon className="w-8 h-8" />;
                    })()}
                </div>
                <h2 className="text-3xl font-black tracking-tight">Tell us about you</h2>
                <p className="text-sm text-muted-foreground font-medium">Join as a {serviceOptions.find(o => o.id === serviceType)?.title.toLowerCase() || serviceType} today.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsPhotoMenuOpen(!isPhotoMenuOpen)}
                            className="relative w-24 h-24 rounded-full border-4 border-stone-100 bg-stone-50 flex items-center justify-center overflow-hidden hover:border-stone-200 transition-colors focus:outline-none"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Selfie preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-stone-300" />
                            )}
                        </button>
                        
                        {isPhotoMenuOpen && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="rounded-xl border-2 font-bold">
                                    <Camera className="w-4 h-4 mr-2" /> Camera
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} className="rounded-xl border-2 font-bold">
                                    <User className="w-4 h-4 mr-2" /> Gallery
                                </Button>
                            </div>
                        )}
                        
                        {!isPhotoMenuOpen && (
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">
                                Upload Photo <br/>(or take a Selfie)
                            </p>
                        )}
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="user"
                            onChange={handlePhotoChange}
                            ref={cameraInputRef}
                            className="hidden"
                        />
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange}
                            ref={galleryInputRef}
                            className="hidden"
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your full name" className="h-14 rounded-2xl border-2 border-stone-100 font-bold px-5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Phone Number</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-4 bg-stone-50 rounded-2xl text-sm font-black border-2 border-stone-100">
                                            +91
                                        </div>
                                        <Input placeholder="10-digit number" className="h-14 rounded-2xl border-2 border-stone-100 font-bold px-5" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500 text-center block">Gender</FormLabel>
                                <FormControl>
                                    <div className="flex gap-4">
                                        {['Male', 'Female', 'Other'].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => field.onChange(option)}
                                                className={cn(
                                                    "flex-1 h-12 rounded-xl border-2 font-bold transition-all",
                                                    field.value === option 
                                                        ? "border-stone-900 bg-stone-900 text-white" 
                                                        : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                                                )}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Document Verification Section */}
                    <div className="space-y-6 pt-6 mt-6 border-t-2 border-stone-100">
                        <div className="text-center space-y-1">
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Identity Verification</h3>
                            <p className="text-xs text-stone-400 font-bold">Please provide your ID details</p>
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="documentType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500 text-center block">Document Type</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Aadhaar', 'PAN', 'Voter ID', 'Other'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => field.onChange(option)}
                                                    className={cn(
                                                        "h-12 rounded-xl border-2 font-bold transition-all text-xs",
                                                        field.value === option 
                                                            ? "border-stone-900 bg-stone-900 text-white" 
                                                            : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                                                    )}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="documentNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Document Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter ID number" className="h-14 rounded-2xl border-2 border-stone-100 font-bold px-5 uppercase" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-3">
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Document Photo</FormLabel>
                            <button 
                                type="button"
                                onClick={() => documentInputRef.current?.click()}
                                className="relative w-full h-40 rounded-2xl border-4 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center overflow-hidden hover:border-stone-300 hover:bg-stone-100 transition-colors focus:outline-none"
                            >
                                {documentPreview ? (
                                    <img src={documentPreview} alt="Document preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-stone-400">
                                        <Camera className="w-8 h-8" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Tap to Upload ID</span>
                                    </div>
                                )}
                            </button>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleDocumentChange}
                                ref={documentInputRef}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg shadow-xl" disabled={isLoading}>
                        Submit Application <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </Form>

            <div className="pt-8 text-center border-t border-stone-50">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Already a partner?</p>
                <Button variant="link" className="text-stone-900 font-black h-auto p-0 mt-1" onClick={() => {
                    if (['maid', 'cook'].includes(serviceType as string)) {
                        router.push(`/${serviceType}/login`);
                    } else {
                        toast({ title: 'Portal in development', description: 'The partner portal for this service is coming soon.' });
                    }
                }}>
                    Go to Partner Login
                </Button>
            </div>
        </div>
    </>
  );
}
