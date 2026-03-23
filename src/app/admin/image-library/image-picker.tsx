'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import type { UploadedImage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ImagePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onImageSelect: (image: { name: string; url: string }) => void;
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
};

export function ImagePicker({ isOpen, onClose, onImageSelect }: ImagePickerProps) {
    const firestore = useFirestore();
    const imagesCollectionRef = useMemoFirebase(() => {
        if (firestore) {
            return query(collection(firestore, 'uploadedImages'), orderBy('createdAt', 'desc'));
        }
        return null;
    }, [firestore]);

    const { data: images, isLoading, error } = useCollection<UploadedImage>(imagesCollectionRef);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select an Image from Your Library</DialogTitle>
                    <DialogDescription>Click on an image to use it.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-1">
                        {isLoading && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-square w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error Loading Images</AlertTitle>
                                <AlertDescription>{error.message}</AlertDescription>
                            </Alert>
                        )}
                        {images && images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map(image => (
                                    <div
                                        key={image.id}
                                        className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                                        onClick={() => onImageSelect({ name: image.name, url: image.url })}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={image.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-bold truncate">{image.name}</p>
                                            <p className="text-xs">{formatCreatedAt(image.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !isLoading && (
                                <Alert>
                                    <ImagePlus className="h-4 w-4" />
                                    <AlertTitle>No Images Found</AlertTitle>
                                    <AlertDescription>
                                        You haven't uploaded any images to your library yet.
                                    </AlertDescription>
                                </Alert>
                            )
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
