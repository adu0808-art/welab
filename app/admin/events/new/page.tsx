import { EventCreateForm } from './_components/EventCreateForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Admin · 새 행사' };

export default function NewEventPage() {
  return (
    <div className="container max-w-2xl py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>새 행사 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <EventCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
