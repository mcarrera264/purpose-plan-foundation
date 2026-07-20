
-- =========================
-- Enums
-- =========================
CREATE TYPE public.project_status AS ENUM ('active','completed','archived');
CREATE TYPE public.task_status AS ENUM ('todo','done','archived');
CREATE TYPE public.task_origin AS ENUM ('manual','ai');
CREATE TYPE public.ai_batch_status AS ENUM ('pending','completed','failed');
CREATE TYPE public.ai_suggestion_status AS ENUM ('pending','accepted','rejected');

-- =========================
-- Shared updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- areas
-- =========================
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  system_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT areas_system_key_unique UNIQUE (user_id, system_key)
);
CREATE INDEX areas_user_id_idx ON public.areas(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas_select_own" ON public.areas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "areas_insert_own" ON public.areas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "areas_update_own" ON public.areas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "areas_delete_own" ON public.areas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER areas_set_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- projects
-- =========================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'active',
  start_date DATE,
  target_date DATE,
  estimated_duration INTERVAL,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_area_id_idx ON public.projects(area_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- tasks
-- =========================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  scheduled_date DATE,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0,
  origin public.task_origin NOT NULL DEFAULT 'manual',
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_depth_range CHECK (depth IN (0,1,2)),
  CONSTRAINT tasks_schedule_order CHECK (
    scheduled_start IS NULL OR scheduled_end IS NULL OR scheduled_end >= scheduled_start
  )
);
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX tasks_area_id_idx ON public.tasks(area_id);
CREATE INDEX tasks_parent_task_id_idx ON public.tasks(parent_task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- ai_suggestion_batches (scaffold)
-- =========================
CREATE TABLE public.ai_suggestion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  status public.ai_batch_status NOT NULL DEFAULT 'pending',
  model TEXT,
  prompt_version TEXT,
  schema_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_batches_user_id_idx ON public.ai_suggestion_batches(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_suggestion_batches TO authenticated;
GRANT ALL ON public.ai_suggestion_batches TO service_role;
ALTER TABLE public.ai_suggestion_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_batches_select_own" ON public.ai_suggestion_batches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_batches_insert_own" ON public.ai_suggestion_batches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_batches_update_own" ON public.ai_suggestion_batches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_batches_delete_own" ON public.ai_suggestion_batches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================
-- ai_suggestions (scaffold)
-- =========================
CREATE TABLE public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.ai_suggestion_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimate INTERVAL,
  smart_rationale TEXT,
  status public.ai_suggestion_status NOT NULL DEFAULT 'pending',
  result_task_id UUID UNIQUE REFERENCES public.tasks(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_suggestions_batch_id_idx ON public.ai_suggestions(batch_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_suggestions TO authenticated;
GRANT ALL ON public.ai_suggestions TO service_role;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Owner via parent batch
CREATE POLICY "ai_suggestions_select_own" ON public.ai_suggestions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ai_suggestion_batches b WHERE b.id = batch_id AND b.user_id = auth.uid())
  );
CREATE POLICY "ai_suggestions_insert_own" ON public.ai_suggestions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_suggestion_batches b WHERE b.id = batch_id AND b.user_id = auth.uid())
  );
CREATE POLICY "ai_suggestions_update_own" ON public.ai_suggestions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ai_suggestion_batches b WHERE b.id = batch_id AND b.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_suggestion_batches b WHERE b.id = batch_id AND b.user_id = auth.uid())
  );
CREATE POLICY "ai_suggestions_delete_own" ON public.ai_suggestions
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ai_suggestion_batches b WHERE b.id = batch_id AND b.user_id = auth.uid())
  );

CREATE TRIGGER ai_suggestions_set_updated_at
  BEFORE UPDATE ON public.ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- Idempotent bootstrap: profile + 4 default areas
-- =========================
CREATE OR REPLACE FUNCTION public.initialize_current_user(
  p_display_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (v_uid, p_display_name)
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = now();

  INSERT INTO public.areas (user_id, name, color, is_system, position, system_key)
  VALUES
    (v_uid, 'Carrera',  '#D1D1FF', true, 0, 'career'),
    (v_uid, 'Salud',    '#D4F3DC', true, 1, 'health'),
    (v_uid, 'Finanzas', '#FFCDAC', true, 2, 'finance'),
    (v_uid, 'Social',   '#FCBADC', true, 3, 'social')
  ON CONFLICT (user_id, system_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_current_user(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.initialize_current_user(TEXT) TO authenticated;
