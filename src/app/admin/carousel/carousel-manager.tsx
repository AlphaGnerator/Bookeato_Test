'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Images, PlusCircle, Trash2, Loader2, Image as ImageIcon, Sparkles, FolderSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ImagePicker } from '@/app/admin/image-library/image-picker';


interface CarouselImage {
  id: string;
  title: string;
  imageUrl: string;
}

const defaultCarouselImages = [
    {
        title: "Gajar Ka Halwa",
        imageUrl: "https://images.unsplash.com/photo-1628189508545-df9314467c64?q=80&w=1080&auto=format&fit=crop",
    },
    {
        title: "Rajma Chawal",
        imageUrl: "https://images.unsplash.com/photo-1606491589023-0b63e0b484a7?q=80&w=1080&auto=format&fit=crop",
    },
    {
        title: "Sarson ka Saag & Makki ki Roti",
        imageUrl: "https://images.unsplash.com/photo-1598514983318-76c8a2a96934?q=80&w=1080&auto=format&fit=crop",
    }
]

export function CarouselManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const carouselImagesRef = useMemoFirebase(() => {
    if (firestore) {
      return collection(firestore, 'carouselImages');
    }
    return null;
  }, [firestore]);

  const { data: images, isLoading, error } = useCollection<CarouselImage>(carouselImagesRef);

  const handleAddImage = async () => {
    if (!newTitle || !newImageUrl) {
      toast({ title: 'Missing Information', description: 'Please provide a title and select an image.', variant: 'destructive' });
      return;
    }
    if (!firestore) return;

    setIsAdding(true);
    try {
        const newImage = { title: newTitle, imageUrl: newImageUrl };
        await addDocumentNonBlocking(collection(firestore, 'carouselImages'), newImage);
        toast({ title: 'Image Added', description: 'The new image has been added to the carousel.' });
        setNewTitle('');
        setNewImageUrl('');
    } catch(e: any) {
        toast({ title: 'Error Adding Image', description: e.message, variant: 'destructive'});
    } finally {
        setIsAdding(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!firestore) return;
    try {
        const docRef = doc(firestore, 'carouselImages', id);
        await deleteDoc(docRef);
        toast({ title: 'Image Removed', description: 'The image has been removed from the carousel.', variant: 'default' });
    } catch(e: any) {
        console.error("Error removing image: ", e);
        toast({ title: 'Error Removing Image', description: e.message, variant: 'destructive'});
    }
  };

  const handleSeedImages = async () => {
    if (!firestore || !carouselImagesRef) {
        toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive'});
        return;
    }
    setIsSeeding(true);
    try {
        const batch = writeBatch(firestore);

        const existingDocsSnapshot = await getDocs(carouselImagesRef);
        existingDocsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        defaultCarouselImages.forEach(image => {
            const docRef = doc(carouselImagesRef);
            batch.set(docRef, image);
        });

        await batch.commit();

        toast({ title: 'Carousel Seeded!', description: `Carousel has been reset with ${defaultCarouselImages.length} default images.`});
    } catch (e: any) {
        console.error("Seeding failed: ", e);
        toast({ title: 'Seeding Failed', description: e.message, variant: 'destructive'});
    } finally {
        setIsSeeding(false);
    }
  }

  const handleImageSelect = (image: { name: string; url: string }) => {
    setNewTitle(image.name);
    setNewImageUrl(image.url);
    setIsPickerOpen(false);
    toast({
        title: "Image Selected",
        description: `${image.name} is ready to be added.`
    });
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Carousel Image</CardTitle>
            <CardDescription>Select an image from your library.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Image Title</Label>
              <Input
                id="title"
                placeholder="e.g., Fresh Summer Salad"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Button variant="outline" className="w-full justify-start text-left" onClick={() => setIsPickerOpen(true)}>
                <FolderSearch className="mr-2 h-4 w-4" />
                {newImageUrl ? 'Change Image' : 'Select from Library...'}
              </Button>
               {newImageUrl && (
                <div className="p-2 border rounded-md flex items-center gap-2 text-sm">
                    <Image src={newImageUrl} alt="Selected image" width={40} height={40} className="h-10 w-10 object-cover rounded-sm" />
                    <span className="truncate text-muted-foreground">{newImageUrl}</span>
                </div>
            )}
            </div>
            <Button onClick={handleAddImage} disabled={isAdding || !newTitle || !newImageUrl} className="w-full">
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Image
            </Button>
            <Button onClick={handleSeedImages} disabled={isSeeding} variant="outline" className="w-full">
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Seed Carousel with Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Carousel Images</CardTitle>
            <CardDescription>These images are currently active on the landing page carousel.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : images && images.length > 0 ? (
              <div className="space-y-4">
                {images.map((image) => (
                  <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg bg-secondary/30">
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      width={100}
                      height={100}
                      className="rounded-md object-cover w-24 h-24"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold">{image.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.imageUrl}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteImage(image.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <ImageIcon className="h-4 w-4" />
                <AlertTitle>No Images Found</AlertTitle>
                <AlertDescription>Add an image using the form to get started, or seed with defaults.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
     <ImagePicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onImageSelect={handleImageSelect}
    />
    </>
  );
}
