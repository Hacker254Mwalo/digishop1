-- Keep every product column used by the Supabase runtime in the tracked migration history.
-- This is additive, preserves existing listings, and backfills the existing hero image into the gallery.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS "productType" varchar(24) NOT NULL DEFAULT 'part',
  ADD COLUMN IF NOT EXISTS "imageUrl" varchar(512),
  ADD COLUMN IF NOT EXISTS "imageUrls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "externalUrl" varchar(512),
  ADD COLUMN IF NOT EXISTS condition text;

-- Replace the six-value legacy category check with a bounded owner-defined category label.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (char_length(btrim(category)) BETWEEN 1 AND 64);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_product_type_check
  CHECK ("productType" IN ('part', 'device', 'accessory', 'service'));

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_condition_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_condition_check
  CHECK (condition IS NULL OR condition IN ('new', 'used', 'refurbished', 'open_box', 'for_parts', 'not_applicable'));

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_image_urls_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_image_urls_check
  CHECK (jsonb_typeof("imageUrls") = 'array' AND jsonb_array_length("imageUrls") <= 5);

UPDATE public.products
SET "imageUrls" = jsonb_build_array("imageUrl")
WHERE "imageUrl" IS NOT NULL
  AND btrim("imageUrl") <> ''
  AND "imageUrls" = '[]'::jsonb;

CREATE INDEX IF NOT EXISTS products_active_category_updated_idx
  ON public.products (active, category, "updatedAt" DESC);

-- Serialize gallery append operations and keep the old primary-image column in sync.
CREATE OR REPLACE FUNCTION public.append_product_image(p_product_id bigint, p_image_url text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  current_images jsonb;
BEGIN
  IF p_image_url IS NULL OR length(p_image_url) > 512 OR p_image_url NOT LIKE '/manus-storage/products/%' THEN
    RAISE EXCEPTION 'Invalid product image path' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE("imageUrls", '[]'::jsonb)
    INTO current_images
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product was not found' USING ERRCODE = 'P0002';
  END IF;

  IF current_images @> jsonb_build_array(p_image_url) THEN
    RETURN current_images;
  END IF;

  IF jsonb_array_length(current_images) >= 5 THEN
    RAISE EXCEPTION 'A product can have at most five photos' USING ERRCODE = '22023';
  END IF;

  current_images := current_images || jsonb_build_array(p_image_url);
  UPDATE public.products
    SET "imageUrls" = current_images,
        "imageUrl" = COALESCE(NULLIF("imageUrl", ''), p_image_url),
        "updatedAt" = now()
    WHERE id = p_product_id;

  RETURN current_images;
END;
$$;

REVOKE ALL ON FUNCTION public.append_product_image(bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_product_image(bigint, text) TO service_role;
