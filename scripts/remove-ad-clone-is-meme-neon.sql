-- Uruchom w Neon SQL Editor, żeby usunąć kolumnę is_meme / is_meme_ad z ad_clone

DROP INDEX IF EXISTS "public"."idx_ad_clone_meme";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_clone' AND column_name = 'is_meme'
  ) THEN
    ALTER TABLE "public"."ad_clone" DROP COLUMN "is_meme";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_clone' AND column_name = 'is_meme_ad'
  ) THEN
    ALTER TABLE "public"."ad_clone" DROP COLUMN "is_meme_ad";
  END IF;
END $$;
