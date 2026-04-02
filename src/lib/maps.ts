'use client';

const BUILDING_PRIMARY_TYPES = [
  'apartment_building',
  'apartment_complex',
  'condominium_complex',
  'housing_complex',
  'shopping_mall'
] as const;

const STRUCTURAL_NAME_HINTS = [
  'condominio',
  'edificio',
  'edificio residencial',
  'predio',
  'predio residencial',
  'torre',
  'torre comercial',
  'residencial',
  'complexo comercial',
  'centro comercial',
  'shopping',
  'mall',
  'galeria',
  'centro empresarial'
];

const RELIGIOUS_NAME_HINTS = [
  'igreja',
  'igrejas',
  'templo',
  'templos',
  'capela',
  'capelas',
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

const RELIGIOUS_PRIMARY_TYPES = [
  'church',
  'place_of_worship',
  'cathedral',
  'chapel',
  'temple',
];

const RELIGIOUS_NEARBY_TYPES = [
  'church',
  'hindu_temple',
  'mosque',
  'synagogue',
];

const QUERY_VARIANT_STOPWORDS = [
  'igreja',
  'igrejas',
  'templo',
  'templos',
  'capela',
  'capelas',
  'catedral',
  'catedrais',
  'paroquia',
  'paroquias',
  'santuario',
  'santuarios',
  'condominio',
  'condominios',
  'residencial',
  'residenciais',
  'shopping',
  'centro',
  'comercial',
];

type PlaceCategory = 'condominium' | 'church';

const NEGATIVE_NAME_HINTS = [
  'administracao',
  'administradora',
  'administrador',
  'imobiliaria',
  'sala',
  'salas',
  'escritorio',
  'escritorios',
  'loja',
  'lojas',
  'comercio',
  'servicos',
  'servico',
  'consultorio',
  'consultorios',
  'acesso',
  'portaria',
  'estacionamento',
  'rua',
  'avenida',
  'travessa'
];

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizePrimaryType(type: string | undefined) {
  if (type === 'shopping_center') {
    return 'shopping_mall';
  }
  return type ?? '';
}

function isBuildingType(type: string | undefined) {
  const normalizedType = normalizePrimaryType(type);
  return Boolean(
    normalizedType &&
      BUILDING_PRIMARY_TYPES.includes(normalizedType as (typeof BUILDING_PRIMARY_TYPES)[number])
  );
}

function hasAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function buildSearchVariants(query: string, categoryType?: PlaceCategory) {
  const normalized = normalize(query.trim().replace(/\s+/g, ' '));
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const variants = new Set<string>();

  const addVariant = (candidate: string) => {
    const cleaned = candidate.trim().replace(/\s+/g, ' ');
    if (cleaned.length >= 2) {
      variants.add(cleaned);
    }
  };

  addVariant(query.trim().replace(/\s+/g, ' '));

  if (tokens.length > 1) {
    for (let length = Math.min(tokens.length, 3); length >= 2; length -= 1) {
      addVariant(tokens.slice(tokens.length - length).join(' '));
    }
    addVariant(tokens[tokens.length - 1]);
  }

  const strippedTokens = tokens.filter((token) => !QUERY_VARIANT_STOPWORDS.includes(token));
  if (strippedTokens.length > 0) {
    addVariant(strippedTokens.join(' '));
  }

  if (categoryType === 'church') {
    const churchTokens = tokens.filter(
      (token) =>
        ![
          'igreja',
          'igrejas',
          'templo',
          'templos',
          'capela',
          'capelas',
          'catedral',
          'catedrais',
          'paroquia',
          'paroquias',
          'santuario',
          'santuarios',
        ].includes(token),
    );
    if (churchTokens.length > 0) {
      addVariant(churchTokens.join(' '));
    }
  }

  return Array.from(variants).slice(0, 5);
}

async function searchPlacesTextVariants(
  apiKey: string,
  textQueries: string[],
  includedType?: string,
) {
  const merged: any[] = [];
  const seen = new Set<string>();

  for (const textQuery of textQueries) {
    const places = await searchPlacesText(apiKey, textQuery, includedType);
    for (const place of places) {
      if (!place?.id || seen.has(place.id)) continue;
      seen.add(place.id);
      merged.push(place);
    }

    if (merged.length >= 20) {
      break;
    }
  }

  return merged;
}

function inferType(query: string) {
  const text = normalize(query);

  if (hasAny(text, ['igreja', 'templo', 'paroquia', 'paroquial', 'catolica', 'evangelica'])) {
    return 'church';
  }

  if (hasAny(text, ['condominio', 'condominio residencial', 'condominio vertical'])) {
    return 'condominium_complex';
  }

  if (hasAny(text, ['shopping center', 'shopping mall', 'mall', 'galeria', 'centro comercial', 'centro empresarial', 'complexo comercial'])) {
    return 'shopping_mall';
  }

  if (hasAny(text, ['predio residencial', 'edificio residencial', 'residencial', 'apartamento', 'apartamentos', 'torre'])) {
    return 'apartment_building';
  }

  return '';
}

function looksLikeLocationScope(query: string) {
  const text = normalize(query);
  if (inferType(text)) {
    return false;
  }

  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= 4;
}

function pickComponent(components: Array<{ longText?: string; types?: string[] }>, wantedTypes: string[]) {
  for (const component of components) {
    if (component.types?.some((type) => wantedTypes.includes(type)) && component.longText) {
      return component.longText;
    }
  }
  return '';
}

function uniquePlaces<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function extractNameText(place: { displayName?: { text?: string } }) {
  return normalize(place.displayName?.text ?? '');
}

function isStructuralName(name: string) {
  return hasAny(name, STRUCTURAL_NAME_HINTS) && !hasAny(name, NEGATIVE_NAME_HINTS);
}

function isReligiousName(name: string) {
  return hasAny(name, RELIGIOUS_NAME_HINTS);
}

function scorePlace(place: { displayName?: { text?: string }; formattedAddress?: string; primaryTypeText: string }, query: string) {
  const q = normalize(query);
  const name = extractNameText(place);
  const address = normalize(place.formattedAddress ?? '');
  const type = normalizePrimaryType(place.primaryTypeText);

  let score = 0;

  if (name === q) score += 150;
  if (name.includes(q)) score += 80;
  if (q.includes(name) && name) score += 30;
  if (address.includes(q)) score += 15;

  if (type === 'shopping_mall' && hasAny(q, ['shopping', 'mall', 'galeria', 'centro comercial', 'centro empresarial', 'comercial'])) {
    score += 60;
  }

  if (type === 'condominium_complex' && hasAny(q, ['condominio', 'residencial', 'torre', 'apartamento'])) {
    score += 55;
  }

  if (type === 'apartment_building' && hasAny(q, ['predio', 'edificio', 'apartamento', 'torre', 'residencial'])) {
    score += 50;
  }

  if (type === 'church' && hasAny(q, ['igreja', 'templo', 'paroquia'])) {
    score += 45;
  }

  if (RELIGIOUS_PRIMARY_TYPES.includes(type as (typeof RELIGIOUS_PRIMARY_TYPES)[number])) {
    score += 20;
  }

  if (isReligiousName(name)) {
    score += 20;
  }

  if (isStructuralName(name)) {
    score += 25;
  }

  if (hasAny(name, NEGATIVE_NAME_HINTS)) {
    score -= 80;
  }

  if (isBuildingType(type)) {
    score += 10;
  }

  return score;
}

async function searchPlacesText(apiKey: string, textQuery: string, includedType?: string) {
  const body: Record<string, unknown> = {
    textQuery,
    regionCode: 'br'
  };

  if (includedType) {
    body.includedType = includedType;
    body.strictTypeFiltering = true;
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.primaryType,places.types,places.googleMapsUri,places.location,places.addressComponents'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Falha ao consultar o Google Places.');
  }

  return Array.isArray(data?.places) ? data.places : [];
}

