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
  radius: number
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
      includedTypes: [...BUILDING_PRIMARY_TYPES],
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

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
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

  if (locationScope) {
    console.log('[maps] Searching by location scope...');
    const seedPlaces = await searchPlacesText(apiKey, query);
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

    rawPlaces = await searchPlacesNearby(apiKey, center, radius);
  } else {
    console.log('[maps] Searching by place name...');
    const includedType = explicitType || undefined;
    rawPlaces = await searchPlacesText(apiKey, query, includedType);
  }

  console.log('[maps] Raw places:', rawPlaces.length);

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
      const typeOk = isBuildingType(place.primaryTypeText) || place.primaryTypeText === 'church';
      const nameOk = isStructuralName(normalize(place.displayNameText));
      return typeOk && nameOk;
    })
    .sort((a: any, b: any) => scorePlace(b, query) - scorePlace(a, query))
    .map(({ primaryTypeText, displayNameText, ...place }: any) => place);

  console.log('[maps] Filtered results:', results.length);
  return uniquePlaces(results);
}