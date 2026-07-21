
-- 1) Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions in public schema
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.areas_enforce_ownership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.projects_validate_relations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tasks_validate_relations() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.initialize_current_user(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_ai_suggestion(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon;

-- Grant only to authenticated (guest anonymous auth users are also 'authenticated' role)
GRANT EXECUTE ON FUNCTION public.initialize_current_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_ai_suggestion(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account_data() TO authenticated;
