import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: '페이지를 찾을 수 없습니다' };

export default function NotFound() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold text-brand-primary">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        주소를 다시 확인해주세요.
      </p>
      <Link
        href="/"
        className={`${buttonVariants({ size: 'default' })} mt-6`}
      >
        홈으로
      </Link>
    </main>
  );
}
