import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getProject } from '@/lib/db/queries/projects';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinButton } from '../_components/JoinButton';
import { CommentSection } from '@/components/features/comments/CommentSection';
import { formatDate, formatNumber } from '@/lib/utils';
import type { ProjectStage } from '@/lib/db/types';

export const preferredRegion = 'hnd1';

const STAGES: ProjectStage[] = ['discover', 'define', 'develop', 'deploy', 'diffuse'];
const STAGE_LABEL: Record<ProjectStage, string> = {
  discover: '발굴',
  define: '정의',
  develop: '실험',
  deploy: '실증',
  diffuse: '확산',
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const profile = await getCurrentProfile();
  const canJoin = !!profile?.verified;
  const currentStageIdx = STAGES.indexOf(project.stage);

  return (
    <div className="container py-6 sm:py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge>{STAGE_LABEL[project.stage]}</Badge>
        <Badge variant="outline">
          예산 {formatNumber(project.budget)}원
        </Badge>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-brand-primary sm:text-3xl">
        {project.title}
      </h1>
      {project.summary && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
          {project.summary}
        </p>
      )}

      {/* 단계 인디케이터 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>진행 단계</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex w-full items-center justify-between">
            {STAGES.map((s, i) => {
              const active = i <= currentStageIdx;
              return (
                <li key={s} className="relative flex flex-1 flex-col items-center">
                  <span
                    className={
                      active
                        ? 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white'
                        : 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground'
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className={
                      active
                        ? 'mt-1 text-xs font-medium text-brand-primary'
                        : 'mt-1 text-xs text-muted-foreground'
                    }
                  >
                    {STAGE_LABEL[s]}
                  </span>
                  {i < STAGES.length - 1 && (
                    <span
                      className={
                        i < currentStageIdx
                          ? 'absolute left-1/2 top-4 -z-0 h-px w-full bg-brand-primary'
                          : 'absolute left-1/2 top-4 -z-0 h-px w-full bg-border'
                      }
                    />
                  )}
                </li>
              );
            })}
          </ol>
          {(project.starts_on || project.ends_on) && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {project.starts_on ? formatDate(project.starts_on) : '미정'} ~{' '}
              {project.ends_on ? formatDate(project.ends_on) : '미정'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 참여 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>참여 ({formatNumber(project.members.length)}명)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {project.members.slice(0, 12).map((m) => (
              <span
                key={m.user_id}
                className="rounded-full bg-brand-light px-3 py-1 text-xs text-brand-primary"
              >
                {m.nickname}
                {m.role !== 'member' && ` (${m.role})`}
              </span>
            ))}
            {project.members.length === 0 && (
              <p className="text-sm text-muted-foreground">
                첫 참여자가 되어주세요.
              </p>
            )}
          </div>
          {!profile ? (
            <Link
              href={`/login?next=/projects/${project.id}`}
              className="text-sm font-medium text-brand-primary underline"
            >
              로그인 후 참여 →
            </Link>
          ) : (
            <JoinButton
              projectId={project.id}
              initialJoined={project.joined_by_me}
              canJoin={canJoin}
            />
          )}
        </CardContent>
      </Card>

      <CommentSection
        targetType="project"
        targetId={project.id}
        loginNext={`/projects/${project.id}`}
      />
    </div>
  );
}
