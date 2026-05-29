-- Allow authenticated clients and RLS policies to execute the secure role-check function.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Make the secure role-check function explicit and stable for all admin policies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Ensure the existing owner account remains an admin.
INSERT INTO public.user_roles (user_id, role)
VALUES ('1790d958-c9e2-47d6-848d-9abc5f3ac2c3'::uuid, 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;