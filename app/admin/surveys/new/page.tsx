import { SurveyCreateForm } from './_components/SurveyCreateForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Admin · 새 설문' };

export default function NewSurveyPage() {
  return (
    <div className="container max-w-3xl py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>새 설문 발행</CardTitle>
          <CardDescription>
            문항을 추가해 발행합니다. single·multiple·scale·short/long_text 유형을
            지원합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurveyCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
