import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { BottomNav } from '@/components/shared/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pb-20 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
