-- Speed up reviews fetch by service_id ordered by created_at.
CREATE INDEX IF NOT EXISTS idx_reviews_service_created_at
  ON public.reviews (service_id, created_at DESC);

