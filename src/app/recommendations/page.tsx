import { AppLayout } from '@/components/app-layout';
import { MealIdeasGenerator } from './meal-ideas-generator';
import { SlotRecommender } from './slot-recommender';
import { Separator } from '@/components/ui/separator';

export default function RecommendationsPage() {
  return (
    <AppLayout pageTitle="AI Recommendations">
      <div className="space-y-12">
        <MealIdeasGenerator />
        <Separator className="my-8"/>
        <SlotRecommender />
      </div>
    </AppLayout>
  );
}
