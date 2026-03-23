'use client';

import { useState, useRef } from 'react';
import { useFirebaseApp, useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentByPathNonBlocking } from '@/firebase';
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

  const { data: images, isLoading, error, refetch: refetchImages } = useCollection<UploadedImage>(imagesCollectionRef);

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
    if (!user) {
        toast({ title: 'Authentication Required', description: 'You must be logged in to upload images.', variant: 'destructive' });
        return;
    }
    if (selectedFiles.length === 0) {
        toast({ title: 'No Files Selected', description: 'Please select one or more image files to upload.', variant: 'destructive' });
        return;
    }
    if (!firebaseApp || !firestore) return;

    setIsAdding(true);
    setUploadProgress(0);
    
    const storage = getStorage(firebaseApp);
    const totalFiles = selectedFiles.length;
    let filesUploaded = 0;

    const uploadPromises = selectedFiles.map(file => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const imageRef = storageRef(storage, `images/${uniqueFileName}`);
        const imageName = file.name.split('.').slice(0, -1).join('.');

        return uploadBytesResumable(imageRef, file).then(uploadTaskSnapshot => 
            getDownloadURL(uploadTaskSnapshot.ref).then(downloadURL => {
                filesUploaded++;
                setUploadProgress((filesUploaded / totalFiles) * 100);
                return { 
                    name: imageName, 
                    url: downloadURL,
                    createdAt: serverTimestamp() 
                };
            })
        );
    });

    try {
        const uploadedImagesData = await Promise.all(uploadPromises);

        // Batch write to Firestore
        const batch = writeBatch(firestore);
        const imagesCollection = collection(firestore, 'uploadedImages');
        uploadedImagesData.forEach(imageData => {
            const newDocRef = doc(imagesCollection);
            batch.set(newDocRef, imageData);
        });
        await batch.commit();

        toast({ title: 'Upload Successful!', description: `${uploadedImagesData.length} image(s) have been added to your library.` });

        // Reset form
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        refetchImages();

    } catch (e: any) {
        console.error("Upload or Firestore write failed:", e);
        toast({ 
            title: "Upload Failed", 
            description: `An error occurred: ${e.message}`, 
            variant: "destructive" 
        });
    } finally {
        setIsAdding(false);
        setUploadProgress(0);
    }
  };


  const handleDeleteImage = (id: string) => {
    if (!firestore) return;
    deleteDocumentByPathNonBlocking(firestore, `uploadedImages/${id}`);
    toast({ title: 'Image Removed', description: 'The image has been removed from your library.', variant: 'destructive' });
    refetchImages();
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
        refetchImages();

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

            <Button onClick={handleUploadClick} disabled={isUserLoading || !user || isAdding || selectedFiles.length === 0} className="w-full">
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} to Library
            </Button>
             <Button onClick={handleAddTestImage} variant="outline" className="w-full" disabled={isUserLoading || !user || isTesting}>
                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Beaker className="mr-2 h-4 w-4" />}
                Run Upload Test
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Image Library</CardTitle>
            <CardDescription>A central place for all your application's images.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Error Loading Library</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : images && images.length > 0 ? (
              <div className="space-y-4">
                {images.map((image) => (
                  <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg bg-secondary/30">
                    <Image
                      src={image.url}
                      alt={image.name}
                      width={100}
                      height={100}
                      className="rounded-md object-cover w-24 h-24 bg-muted"
                    />
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold">{image.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.url}</p>
                       <p className="text-xs text-muted-foreground mt-1">
                        Added {formatCreatedAt(image.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleCopyUrl(image.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteImage(image.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <ImagePlus className="h-4 w-4" />
                <AlertTitle>Your Library is Empty</AlertTitle>
                <AlertDescription>Add an image using the form to get started.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