async function searchPlacesNearby(
  apiKey: string,
  center: { latitude: number; longitude: number },
  radius: number,
  includedTypes?: string[]
) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.primaryType,places.types,places.googleMapsUri,places.location,places.addressComponents'
    },
    body: JSON.stringify({
      includedTypes: includedTypes ?? [...BUILDING_PRIMARY_TYPES],
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center,
          radius
        }
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Falha ao consultar o Google Places.');
  }

  return Array.isArray(data?.places) ? data.places : [];
}

export interface PlaceSearchResult {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  primaryType: string;
  googleMapsUri: string;
  location: { latitude: number; longitude: number };
  city: string;
  neighborhood: string;
}

export async function searchPlaces(
  query: string,
  options?: { categoryType?: PlaceCategory }
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  console.log('[maps] API Key exists:', !!apiKey);
  console.log('[maps] Query:', query);
  
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY não configurada.');
  }

  if (!query) {
    throw new Error('Informe um termo de busca.');
  }

  const locationScope = looksLikeLocationScope(query);
  const explicitType = inferType(query);
  console.log('[maps] Location scope:', locationScope, 'Explicit type:', explicitType);

  let rawPlaces: any[] = [];
  const categoryType = options?.categoryType;
  const forcedType =
    categoryType === 'church'
      ? 'church'
      : categoryType === 'condominium'
        ? 'condominium_complex'
        : undefined;

  const queryVariants = buildSearchVariants(query, categoryType);
  console.log('[maps] Query variants:', queryVariants);

  if (categoryType === 'church') {
    console.log('[maps] Searching religious places by text with includedTypes...');
    rawPlaces = await searchPlacesTextVariants(apiKey, queryVariants, 'church');
  } else {
    console.log('[maps] Searching by place name...');
    const includedType = forcedType ?? (explicitType || undefined);
    rawPlaces = await searchPlacesTextVariants(apiKey, queryVariants, includedType);
  }

  if (rawPlaces.length === 0 && locationScope) {
    console.log('[maps] Falling back to location scope...');
    const seedPlaces = await searchPlacesTextVariants(apiKey, queryVariants);
    const seed = seedPlaces.find((place: any) => place.location);

    if (!seed?.location) {
      console.log('[maps] No seed place found, returning empty');
      return [];
    }

    const primaryType = String(seed.primaryType ?? '');
    const radius = primaryType === 'neighborhood' ? 5000 : primaryType === 'locality' ? 20000 : 25000;
    const center = {
      latitude: Number(seed.location.latitude),
      longitude: Number(seed.location.longitude)
    };

    const nearbyTypes = categoryType === 'church' ? RELIGIOUS_NEARBY_TYPES : undefined;
    rawPlaces = await searchPlacesNearby(apiKey, center, radius, nearbyTypes);
  }

  console.log('[maps] Raw places:', rawPlaces.length, rawPlaces.map((p: any) => ({ id: p.id, name: p.displayName?.text, type: p.primaryType })));

  const results = rawPlaces
    .map((place: any) => {
      const addressComponents = Array.isArray(place.addressComponents) ? place.addressComponents : [];
      const city = pickComponent(addressComponents, ['locality', 'administrative_area_level_2']);
      const neighborhood = pickComponent(addressComponents, ['neighborhood', 'sublocality', 'sublocality_level_1']);
      const primaryType = normalizePrimaryType(String(place.primaryType ?? ''));
      const displayName = place.displayName?.text ?? '';

      return {
        id: place.id,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        primaryType: primaryType || place.primaryType,
        googleMapsUri: place.googleMapsUri,
        location: place.location,
        city,
        neighborhood,
        primaryTypeText: primaryType,
        displayNameText: displayName
      };
    })
    .filter((place: any) => {
      const normalizedName = normalize(place.displayNameText);
      const typeOk =
        isBuildingType(place.primaryTypeText) ||
        RELIGIOUS_PRIMARY_TYPES.includes(place.primaryTypeText);
      const structuralOk = isStructuralName(normalizedName);
      const religiousOk = isReligiousName(normalizedName);
      
      console.log('[maps] Filtering place:', place.displayNameText, 'type:', place.primaryTypeText, 'typeOk:', typeOk, 'structuralOk:', structuralOk, 'religiousOk:', religiousOk, 'categoryType:', categoryType);
      
      if (categoryType === 'church') {
        return Boolean(
          RELIGIOUS_PRIMARY_TYPES.includes(place.primaryTypeText) ||
            place.primaryTypeText === 'church' ||
            religiousOk,
        );
      }

      if (categoryType === 'condominium') {
        return Boolean(isBuildingType(place.primaryTypeText) || structuralOk);
      }

      return (typeOk && (structuralOk || religiousOk)) || religiousOk;
    })
    .sort((a: any, b: any) => scorePlace(b, query) - scorePlace(a, query))
    .map(({ primaryTypeText, displayNameText, ...place }: any) => place);

  console.log('[maps] Filtered results:', results.length);
  return uniquePlaces(results);
}
