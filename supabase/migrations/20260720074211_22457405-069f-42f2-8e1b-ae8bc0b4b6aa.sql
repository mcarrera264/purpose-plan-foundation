
-- Validation trigger for tasks: ownership, project consistency, area consistency, depth derivation, cycles.
CREATE OR REPLACE FUNCTION public.tasks_validate_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_row public.tasks%ROWTYPE;
  cycle_id UUID;
  hops INT := 0;
BEGIN
  -- Enforce ownership via auth.uid()
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'tasks.user_id is required';
  END IF;

  -- Area must belong to user
  IF NEW.area_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.areas a WHERE a.id = NEW.area_id AND a.user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'area_id does not belong to user';
    END IF;
  END IF;

  -- Project must belong to user
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = NEW.project_id AND p.user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'project_id does not belong to user';
    END IF;
  END IF;

  -- Parent checks
  IF NEW.parent_task_id IS NOT NULL THEN
    IF NEW.parent_task_id = NEW.id THEN
      RAISE EXCEPTION 'task cannot be its own parent';
    END IF;
    SELECT * INTO parent_row FROM public.tasks WHERE id = NEW.parent_task_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'parent task not found';
    END IF;
    IF parent_row.user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'parent task does not belong to user';
    END IF;
    -- Project must match parent's project
    IF COALESCE(parent_row.project_id::text, '') <> COALESCE(NEW.project_id::text, '') THEN
      RAISE EXCEPTION 'child task must share the parent project';
    END IF;
    -- Inherit area if not provided
    IF NEW.area_id IS NULL THEN
      NEW.area_id := parent_row.area_id;
    END IF;
    -- Derive depth from parent
    NEW.depth := parent_row.depth + 1;
    IF NEW.depth > 2 THEN
      RAISE EXCEPTION 'max task depth is 2';
    END IF;

    -- Cycle detection: walk up parents
    cycle_id := parent_row.parent_task_id;
    WHILE cycle_id IS NOT NULL AND hops < 10 LOOP
      IF cycle_id = NEW.id THEN
        RAISE EXCEPTION 'task cycle detected';
      END IF;
      SELECT parent_task_id INTO cycle_id FROM public.tasks WHERE id = cycle_id;
      hops := hops + 1;
    END LOOP;
  ELSE
    NEW.depth := 0;
  END IF;

  -- Schedule end must be after start
  IF NEW.scheduled_start IS NOT NULL AND NEW.scheduled_end IS NOT NULL AND NEW.scheduled_end < NEW.scheduled_start THEN
    RAISE EXCEPTION 'scheduled_end cannot be before scheduled_start';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_validate_relations_trg ON public.tasks;
CREATE TRIGGER tasks_validate_relations_trg
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_validate_relations();

-- Projects: enforce ownership + area ownership
CREATE OR REPLACE FUNCTION public.projects_validate_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'projects.user_id is required';
  END IF;
  IF NEW.area_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.areas a WHERE a.id = NEW.area_id AND a.user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'area_id does not belong to user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_validate_relations_trg ON public.projects;
CREATE TRIGGER projects_validate_relations_trg
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_validate_relations();

-- Areas: enforce ownership + prevent removing system areas
CREATE OR REPLACE FUNCTION public.areas_enforce_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system THEN
      RAISE EXCEPTION 'system area cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'areas.user_id is required';
  END IF;
  -- Prevent turning custom areas into system
  IF TG_OP = 'UPDATE' AND OLD.is_system = false AND NEW.is_system = true THEN
    RAISE EXCEPTION 'cannot promote area to system';
  END IF;
  -- Trim name
  NEW.name := btrim(NEW.name);
  IF length(NEW.name) = 0 THEN
    RAISE EXCEPTION 'area name cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS areas_enforce_ownership_trg ON public.areas;
CREATE TRIGGER areas_enforce_ownership_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.areas
FOR EACH ROW EXECUTE FUNCTION public.areas_enforce_ownership();

-- Updated_at triggers (idempotent)
DROP TRIGGER IF EXISTS areas_set_updated_at ON public.areas;
CREATE TRIGGER areas_set_updated_at BEFORE UPDATE ON public.areas
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
