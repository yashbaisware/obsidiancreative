
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.projects SET category = 'Carousel' WHERE category IN ('Carousel Ads', 'Social Media Creatives');
UPDATE public.projects SET category = 'Product Image Ads' WHERE category = 'AI Visuals';
