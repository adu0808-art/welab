/**
 * Supabase Database 타입 스켈레톤.
 * 실제 운영에서는 `npm run db:types` 로 자동 생성된 파일을 사용하세요.
 *   supabase gen types typescript --linked > lib/db/types.generated.ts
 *
 * 자동 생성 전까지 이 파일이 최소 타입을 제공합니다.
 */

export type UserRole = 'guest' | 'verified' | 'active' | 'leader' | 'admin';
export type District = 'songpa' | 'seongnam' | 'hanam';
export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed';
export type ProposalCategory =
  | 'traffic'
  | 'environment'
  | 'safety'
  | 'community'
  | 'parenting'
  | 'etc';
export type SurveyStatus = 'draft' | 'open' | 'closed';
export type QuestionType =
  | 'single'
  | 'multiple'
  | 'scale'
  | 'ranking'
  | 'short_text'
  | 'long_text'
  | 'image'
  | 'location'
  | 'slider';
export type VoteType =
  | 'single'
  | 'multiple'
  | 'budget'
  | 'ranking'
  | 'approval'
  | 'weighted';
export type VoteStatus = 'upcoming' | 'open' | 'closed';
export type ProjectStage =
  | 'discover'
  | 'define'
  | 'develop'
  | 'deploy'
  | 'diffuse';
export type CommentTarget = 'proposal' | 'survey' | 'vote' | 'project';
export type RewardKind =
  | 'signup'
  | 'verify'
  | 'proposal'
  | 'survey'
  | 'vote'
  | 'comment'
  | 'event'
  | 'badge';

export type Profile = {
  id: string;
  nickname: string;
  email_hash: string | null;
  district: District | null;
  verified: boolean;
  role: UserRole;
  interests: string[];
  mileage: number;
  created_at: string;
  updated_at: string;
};

export type Proposal = {
  id: string;
  author_id: string;
  category: ProposalCategory;
  title: string;
  body: string;
  attachments: unknown;
  location: unknown | null;
  district: District | null;
  status: ProposalStatus;
  is_anonymous: boolean;
  upvotes: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  starts_at: string;
  ends_at: string;
  target_filter: Record<string, unknown>;
  status: SurveyStatus;
  allow_anonymous: boolean;
  reward_points: number;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  survey_id: string;
  type: QuestionType;
  body: string;
  options: unknown;
  required: boolean;
  position: number;
  logic_jump: unknown | null;
};

export type Response = {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, unknown>;
  is_anonymous: boolean;
  submitted_at: string;
};

export type Vote = {
  id: string;
  title: string;
  description: string | null;
  type: VoteType;
  proposal_id: string | null;
  options: unknown;
  config: Record<string, unknown>;
  starts_at: string;
  ends_at: string;
  status: VoteStatus;
  show_realtime: boolean;
  binding_level: 'reference' | 'advisory' | 'binding';
  created_at: string;
  updated_at: string;
};

export type VoteBallot = {
  id: string;
  vote_id: string;
  user_id: string;
  choice: unknown;
  weight: number;
  hash_chain: string | null;
  cast_at: string;
};

export type Project = {
  id: string;
  source_proposal_id: string | null;
  title: string;
  summary: string | null;
  owner_id: string | null;
  budget: number;
  starts_on: string | null;
  ends_on: string | null;
  stage: ProjectStage;
  outcomes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  target_type: CommentTarget;
  target_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  likes: number;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * createClient<Database> 에 사용되는 최소 타입 정의.
 * 자동 생성 파일이 만들어지면 그쪽을 export 하도록 교체하세요.
 */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; nickname: string }; Update: Partial<Profile> };
      proposals: { Row: Proposal; Insert: Partial<Proposal> & { author_id: string; title: string; body: string }; Update: Partial<Proposal> };
      proposal_upvotes: {
        Row: { proposal_id: string; user_id: string; created_at: string };
        Insert: { proposal_id: string; user_id: string };
        Update: Partial<{ proposal_id: string; user_id: string }>;
      };
      comments: {
        Row: Comment;
        Insert: Partial<Comment> & {
          target_type: CommentTarget;
          target_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Comment>;
      };
      comment_likes: {
        Row: { comment_id: string; user_id: string; created_at: string };
        Insert: { comment_id: string; user_id: string };
        Update: Partial<{ comment_id: string; user_id: string }>;
      };
      surveys: {
        Row: Survey;
        Insert: Partial<Survey> & { title: string; starts_at: string; ends_at: string };
        Update: Partial<Survey>;
      };
      questions: {
        Row: Question;
        Insert: Partial<Question> & { survey_id: string; type: QuestionType; body: string };
        Update: Partial<Question>;
      };
      responses: {
        Row: Response;
        Insert: Partial<Response> & { survey_id: string; user_id: string };
        Update: Partial<Response>;
      };
      votes: {
        Row: Vote;
        Insert: Partial<Vote> & { title: string; type: VoteType; starts_at: string; ends_at: string };
        Update: Partial<Vote>;
      };
      vote_ballots: {
        Row: VoteBallot;
        Insert: Partial<VoteBallot> & { vote_id: string; user_id: string; choice: unknown };
        Update: Partial<VoteBallot>;
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { title: string };
        Update: Partial<Project>;
      };
      project_members: {
        Row: { project_id: string; user_id: string; role: string; joined_at: string };
        Insert: { project_id: string; user_id: string; role?: string };
        Update: Partial<{ project_id: string; user_id: string; role: string }>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string;
          capacity: number;
          status: 'draft' | 'open' | 'closed' | 'done';
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at: string;
          capacity?: number;
          status?: 'draft' | 'open' | 'closed' | 'done';
        };
        Update: Partial<{
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string;
          capacity: number;
          status: 'draft' | 'open' | 'closed' | 'done';
        }>;
      };
      event_registrations: {
        Row: { event_id: string; user_id: string; attended: boolean; created_at: string };
        Insert: { event_id: string; user_id: string };
        Update: Partial<{ attended: boolean }>;
      };
      notices: {
        Row: {
          id: string;
          kind: 'notice' | 'news' | 'faq';
          title: string;
          body: string;
          pinned: boolean;
          published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          kind?: 'notice' | 'news' | 'faq';
          title: string;
          body: string;
          pinned?: boolean;
          published?: boolean;
        };
        Update: Partial<{
          kind: 'notice' | 'news' | 'faq';
          title: string;
          body: string;
          pinned: boolean;
          published: boolean;
        }>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          body: string | null;
          href: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          kind: string;
          title: string;
          body?: string | null;
          href?: string | null;
        };
        Update: Partial<{ read_at: string | null }>;
      };
      badges: {
        Row: { code: string; name: string; description: string | null; icon: string | null; rule: unknown };
        Insert: { code: string; name: string };
        Update: Partial<{ name: string; description: string | null; icon: string | null }>;
      };
      user_badges: {
        Row: { user_id: string; badge_code: string; awarded_at: string };
        Insert: { user_id: string; badge_code: string };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      district: District;
      proposal_status: ProposalStatus;
      proposal_category: ProposalCategory;
      survey_status: SurveyStatus;
      question_type: QuestionType;
      vote_type: VoteType;
      vote_status: VoteStatus;
      project_stage: ProjectStage;
      comment_target: CommentTarget;
      reward_kind: RewardKind;
    };
  };
};
