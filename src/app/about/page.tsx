
import { AppLayout } from '@/components/app-layout';
import { LandingHeader } from '@/components/landing-header';

export default function AboutPage() {
  return (
    <>
      <LandingHeader />
      <AppLayout pageTitle="About Us">
        <div className="container mx-auto py-24 pt-32">
          <div className="text-center">
            <h1 className="font-headline text-4xl md:text-5xl">About Bookeato</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              We are passionate about connecting talented cooks with people who love great food.
            </p>
          </div>
          <div className="mt-12 max-w-4xl mx-auto space-y-6 text-center">
            <p>
                Our mission is to make home-cooked meals accessible and enjoyable for everyone. Whether you're a busy professional, a family looking for healthy options, or simply someone who appreciates a good meal, Bookeato brings the joy of personalized cooking right to your kitchen.
            </p>
            <p>
                For cooks, we provide a platform to showcase your skills, manage your own schedule, and build a base of happy customers. We believe in empowering culinary talent and helping chefs turn their passion into a profession.
            </p>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
