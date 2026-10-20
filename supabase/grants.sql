-- =====================================================================
-- Kaki Outdoors – table permissions for the app.
--
-- Newer Supabase projects don't give the app (the "anon" and
-- "authenticated" roles) access to new tables automatically, so we grant
-- exactly what the app needs. Row Level Security in schema.sql still
-- decides *which rows* each person can see or change.
--
-- Already ran schema.sql before this file existed? Run this file once in
-- the SQL Editor. (New setups: schema.sql already includes it.)
-- Safe to run more than once.
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- Profiles: created by the sign-up trigger; parents read and update their own.
grant select on public.profiles to authenticated;
grant update (display_name, child_age_group, neighbourhood, lang, updated_at) on public.profiles to authenticated;

-- Saved places/activities and activity log: only signed-in parents.
grant select, insert, delete on public.saved_items to authenticated;
grant select, insert on public.activity_log to authenticated;

-- Feedback and usage events: anyone can send, nobody can read back.
grant insert on public.feedback to anon, authenticated;
grant insert on public.usage_events to anon, authenticated;

-- Places suggested by parents: everyone reads (approved only, via RLS); signed-in parents add.
grant select on public.place_suggestions to anon, authenticated;
grant insert (name, category, lat, lng, features, note) on public.place_suggestions to authenticated;

-- Tips & ratings: everyone reads; signed-in parents add and edit their own rating/tip.
grant select on public.place_reviews to anon, authenticated;
grant insert (spot_id, rating, tip) on public.place_reviews to authenticated;
grant update (rating, tip, updated_at) on public.place_reviews to authenticated;

-- Delete my account.
grant execute on function public.delete_my_account() to authenticated;
