-- =====================================================================
-- RLS (Row Level Security) 정책
-- 원칙:
--  - 모든 테이블 RLS 활성화
--  - 조회는 가능한 폭넓게(공개), 변경은 본인/권한자만
--  - admin 권한은 profiles.role 검사 함수로 판별
-- =====================================================================

-- 권한 헬퍼
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_verified(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and verified = true);
$$;

-- ─────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles 본인 조회"
  on public.profiles for select
  using (auth.uid() = id or is_admin(auth.uid()));

create policy "profiles 본인 갱신"
  on public.profiles for update
  using (auth.uid() = id);

-- INSERT는 트리거에서만 발생 (handle_new_user)
-- DELETE는 auth.users CASCADE

-- ─────────────────────────────────────────────────────────────────────
-- proposals
-- ─────────────────────────────────────────────────────────────────────
alter table public.proposals enable row level security;

create policy "proposals 공개 조회"
  on public.proposals for select
  using (status <> 'draft' or author_id = auth.uid() or is_admin(auth.uid()));

create policy "proposals 거주확인자 작성"
  on public.proposals for insert
  with check (author_id = auth.uid() and is_verified(auth.uid()));

create policy "proposals 본인 수정"
  on public.proposals for update
  using (author_id = auth.uid() or is_admin(auth.uid()));

create policy "proposals 본인/관리자 삭제"
  on public.proposals for delete
  using (author_id = auth.uid() or is_admin(auth.uid()));

-- proposal_upvotes
alter table public.proposal_upvotes enable row level security;
create policy "upvotes 조회" on public.proposal_upvotes for select using (true);
create policy "upvotes 본인 등록" on public.proposal_upvotes for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));
create policy "upvotes 본인 취소" on public.proposal_upvotes for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- surveys / questions / responses
-- ─────────────────────────────────────────────────────────────────────
alter table public.surveys enable row level security;
create policy "surveys 공개 조회" on public.surveys for select using (status <> 'draft' or is_admin(auth.uid()));
create policy "surveys 관리자 작성" on public.surveys for insert with check (is_admin(auth.uid()));
create policy "surveys 관리자 수정" on public.surveys for update using (is_admin(auth.uid()));
create policy "surveys 관리자 삭제" on public.surveys for delete using (is_admin(auth.uid()));

alter table public.questions enable row level security;
create policy "questions 조회" on public.questions for select using (true);
create policy "questions 관리자 변경" on public.questions for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

alter table public.responses enable row level security;
create policy "responses 본인/관리자 조회" on public.responses for select
  using (user_id = auth.uid() or is_admin(auth.uid()));
create policy "responses 거주확인자 응답" on public.responses for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));
-- responses는 수정/삭제 불가 (감사 추적)

-- ─────────────────────────────────────────────────────────────────────
-- votes / vote_ballots
-- ─────────────────────────────────────────────────────────────────────
alter table public.votes enable row level security;
create policy "votes 공개 조회" on public.votes for select using (true);
create policy "votes 관리자 변경" on public.votes for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

alter table public.vote_ballots enable row level security;
create policy "ballots 본인/관리자 조회" on public.vote_ballots for select
  using (user_id = auth.uid() or is_admin(auth.uid()));
create policy "ballots 거주확인자 투표" on public.vote_ballots for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));
-- 투표 수정/삭제 불가 (감사)

-- ─────────────────────────────────────────────────────────────────────
-- projects / members
-- ─────────────────────────────────────────────────────────────────────
alter table public.projects enable row level security;
create policy "projects 공개 조회" on public.projects for select using (true);
create policy "projects 관리자 변경" on public.projects for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

alter table public.project_members enable row level security;
create policy "project_members 조회" on public.project_members for select using (true);
create policy "project_members 본인 참여" on public.project_members for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));
create policy "project_members 본인 탈퇴" on public.project_members for delete
  using (user_id = auth.uid() or is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- comments
-- ─────────────────────────────────────────────────────────────────────
alter table public.comments enable row level security;
create policy "comments 공개 조회" on public.comments for select using (true);
create policy "comments 거주확인자 작성" on public.comments for insert
  with check (author_id = auth.uid() and is_verified(auth.uid()));
create policy "comments 본인 수정" on public.comments for update using (author_id = auth.uid());
create policy "comments 본인/관리자 삭제" on public.comments for delete
  using (author_id = auth.uid() or is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- rewards
-- ─────────────────────────────────────────────────────────────────────
alter table public.rewards enable row level security;
create policy "rewards 본인/관리자 조회" on public.rewards for select
  using (user_id = auth.uid() or is_admin(auth.uid()));
-- rewards 적립은 Server Action(service role) 또는 트리거에서만 수행

-- ─────────────────────────────────────────────────────────────────────
-- sensor_data (공개 데이터)
-- ─────────────────────────────────────────────────────────────────────
alter table public.sensor_data enable row level security;
create policy "sensor 공개 조회" on public.sensor_data for select using (true);
-- 적재는 service role에서만
