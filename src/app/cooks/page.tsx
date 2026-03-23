import { AppLayout } from '@/components/app-layout';
import { CooksList } from './cooks-list';

export default function CooksPage() {
  return (
    <AppLayout pageTitle="Find Your Perfect Cook">
      <div className="space-y-8">
        <div className="text-center">
            <h1 className="font-headline text-4xl md:text-5xl">Meet Our Talented Cooks</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Browse our community of skilled cooks, ready to bring delicious meals to your table.
            </p>
        </div>
        <CooksList />
      </div>
    </AppLayout>
  );
}
