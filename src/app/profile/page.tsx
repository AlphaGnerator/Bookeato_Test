import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './profile-form';

export default function ProfilePage() {
  return (
    <AppLayout pageTitle="My Profile">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Personalize Your Experience</CardTitle>
          <CardDescription>
            Update your profile to get the best recommendations. Your preferences help us tailor meal ideas and slot suggestions just for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
