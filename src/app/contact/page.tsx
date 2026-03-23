
import { AppLayout } from '@/components/app-layout';
import { LandingHeader } from '@/components/landing-header';

export default function ContactPage() {
  return (
    <>
      <LandingHeader />
      <AppLayout pageTitle="Contact Us">
        <div className="container mx-auto py-24 pt-32">
          <div className="text-center">
            <h1 className="font-headline text-4xl md:text-5xl">Get in Touch</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Have questions? We'd love to hear from you.
            </p>
          </div>
          <div className="mt-12 max-w-xl mx-auto text-center">
            <p className="text-lg">
                For support or inquiries, please email us at:
            </p>
            <a href="mailto:support@culinarycanvas.example" className="text-2xl font-bold text-primary hover:underline mt-2 inline-block">
              support@culinarycanvas.example
            </a>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
