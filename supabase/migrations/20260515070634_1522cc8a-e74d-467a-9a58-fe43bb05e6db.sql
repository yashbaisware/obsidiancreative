
CREATE TABLE public.hero_showcase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero showcase"
  ON public.hero_showcase FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert hero showcase"
  ON public.hero_showcase FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero showcase"
  ON public.hero_showcase FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero showcase"
  ON public.hero_showcase FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER hero_showcase_set_updated_at
  BEFORE UPDATE ON public.hero_showcase
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_showcase;
