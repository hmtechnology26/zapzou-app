export type UserPlan = 'free' | 'pro' | 'plus' | null | undefined;

export type PublicationMode = 'resident' | 'service_provider';

export type EnvironmentMembershipRole = 'member' | 'moderator' | null;

export type EnvironmentMembershipAccessType = PublicationMode | null;

export interface PlanLimits {
  services: number | null;
  environments: number | null;
}

const PLAN_LIMITS: Record<'free' | 'pro' | 'plus', PlanLimits> = {
  free: { services: 2, environments: 1 },
  pro: { services: 5, environments: 2 },
  plus: { services: null, environments: null },
};

export function getPlanLimits(plan?: UserPlan): PlanLimits {
  if (plan === 'free') return PLAN_LIMITS.free;
  if (plan === 'pro') return PLAN_LIMITS.pro;
  return PLAN_LIMITS.plus;
}

export function isPlanAtServiceLimit(plan: UserPlan, serviceCount: number) {
  const limit = getPlanLimits(plan).services;
  return typeof limit === 'number' && serviceCount >= limit;
}

export function isPlanAtEnvironmentLimit(plan: UserPlan, environmentCount: number) {
  const limit = getPlanLimits(plan).environments;
  return typeof limit === 'number' && environmentCount >= limit;
}

export function countCountableEnvironmentMemberships(
  memberships: Array<{ environment_id?: unknown; status?: unknown }> | null | undefined,
) {
  if (!Array.isArray(memberships)) return 0;

  const uniqueEnvironmentIds = new Set<string>();

  memberships.forEach((membership) => {
    const environmentId = membership?.environment_id;
    const status = membership?.status;
    if (typeof environmentId !== 'string' || !environmentId) return;
    if (status === 'banned') return;
    uniqueEnvironmentIds.add(environmentId);
  });

  return uniqueEnvironmentIds.size;
}

export function isPlusPublicationMode(value: unknown): value is PublicationMode {
  return value === 'resident' || value === 'service_provider';
}
