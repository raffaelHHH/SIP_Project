-- =====================================================================
-- Kaki Outdoors – database schema (Supabase / PostgreSQL)
--
-- How to use: Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to run once on a new project.
--
-- Security: every table has Row Level Security (RLS). Parents can only
-- read/change their own rows. Your team sees everything in the
-- dashboard (Table Editor / SQL Editor), which bypasses RLS.
-- =====================================================================

-- ---------- 1. Profiles (one per account) ----------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text check (char_length(display_name) <= 40),
  child_age_group text check (child_age_group in ('2-4', '5-8', '9-12')),
  neighbourhood   text check (char_length(neighbourhood) <= 40),
  lang            text check (lang in ('en', 'zh', 'ms', 'ta')),
  consent_at      timestamptz not null default now(),  -- PDPA: when they agreed
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Create the profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 40));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. Saved places & activities (the ♡ button) -------------
create table public.saved_items (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('spot', 'activity')),
  item_id    text not null check (char_length(item_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

alter table public.saved_items enable row level security;

create policy "Read own saved" on public.saved_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own saved" on public.saved_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Remove own saved" on public.saved_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- 3. Activity log ("We did this!") -------------------------
create table public.activity_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_id text not null check (char_length(activity_id) <= 80),
  done_on     date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, activity_id, done_on)
);

alter table public.activity_log enable row level security;

create policy "Read own log" on public.activity_log
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own log" on public.activity_log
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------- 4. Feedback (Help screen smileys + comment) --------------
-- Guests can send feedback too (user_id is empty for them).
create table public.feedback (
  id          text primary key check (char_length(id) between 4 and 20),  -- made on the phone
  user_id     uuid references auth.users (id) on delete set null,
  device_id   text check (char_length(device_id) <= 20),
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '' check (char_length(comment) <= 500),
  lang        text check (char_length(lang) <= 5),
  age_group   text check (char_length(age_group) <= 5),
  app_version text check (char_length(app_version) <= 20),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Anyone can send feedback" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- ---------- 5. Usage events (anonymous impact measurement) -----------
create table public.usage_events (
  id          bigint generated always as identity primary key,
  device_id   text not null check (char_length(device_id) <= 20),
  user_id     uuid references auth.users (id) on delete set null,
  event       text not null check (event in ('app_open', 'spot_view', 'go_there', 'activity_done')),
  item_id     text check (char_length(item_id) <= 80),
  occurred_at timestamptz not null check (occurred_at < now() + interval '1 day'),
  received_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create policy "Anyone can send usage events" on public.usage_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create index usage_events_occurred_idx on public.usage_events (occurred_at);

-- ---------- 6. Places suggested by parents (pins) --------------------
-- New pins start as 'pending'. Your team changes status to 'approved'
-- in the Table Editor; approved pins then appear for everyone.
create table public.place_suggestions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 2 and 80),
  category    text not null check (category in ('playground', 'park', 'garden', 'library', 'cc', 'event')),
  lat         double precision not null check (lat between 1.15 and 1.48),     -- inside Singapore
  lng         double precision not null check (lng between 103.6 and 104.1),
  features    text[] not null default '{}'
              check (features <@ array['sheltered', 'toilet', 'lit', 'awayFromRoad', 'fenced', 'water', 'wheelchair']),
  note        text not null default '' check (char_length(note) <= 300),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.place_suggestions enable row level security;

create policy "See approved places and own suggestions" on public.place_suggestions
  for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()));
create policy "Suggest a place" on public.place_suggestions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

-- ---------- 7. Ratings & tips on places ------------------------------
-- One per parent per place. Your team can hide a tip by ticking `hidden`.
create table public.place_reviews (
  id         uuid primary key default gen_random_uuid(),
  spot_id    text not null check (char_length(spot_id) <= 80),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  tip        text not null default '' check (char_length(tip) <= 200),
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

alter table public.place_reviews enable row level security;

create policy "Read visible reviews and own" on public.place_reviews
  for select to anon, authenticated
  using (not hidden or user_id = (select auth.uid()));
create policy "Add own review" on public.place_reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()) and not hidden);
create policy "Edit own review" on public.place_reviews
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Parents may only change their rating/tip, never `hidden` or ownership.
revoke update on public.place_reviews from anon, authenticated;
grant update (rating, tip, updated_at) on public.place_reviews to authenticated;

create index place_reviews_spot_idx on public.place_reviews (spot_id);

-- ---------- 8. "Delete my account" (PDPA) ----------------------------
-- Deletes the login and, through `on delete cascade`, their profile,
-- saved items, activity log, suggestions and reviews. Feedback and
-- usage events are kept but become anonymous (user_id set to empty).
create function public.delete_my_account()
returns void
language sql
security definer set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- 9. Reports for the project team --------------------------
-- In a separate schema that the app (and the public) can't reach.
-- Use them in the SQL Editor, e.g.  select * from reports.weekly_summary;
create schema reports;
revoke all on schema reports from public, anon, authenticated;

create view reports.weekly_summary as
select
  date_trunc('week', occurred_at)::date                     as week,
  count(distinct device_id)                                  as active_phones,
  count(distinct user_id)                                    as active_accounts,
  count(*) filter (where event = 'app_open')                 as app_opens,
  count(*) filter (where event = 'spot_view')                as spot_views,
  count(*) filter (where event = 'go_there')                 as go_there_taps,
  count(*) filter (where event = 'activity_done')            as activities_done
from public.usage_events
group by 1
order by 1 desc;

create view reports.return_visits as
select device_id,
       count(distinct occurred_at::date)     as days_used,
       count(distinct occurred_at::date) - 1 as return_visits,
       min(occurred_at)::date                as first_seen,
       max(occurred_at)::date                as last_seen
from public.usage_events
where event = 'app_open'
group by device_id
order by days_used desc;

create view reports.popular_activities as
select item_id as activity_id, count(*) as times_done, count(distinct device_id) as phones
from public.usage_events
where event = 'activity_done'
group by 1
order by 2 desc;

create view reports.popular_spots as
select item_id as spot_id,
       count(*) filter (where event = 'spot_view') as views,
       count(*) filter (where event = 'go_there')  as go_there_taps
from public.usage_events
where event in ('spot_view', 'go_there')
group by 1
order by 2 desc;

create view reports.feedback_summary as
select count(*) as responses,
       round(avg(rating), 2) as avg_rating,
       count(*) filter (where rating >= 4) as positive,
       count(*) filter (where rating <= 2) as negative,
       count(*) filter (where comment <> '') as with_comment
from public.feedback;

create view reports.pending_places as
select id, name, category, lat, lng, features, note, created_at
from public.place_suggestions
where status = 'pending'
order by created_at;
