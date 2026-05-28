-- =====================================================================
-- 댓글 좋아요 (중복 방지)
-- =====================================================================

create table public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

create policy "comment_likes 조회"
  on public.comment_likes for select using (true);

create policy "comment_likes 거주확인자 등록"
  on public.comment_likes for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));

create policy "comment_likes 본인 취소"
  on public.comment_likes for delete
  using (user_id = auth.uid());

-- comments.likes 동기화 트리거
create or replace function public.sync_comment_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes = likes + 1 where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments set likes = greatest(likes - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comment_likes_sync_ins on public.comment_likes;
create trigger comment_likes_sync_ins
  after insert on public.comment_likes
  for each row execute function public.sync_comment_likes();

drop trigger if exists comment_likes_sync_del on public.comment_likes;
create trigger comment_likes_sync_del
  after delete on public.comment_likes
  for each row execute function public.sync_comment_likes();
