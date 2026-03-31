import type { Environment } from '@/types';

export const AUTO_APPROVAL_RADIUS_KM = 0.5;

export type EnvironmentAccessMode = 'open' | 'radius' | 'moderator';

export interface EnvironmentAccessDecision {
  mode: EnvironmentAccessMode;
  requiresModeratorApproval: boolean;
  requiresRadiusValidation: boolean;
}

export type EnvironmentAvailabilityStatus = 'active' | 'pending';

export interface EnvironmentAvailabilityState {
  status: EnvironmentAvailabilityStatus;
  label: string;
  reason: string;
}

const DEFAULT_RADIUS_TYPES = new Set<Environment['type']>(['residential', 'club', 'association']);
const DEFAULT_MODERATOR_TYPES = new Set<Environment['type']>(['church']);

const PLACE_TYPE_TO_ENVIRONMENT_TYPE: Record<string, Environment['type']> = {
  church: 'church',
  place_of_worship: 'church',
  cathedral: 'church',
  chapel: 'church',
  temple: 'church',
  condominium_complex: 'residential',
  apartment_building: 'residential',
  apartment_complex: 'residential',
  housing_complex: 'residential',
  shopping_mall: 'club',
};

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function inferEnvironmentTypeFromPlace(primaryType: string): Environment['type'] {
  return PLACE_TYPE_TO_ENVIRONMENT_TYPE[primaryType] ?? 'residential';
}

export function inferEnvironmentValidationFlagsFromType(type: Environment['type']) {
  return {
    requiresModeratorApproval: DEFAULT_MODERATOR_TYPES.has(type),
    requiresRadiusValidation: DEFAULT_RADIUS_TYPES.has(type),
  };
}

export function inferEnvironmentValidationFlagsFromPlace(primaryType: string) {
  return inferEnvironmentValidationFlagsFromType(inferEnvironmentTypeFromPlace(primaryType));
}

export function resolveEnvironmentAccessDecision(
  environment?: Partial<
    Pick<Environment, 'type' | 'requiresModeratorApproval' | 'requiresRadiusValidation'>
  >,
): EnvironmentAccessDecision {
  const inferredType = environment?.type ?? 'residential';
  const inferredFlags = inferEnvironmentValidationFlagsFromType(inferredType);

  const requiresModeratorApproval =
    environment?.requiresModeratorApproval ?? inferredFlags.requiresModeratorApproval;
  const requiresRadiusValidation =
    environment?.requiresRadiusValidation ?? inferredFlags.requiresRadiusValidation;

  if (requiresModeratorApproval) {
    return {
      mode: 'moderator',
      requiresModeratorApproval,
      requiresRadiusValidation,
    };
  }

  if (requiresRadiusValidation) {
    return {
      mode: 'radius',
      requiresModeratorApproval,
      requiresRadiusValidation,
    };
  }

  return {
    mode: 'open',
    requiresModeratorApproval,
    requiresRadiusValidation,
  };
}

export function isWithinAutoApprovalRadius(distanceKm: number | null | undefined) {
  return typeof distanceKm === 'number' && distanceKm <= AUTO_APPROVAL_RADIUS_KM;
}

export function getEnvironmentAvailabilityState(
  environment?: Partial<
    Pick<Environment, 'type' | 'requiresModeratorApproval' | 'requiresRadiusValidation'>
  >,
  options?: {
    distanceKm?: number | null;
    hasLocation?: boolean;
    membershipStatus?: 'active' | 'pending' | 'banned' | null;
  },
): EnvironmentAvailabilityState {
  const decision = resolveEnvironmentAccessDecision(environment);

  if (options?.membershipStatus === 'active') {
    return {
      status: 'active',
      label: 'Ativo',
      reason: 'Você já foi aprovado neste ambiente e pode publicar normalmente.',
    };
  }

  if (decision.mode === 'moderator') {
    if (options?.membershipStatus === 'banned') {
      return {
        status: 'pending',
        label: 'Bloqueado',
        reason: 'Seu acesso foi bloqueado pela liderança deste ambiente.',
      };
    }

    return {
      status: 'pending',
      label: 'Aguardando aprovação',
      reason: 'Este ambiente precisa da aprovação de um moderador antes de ficar disponível.',
    };
  }

  if (decision.mode === 'radius') {
    if (!options?.hasLocation || options.distanceKm == null) {
      return {
        status: 'pending',
        label: 'Aguardando validação',
        reason: 'Ative a sua localização para validar o raio de 500m.',
      };
    }

    if (isWithinAutoApprovalRadius(options.distanceKm)) {
      return {
        status: 'active',
        label: 'Ativo',
        reason: `Você está dentro do raio de ${AUTO_APPROVAL_RADIUS_KM * 1000}m.`,
      };
    }

    return {
      status: 'pending',
      label: 'Fora do raio',
      reason: `Você precisa estar dentro de ${AUTO_APPROVAL_RADIUS_KM * 1000}m para liberar este ambiente.`,
    };
  }

  return {
    status: 'active',
    label: 'Ativo',
    reason: 'Este ambiente tem acesso livre para publicar.',
  };
}
