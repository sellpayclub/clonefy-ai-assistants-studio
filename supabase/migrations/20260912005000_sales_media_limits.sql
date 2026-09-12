ALTER TABLE public.sales_media_assets
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE public.sales_media_assets
DROP CONSTRAINT IF EXISTS sales_media_assets_file_size_check;

ALTER TABLE public.sales_media_assets
ADD CONSTRAINT sales_media_assets_file_size_check CHECK (
  (media_type = 'text' AND file_size IS NULL)
  OR (media_type = 'audio' AND file_size BETWEEN 1 AND 16777216)
  OR (media_type = 'image' AND file_size BETWEEN 1 AND 5242880)
  OR (media_type = 'video' AND file_size BETWEEN 1 AND 16777216)
  OR (media_type = 'document' AND file_size BETWEEN 1 AND 104857600)
);
