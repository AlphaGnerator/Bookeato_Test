import { AppLayout } from '@/components/app-layout';
import { SearchTutorials } from './search-tutorials';

export default function CookTutorialsPage() {
  return (
    <AppLayout pageTitle="Dish Tutorials">
      <div className="space-y-8">
        <div className="text-center">
            <h1 className="font-headline text-4xl md:text-5xl">Find Your Next Recipe</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Search for tutorials on thousands of dishes to hone your skills and expand your repertoire.
            </p>
        </div>
        <SearchTutorials />
      </div>
    </AppLayout>
  );
}
