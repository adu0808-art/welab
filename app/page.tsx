import Link from 'next/link';
import { ArrowRight, MessageSquareText, Vote, FolderKanban } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/shared/Footer';
import { Header } from '@/components/shared/Header';

export default function LandingPage() {
  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-brand-light to-white">
          <div className="container py-14 sm:py-20">
            <p className="text-sm font-medium text-brand-accent">
              송파 · 성남 · 하남 위례신도시
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-brand-primary sm:text-4xl md:text-5xl">
              주민이 만들고,
              <br />
              데이터로 진화하는
              <br />
              위례 스마트시티
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              위례 거주민이 직접 도시문제를 발굴하고, 설문·투표로 우선순위를
              정하고, 실증과제로 함께 해결하는 리빙랩 플랫폼입니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg', variant: 'default' })}
              >
                지금 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/proposals"
                className={buttonVariants({ size: 'lg', variant: 'outline' })}
              >
                의제 둘러보기
              </Link>
            </div>
          </div>
        </section>

        {/* 핵심 기능 */}
        <section className="container py-14">
          <h2 className="text-xl font-semibold text-brand-primary sm:text-2xl">
            이렇게 참여합니다
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <CardTitle>의제 제안</CardTitle>
                <CardDescription>
                  위치·사진 첨부로 도시문제를 자유롭게 제안하세요.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                  <Vote className="h-5 w-5" />
                </div>
                <CardTitle>설문·투표</CardTitle>
                <CardDescription>
                  단일·예산·순위 등 6종 투표로 우선순위를 결정합니다.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <CardTitle>실증과제</CardTitle>
                <CardDescription>
                  선정 의제는 기업·연구기관과 함께 위례 현장에서 실증합니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* 목표 지표 */}
        <section className="bg-brand-light/40">
          <div className="container py-14">
            <h2 className="text-xl font-semibold text-brand-primary sm:text-2xl">
              3년 목표
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { v: '30,000', l: '누적 가입자' },
                { v: '10,000', l: '월간 활성자' },
                { v: '50종', l: '공개 데이터셋' },
                { v: '30건', l: '실증과제' },
              ].map((m) => (
                <Card key={m.l}>
                  <CardContent className="pt-5">
                    <p className="text-2xl font-bold text-brand-primary">
                      {m.v}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.l}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
