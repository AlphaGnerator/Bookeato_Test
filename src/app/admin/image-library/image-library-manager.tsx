'use client';

import { useState, useRef } from 'react';
import { useFirebaseApp, useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy, setDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, uploadString } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ImagePlus, Trash2, Loader2, Image as ImageIcon, Copy, Upload, Beaker, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';


interface UploadedImage {
  id: string;
  name: string;
  url: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | string | null;
}

export function ImageLibraryManager() {
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagesCollectionRef = useMemoFirebase(() => {
    if (firestore) {
      return query(collection(firestore, 'uploadedImages'), orderBy('createdAt', 'desc'));
    }
    return null;
  }, [firestore]);

  const { data: images, isLoading, error } = useCollection<UploadedImage>(imagesCollectionRef);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const files = Array.from(event.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if(imageFiles.length !== files.length) {
             toast({
                title: "Invalid File Type",
                description: "Some selected files were not valid images and have been ignored.",
                variant: "destructive",
            });
        }
        setSelectedFiles(imageFiles);
    }
  };
  
  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: 'No Files Selected', description: 'Please select one or more image files to upload.', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    setUploadProgress(0);
    
    const totalFiles = selectedFiles.length;
    let filesUploaded = 0;

    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const imageName = file.name.split('.').slice(0, -1).join('.');
          const newDocId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const imgDoc = {
            id: newDocId,
            name: imageName,
            url: dataUrl,
            createdAt: new Date().toISOString()
          };

          if (firestore) {
            try {
              await setDoc(doc(firestore, 'uploadedImages', newDocId), imgDoc);
            } catch (e) {}
          }

          // Also save in localStorage cache
          try {
            const cached = JSON.parse(localStorage.getItem('bookeato_admin_images') || '[]');
            localStorage.setItem('bookeato_admin_images', JSON.stringify([imgDoc, ...cached]));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}

          filesUploaded++;
          setUploadProgress((filesUploaded / totalFiles) * 100);
          if (filesUploaded === totalFiles) {
            setIsAdding(false);
            setSelectedFiles([]);
            toast({ title: 'Images Uploaded', description: `Successfully added ${totalFiles} image(s) to Admin Image Library.` });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDeleteImage = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'uploadedImages', id));
    toast({ title: 'Image Removed', description: 'The image has been removed from your library.', variant: 'destructive' });
  };
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'URL Copied!', description: 'The image URL is now in your clipboard.' });
  }

  const handleAddTestImage = async () => {
    if (!user) {
        toast({ title: 'Authentication Required', description: 'You must be logged in to run this test.', variant: 'destructive' });
        return;
    }
    if (!firestore || !firebaseApp) {
      toast({
        title: 'Services Not Ready',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }
    setIsTesting(true);
    try {
        const storage = getStorage(firebaseApp);
        // A tiny 1x1 red pixel GIF
        const tinyGif = 'data:image/gif;base64,R0lGODlhAQABAIABAP8AAP///yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        const imageRef = storageRef(storage, `test-uploads/${uuidv4()}.gif`);

        // Upload the tiny gif
        await uploadString(imageRef, tinyGif, 'data_url');
        const downloadURL = await getDownloadURL(imageRef);

        // Add record to firestore
        const newDocRef = doc(collection(firestore, 'uploadedImages'));
        await setDoc(newDocRef, {
            name: `Test Upload - ${new Date().toLocaleTimeString()}`,
            url: downloadURL,
            createdAt: serverTimestamp()
        });

        toast({ title: 'Test Upload Successful!', description: 'A test image was successfully uploaded and added to the library.' });

    } catch (e: any) {
        console.error("Test upload failed:", e);
        toast({
            title: "Test Upload Failed",
            description: `Error: ${e.code} - ${e.message}`,
            variant: "destructive"
        });
    } finally {
        setIsTesting(false);
    }
  }
  
  const formatCreatedAt = (createdAt: UploadedImage['createdAt']) => {
    if (!createdAt) return 'just now';
    if (typeof createdAt === 'object' && createdAt !== null && 'seconds' in createdAt) {
        return formatDistanceToNow(new Date(createdAt.seconds * 1000), { addSuffix: true });
    }
    if (typeof createdAt === 'string') {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
            return formatDistanceToNow(date, { addSuffix: true });
        }
    }
    return 'a few moments ago';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Image(s)</CardTitle>
            <CardDescription>Select one or more image files from your computer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageFile">Image File(s)</Label>
               <Input
                id="imageFile"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            
            {selectedFiles.length > 0 && (
                <div className="space-y-2 text-xs text-muted-foreground p-2 border rounded-md max-h-40 overflow-y-auto">
                    <p className="font-bold mb-1">Selected Files ({selectedFiles.length}):</p>
                    {selectedFiles.map(file => (
                        <div key={file.name} className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                    ))}
                </div>
            )}
            
            {isAdding && (
                <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-center text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
            )}

            <Button onClick={handleUploadClick} disabled={isAdding || selectedFiles.length === 0} className="w-full bg-orange-600 hover:bg-orange-700 font-bold">
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} to Library
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Image Repository & Preset Bank</CardTitle>
            <CardDescription>Central vault for product photos, promotional banners, and custom uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Local & Remote Images Grid */}
                {(() => {
                  const displayImages = [
                    ...(images || []),
                    { id: 'p1', name: 'Fresh Tender Coconut Water Bottle', url: '/live_menu/bookeato_coconut_glass_bottle.jpg' },
                    { id: 'p2', name: 'Overnight Protein Oats Glass Jar', url: '/live_menu/bookeato_oats_glass_jar.jpg' },
                    { id: 'p3', name: 'Customizable Organic Salad Box', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop' },
                    { id: 'p4', name: 'Indori Poha Special', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop' },
                    { id: 'p5', name: 'Sprout Protein Salad Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop' }
                  ];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayImages.map((img) => (
                        <div key={img.id} className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
                          <div className="h-36 w-full relative bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-stone-900 block truncate">{img.name}</span>
                            <span className="text-[10px] text-stone-400 font-medium block truncate">{img.url}</span>
                          </div>
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(img.url);
                              toast({ title: 'URL Copied', description: 'Copied image URL to clipboard!' });
                            }} 
                            variant="secondary" 
                            className="w-full text-xs font-bold h-8 rounded-xl"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Image Link
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
