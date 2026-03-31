-- Add environment access flags used by the publish flow

ALTER TABLE public.environments
  ADD COLUMN IF NOT EXISTS requires_moderator_approval BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.environments
  ADD COLUMN IF NOT EXISTS requires_radius_validation BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill current environments so the new front-end rules match existing data.
UPDATE public.environments
SET requires_moderator_approval = TRUE,
    requires_radius_validation = FALSE
WHERE type = 'church';

UPDATE public.environments
SET requires_moderator_approval = FALSE,
    requires_radius_validation = TRUE
WHERE type IN ('residential', 'club', 'association');
