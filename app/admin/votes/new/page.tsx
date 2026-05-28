import { VoteCreateForm } from './_components/VoteCreateForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Admin · 새 투표' };

export default function NewVotePage() {
  return (
    <div className="container max-w-2xl py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>새 투표 발행</CardTitle>
          <CardDescription>
            단일·다중·찬반 투표를 즉시 게시합니다. 발행 직후 사용자에게 노출됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoteCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
