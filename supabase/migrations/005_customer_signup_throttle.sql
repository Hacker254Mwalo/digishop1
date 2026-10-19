-- Limit public account creation without storing raw phone numbers or client addresses.
BEGIN;

CREATE TABLE IF NOT EXISTS public."customerSignupRateLimits" (
  "keyHash" varchar(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  "windowStartedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_signup_rate_limit_key_format CHECK ("keyHash" ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS customer_signup_rate_limits_window_idx
  ON public."customerSignupRateLimits" ("windowStartedAt");

ALTER TABLE public."customerSignupRateLimits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."customerSignupRateLimits" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."customerSignupRateLimits" TO service_role;

CREATE OR REPLACE FUNCTION public.consume_customer_signup_attempt(
  p_key_hash text,
  p_window_seconds integer,
  p_max_attempts integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_attempts integer;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[a-f0-9]{64}$'
     OR p_window_seconds NOT BETWEEN 60 AND 86400
     OR p_max_attempts NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid customer signup throttle input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public."customerSignupRateLimits" AS limits ("keyHash", attempts, "windowStartedAt")
  VALUES (p_key_hash, 1, now())
  ON CONFLICT ("keyHash") DO UPDATE
    SET attempts = CASE
          WHEN limits."windowStartedAt" <= now() - make_interval(secs => p_window_seconds) THEN 1
          ELSE limits.attempts + 1
        END,
        "windowStartedAt" = CASE
          WHEN limits."windowStartedAt" <= now() - make_interval(secs => p_window_seconds) THEN now()
          ELSE limits."windowStartedAt"
        END
  RETURNING attempts INTO current_attempts;

  DELETE FROM public."customerSignupRateLimits"
  WHERE "windowStartedAt" < now() - interval '1 day';

  RETURN current_attempts <= p_max_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_customer_signup_attempt(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_customer_signup_attempt(text, integer, integer) TO service_role;

COMMIT;
