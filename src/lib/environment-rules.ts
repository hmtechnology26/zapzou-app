import type { Environment } from '@/types';
import type {
  EnvironmentMembershipAccessType,
  EnvironmentMembershipRole,
  PublicationMode,
  UserPlan,
} from './plan-rules';

export const AUTO_APPROVAL_RADIUS_KM = 0.5;

export type EnvironmentAccessMode = 'open' | 'radius' | 'moderator';

export interface EnvironmentAccessDecision {
  mode: EnvironmentAccessMode;
  requiresModeratorApproval: boolean;
  requiresRadiusValidation: boolean;
  requiresPublicationChoice?: boolean;
}

export type EnvironmentAvailabilityStatus = 'active' | 'pending';

export interface EnvironmentAvailabilityState {
  status: EnvironmentAvailabilityStatus;
  label: string;
  reason: string;
}

const DEFAULT_RADIUS_TYPES = new Set<Environment['type']>(['residential', 'club', 'association']);
const DEFAULT_MODERATOR_TYPES = new Set<Environment['type']>(['church']);
export const FORCED_PENDING_APPROVAL_ENVIRONMENT_IDS = new Set<string>([
  'fb6f5a5c-4126-451d-ad55-97f2ac33980b',
]);

const CHURCH_NAME_HINTS = [
  'igreja',
  'igrejas',
  'templo',
  'templos',
  'capela',
  'capelas',
  'paroquia',
  'paroquias',
  'paroquia',
  'paroquias',
  'catedral',
  'catedrais',
  'santuario',
  'santuarios',
  'assembleia',
  'evangelica',
  'evangelicas',
  'catolica',
  'catolicas',
  'ministerio',
  'ministerios',
  'diocese',
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isChurchLikeText(value?: string | null) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = normalizeText(value);
  return CHURCH_NAME_HINTS.some((hint) => normalized.includes(hint));
}

export function isChurchLikeEnvironmentName(value?: string | null) {
  return isChurchLikeText(value);
}

export function isForcedPendingApprovalEnvironment(environmentId?: string | null) {
  return Boolean(environmentId && FORCED_PENDING_APPROVAL_ENVIRONMENT_IDS.has(environmentId));
}

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

export function inferEnvironmentTypeFromPlace(primaryType: string, displayName?: string): Environment['type'] {
  if (isChurchLikeText(displayName)) {
    return 'church';
  }

  return PLACE_TYPE_TO_ENVIRONMENT_TYPE[primaryType] ?? 'residential';
}

export function inferEnvironmentValidationFlagsFromType(type: Environment['type']) {
  return {
    requiresModeratorApproval: DEFAULT_MODERATOR_TYPES.has(type),
    requiresRadiusValidation: DEFAULT_RADIUS_TYPES.has(type),
  };
}

export function inferEnvironmentValidationFlagsFromPlace(primaryType: string, displayName?: string) {
  return inferEnvironmentValidationFlagsFromType(inferEnvironmentTypeFromPlace(primaryType, displayName));
}

function normalizePublicationRole(role: EnvironmentMembershipAccessType): PublicationMode | null {
  if (role === 'service_provider' || role === 'resident') {
    return role;
  }

  return null;
}

export function resolveEnvironmentAccessDecision(
  environment?: Partial<
    Pick<Environment, 'id' | 'name' | 'type' | 'requiresModeratorApproval' | 'requiresRadiusValidation'>
  >,
  options?: {
    userPlan?: UserPlan;
    membershipRole?: EnvironmentMembershipRole;
    membershipAccessType?: EnvironmentMembershipAccessType;
    membershipStatus?: 'active' | 'pending' | 'banned' | null;
    publicationMode?: PublicationMode | null;
  },
): EnvironmentAccessDecision {
  const inferredType = environment?.type ?? 'residential';
  const inferredFlags = inferEnvironmentValidationFlagsFromType(inferredType);
  const forceModeratorApproval = isForcedPendingApprovalEnvironment(environment?.id);
  const churchLikeEnvironment = environment?.type === 'church' || isChurchLikeText(environment?.name);
  const churchLikeEnvironmentUnlocked = churchLikeEnvironment && options?.membershipStatus === 'active';
  const isUnlockedSpecialEnvironment =
    forceModeratorApproval &&
    options?.membershipStatus === 'active' &&
    (options?.membershipAccessType === 'resident' || options?.membershipAccessType === 'service_provider');

  if (options?.membershipStatus === 'active') {
    return {
      mode: 'open',
      requiresModeratorApproval: false,
      requiresRadiusValidation: false,
    };
  }

  if (
    (forceModeratorApproval && !isUnlockedSpecialEnvironment) ||
    (churchLikeEnvironment && !churchLikeEnvironmentUnlocked)
  ) {
    return {
      mode: 'moderator',
      requiresModeratorApproval: true,
      requiresRadiusValidation: false,
    };
  }

  const requiresModeratorApproval =
    churchLikeEnvironmentUnlocked
      ? false
      : environment?.requiresModeratorApproval ?? inferredFlags.requiresModeratorApproval;
  const requiresRadiusValidation =
    environment?.requiresRadiusValidation ?? inferredFlags.requiresRadiusValidation;

  const effectivePublicationMode =
    options?.publicationMode ?? normalizePublicationRole(options?.membershipAccessType ?? null);

  if (options?.userPlan === 'plus') {
    if (effectivePublicationMode === 'service_provider') {
      return {
        mode: 'open',
        requiresModeratorApproval: false,
        requiresRadiusValidation: false,
      };
    }

    if (effectivePublicationMode === 'resident') {
      return {
        mode: 'radius',
        requiresModeratorApproval: false,
        requiresRadiusValidation: true,
      };
    }

    return {
      mode: requiresModeratorApproval ? 'moderator' : requiresRadiusValidation ? 'radius' : 'open',
      requiresModeratorApproval,
      requiresRadiusValidation,
      requiresPublicationChoice: true,
    };
  }

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
    Pick<Environment, 'name' | 'type' | 'requiresModeratorApproval' | 'requiresRadiusValidation'>
  >,
  options?: {
    distanceKm?: number | null;
    hasLocation?: boolean;
    membershipStatus?: 'active' | 'pending' | 'banned' | null;
    membershipRole?: EnvironmentMembershipRole;
    membershipAccessType?: EnvironmentMembershipAccessType;
    userPlan?: UserPlan;
    publicationMode?: PublicationMode | null;
  },
): EnvironmentAvailabilityState {
  const decision = resolveEnvironmentAccessDecision(environment, options);
  const publicationRole = normalizePublicationRole(
    options?.publicationMode ?? options?.membershipAccessType ?? null,
  );

  if (options?.membershipStatus === 'banned') {
    return {
      status: 'pending',
      label: 'Bloqueado',
      reason: 'Seu acesso foi bloqueado pela liderança deste ambiente.',
    };
  }

  if (options?.membershipStatus === 'active') {
    return {
      status: 'active',
      label: 'Ativo',
      reason: 'Você já foi aprovado neste ambiente e pode publicar normalmente.',
    };
  }

  if (options?.userPlan === 'plus') {
    if (!publicationRole) {
      return {
        status: 'pending',
        label: 'Aguardando validação',
        reason: '',
      };
    }

    if (publicationRole === 'service_provider') {
      return {
        status: 'active',
        label: 'Ativo',
        reason: '',
      };
    }

    if (!options?.hasLocation || options.distanceKm == null) {
      return {
        status: 'pending',
        label: 'Aguardando validação',
        reason: '',
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

  if (decision.mode === 'moderator') {
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
