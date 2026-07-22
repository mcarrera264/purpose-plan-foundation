
CREATE OR REPLACE FUNCTION public.accept_ai_suggestion(_suggestion_id uuid, _edited_title text DEFAULT NULL::text, _edited_description text DEFAULT NULL::text, _edited_estimate text DEFAULT NULL::text)
 RETURNS TABLE(task_id uuid, already_accepted boolean, duplicate boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_sug public.ai_suggestions%ROWTYPE;
  v_batch public.ai_suggestion_batches%ROWTYPE;
  v_project_id UUID;
  v_parent_id UUID;
  v_area_id UUID;
  v_depth INT;
  v_title TEXT;
  v_desc TEXT;
  v_estimate TEXT;
  v_final_desc TEXT;
  v_new_task_id UUID;
  v_norm TEXT;
  v_dup BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_sug FROM public.ai_suggestions WHERE id = _suggestion_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'suggestion not found'; END IF;

  SELECT * INTO v_batch FROM public.ai_suggestion_batches WHERE id = v_sug.batch_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'batch not found'; END IF;
  IF v_batch.user_id <> v_uid THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF v_sug.status = 'accepted' AND v_sug.result_task_id IS NOT NULL THEN
    RETURN QUERY SELECT v_sug.result_task_id, true, false;
    RETURN;
  END IF;
  IF v_sug.status = 'rejected' THEN
    RAISE EXCEPTION 'suggestion rejected';
  END IF;

  v_title := btrim(COALESCE(_edited_title, v_sug.title));
  IF v_title IS NULL OR length(v_title) = 0 THEN
    RAISE EXCEPTION 'empty title';
  END IF;
  v_desc := COALESCE(_edited_description, v_sug.description);
  v_estimate := COALESCE(_edited_estimate, v_sug.estimate::text);
  v_final_desc := COALESCE(v_desc, CASE WHEN v_estimate IS NOT NULL THEN 'Estimación: ' || v_estimate END);

  IF v_batch.capability = 'generate_project_tasks' THEN
    v_project_id := v_batch.project_id;
    v_parent_id := NULL;
    IF v_project_id IS NULL THEN RAISE EXCEPTION 'batch has no project'; END IF;
    SELECT area_id INTO v_area_id FROM public.projects WHERE id = v_project_id AND user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'project not found'; END IF;
    v_depth := 0;
  ELSE
    v_parent_id := COALESCE(v_batch.parent_task_id, v_batch.task_id);
    IF v_parent_id IS NULL THEN RAISE EXCEPTION 'batch has no parent task'; END IF;
    SELECT project_id, area_id, depth INTO v_project_id, v_area_id, v_depth
      FROM public.tasks WHERE id = v_parent_id AND user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'parent task not found'; END IF;
    IF v_depth >= 2 THEN RAISE EXCEPTION 'max depth reached'; END IF;
    v_depth := v_depth + 1;
  END IF;

  v_norm := lower(regexp_replace(v_title, '\s+', ' ', 'g'));
  IF v_parent_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE parent_task_id = v_parent_id
        AND status <> 'archived'
        AND lower(regexp_replace(title, '\s+', ' ', 'g')) = v_norm
    ) INTO v_dup;
  ELSIF v_project_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE project_id = v_project_id
        AND parent_task_id IS NULL
        AND status <> 'archived'
        AND lower(regexp_replace(title, '\s+', ' ', 'g')) = v_norm
    ) INTO v_dup;
  END IF;

  IF v_dup THEN
    RETURN QUERY SELECT NULL::UUID, false, true;
    RETURN;
  END IF;

  INSERT INTO public.tasks (user_id, title, description, area_id, project_id, parent_task_id, status, origin)
  VALUES (v_uid, v_title, v_final_desc, v_area_id, v_project_id, v_parent_id, 'todo', 'ai')
  RETURNING id INTO v_new_task_id;

  UPDATE public.ai_suggestions
     SET status = 'accepted',
         accepted_at = now(),
         result_task_id = v_new_task_id,
         edited_title = _edited_title,
         edited_description = _edited_description
   WHERE id = _suggestion_id;

  RETURN QUERY SELECT v_new_task_id, false, false;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.accept_ai_suggestion(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_ai_suggestion(uuid, text, text, text) TO authenticated;
