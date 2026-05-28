import { ProjectCreateForm } from './_components/ProjectCreateForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Admin · 새 과제' };

export default function NewProjectPage() {
  return (
    <div className="container max-w-2xl py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>실증과제 등록</CardTitle>
          <CardDescription>5단계 사이클 (발굴→정의→실험→실증→확산)을 따릅니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
