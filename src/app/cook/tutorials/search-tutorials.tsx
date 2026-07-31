'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Youtube, BookText, ExternalLink, TriangleAlert, Video } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { searchTutorials, type SearchTutorialsOutput } from '@/ai/flows/search-tutorials-flow';
import Link from 'next/link';

export function SearchTutorials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<SearchTutorialsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setHasSearched(true);
    setError(null);
    setResults(null);

    startTransition(async () => {
      try {
        const response = await searchTutorials({ query: searchTerm });
        if (response?.videoTutorials || response?.textTutorials) {
          setResults(response);
        } else {
          setError("Couldn't find any tutorials. Try a different search term.");
        }
      } catch (e) {
        console.error(e);
        setError("An unexpected error occurred while searching. Please try again later.");
      }
    });
  };
  
  const slugify = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g., 'How to make pasta carbonara'"
          className="h-12 text-lg"
          disabled={isPending}
        />
        <Button type="submit" size="lg" variant="accent" disabled={isPending}>
          {isPending ? <><Search className="mr-2 animate-pulse" /> Searching...</> : <><Search className="mr-2" /> Search</>}
        </Button>
      </form>

      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-5 w-5/6" />
                        <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        </div>
      ) : error ? (
          <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Search Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      ) : results ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div>
                <h2 className="font-headline text-3xl flex items-center gap-2 mb-6">
                    <Video className="h-7 w-7 text-primary" />
                    Video Tutorials
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.videoTutorials?.length > 0 ? results.videoTutorials.map((tutorial) => (
                    <Card key={tutorial.videoUrl} className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                        <Link href={`/cook/tutorials/${slugify(tutorial.title)}`}>
                            <div className="relative aspect-video">
                                <Image
                                    src={tutorial.thumbnailUrl}
                                    alt={tutorial.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 text-white p-1 rounded-full bg-black/50">
                                    <Youtube className="h-5 w-5" />
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold line-clamp-2">{tutorial.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{tutorial.channel}</p>
                                <p className="text-xs text-muted-foreground mt-2">{tutorial.views} views</p>
                            </CardContent>
                        </Link>
                    </Card>
                )) : <p className="text-muted-foreground col-span-2">No video tutorials found.</p>}
                </div>
            </div>
            <div>
                 <h2 className="font-headline text-3xl flex items-center gap-2 mb-6">
                    <BookText className="h-7 w-7 text-primary" />
                    Recipes & Articles
                </h2>
                <div className="space-y-4">
                    {results.textTutorials?.length > 0 ? results.textTutorials.map((tutorial) => (
                         <Card key={tutorial.url} className="transition-shadow hover:shadow-lg">
                             <Link href={`/cook/tutorials/${slugify(tutorial.title)}`}>
                                <CardHeader>
                                    <CardTitle className="text-xl">{tutorial.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        {tutorial.sourceName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 italic">"{tutorial.snippet}"</p>
                                </CardContent>
                            </Link>
                        </Card>
                    )) : <p className="text-muted-foreground">No text tutorials found.</p>}
                </div>
            </div>
        </div>
      ) : hasSearched ? (
        <Alert>
            <Youtube className="h-4 w-4" />
            <AlertTitle>No Tutorials Found</AlertTitle>
            <AlertDescription>
                We couldn't find any tutorials matching your search. Please try a different term.
            </AlertDescription>
        </Alert>
      ) : (
            <div className="md:col-span-2 lg:col-span-3">
            <Alert>
                <Search className="h-4 w-4" />
                <AlertTitle>Search for a Recipe</AlertTitle>
                <AlertDescription>
                    Enter a dish or technique in the search bar to find video and text tutorials.
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}
