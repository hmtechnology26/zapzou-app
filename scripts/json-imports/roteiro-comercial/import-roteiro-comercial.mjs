#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
const jsonPath = path.join(__dirname, 'roteirocomercial_data.json');
const backupsRoot = path.join(__dirname, 'backups');
const approvalsPath = path.join(__dirname, 'approvals.json');
const previewCachePath = path.join(__dirname, 'preview-cache.json');
const IMPORT_SOURCE = 'roteiro_comercial';
const INTERNAL_EMAIL_DOMAIN = 'imports.conectae.internal';
const CONDOMINIUM_TYPES = ['condominium_complex', 'apartment_complex', 'apartment_building', 'housing_complex'];
const GOOGLE_FIELDS = 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.types,places.location,places.addressComponents';
const CONDOMINIUM_NAME_HINTS = ['condominio', 'residencial', 'edificio', 'predio', 'torre', 'village', 'garden', 'park', 'plaza', 'bella', 'villagio'];
const NEGATIVE_ENVIRONMENT_HINTS = ['casa', 'residencia', 'apartamento 1', 'apartamento 2', 'apartamento', 'sala', 'bloco', 'portaria', 'loja', 'rua', 'avenida'];

const CATEGORY_RULES = [
  { target: 'Alimentação', keywords: ['alimentacao', 'restaurante', 'pizzaria', 'hamburgueria', 'lanches', 'pastelaria', 'doceria', 'cafeteria', 'padaria', 'sorveteria', 'mercado', 'fruteira', 'acougue', 'peixaria', 'marmita', 'bebidas', 'bar', 'delivery', 'churrascaria'] },
  { target: 'Limpeza', keywords: ['limpeza', 'faxina', 'diarista', 'higienizacao', 'lavanderia', 'dedetizacao', 'sanitizacao'] },
  { target: 'Manutenção', keywords: ['manutencao', 'consertos', 'instalacao', 'climatizacao', 'hidraulica', 'eletrica', 'mecanica', 'autopecas', 'guincho', 'chaveiro', 'oficina'] },
  { target: 'Agro & Pets', keywords: ['agro', 'pet', 'pet shop', 'veterin', 'racao', 'agropecuaria'] },
  { target: 'Beleza', keywords: ['beleza', 'estetica', 'cosmeticos', 'barbearia', 'salao', 'depilacao', 'maquiagem', 'perfumaria', 'unhas'] },
  { target: 'Tecnologia', keywords: ['tecnologia', 'informatica', 'celular', 'computador', 'assistencia tecnica', 'games', 'software', 'grafica', 'publicidade'] },
  { target: 'Construção', keywords: ['construcao', 'reforma', 'ferragem', 'tintas', 'acabamentos', 'aberturas', 'moveis', 'decoracoes', 'marcenaria', 'vidracaria'] },
  { target: 'Saúde', keywords: ['saude', 'clinica', 'medica', 'odont', 'farmacia', 'fisioterapia', 'emagrecimento', 'terapia'] },
  { target: 'Eventos', keywords: ['evento', 'festa', 'filmagem', 'foto', 'buffet', 'cerimonial', 'som', 'dj', 'casamento'] },
];

const CANONICAL_CATEGORIES = ['Alimentação', 'Limpeza', 'Manutenção', 'Agro & Pets', 'Beleza', 'Tecnologia', 'Construção', 'Saúde', 'Eventos', 'Outros'];
const CATEGORY_RULES_V2 = [
  { target: 'Alimentação', keywords: ['alimentacao', 'restaurante', 'pizzaria', 'hamburgueria', 'lanches', 'pastelaria', 'doceria', 'cafeteria', 'padaria', 'sorveteria', 'fruteira', 'acougue', 'peixaria', 'marmita', 'bebidas', 'bar', 'delivery', 'churrascaria', 'buffet', 'marmitaria', 'lanche', 'comida', 'cafe'] },
  { target: 'Limpeza', keywords: ['limpeza', 'faxina', 'diarista', 'higienizacao', 'lavanderia', 'dedetizacao', 'sanitizacao', 'passadeira', 'lavacao', 'conservacao'] },
  { target: 'Manutenção', keywords: ['manutencao', 'consertos', 'instalacao', 'climatizacao', 'hidraulica', 'eletrica', 'mecanica', 'autopecas', 'guincho', 'chaveiro', 'oficina', 'serralheria', 'solda', 'reparo', 'assistencia'] },
  { target: 'Agro & Pets', keywords: ['agro', 'pet', 'pet shop', 'veterin', 'racao', 'agropecuaria', 'veterinaria', 'banho e tosa', 'tosa', 'animais'] },
  { target: 'Beleza', keywords: ['beleza', 'estetica', 'cosmeticos', 'barbearia', 'salao', 'depilacao', 'maquiagem', 'perfumaria', 'unhas', 'cabelo', 'escova', 'spa'] },
  { target: 'Tecnologia', keywords: ['tecnologia', 'informatica', 'celular', 'computador', 'assistencia tecnica', 'games', 'software', 'grafica', 'publicidade', 'impressao', 'camera', 'eletronica'] },
  { target: 'Construção', keywords: ['construcao', 'reforma', 'ferragem', 'tintas', 'acabamentos', 'aberturas', 'moveis', 'decoracoes', 'marcenaria', 'vidracaria', 'cimento', 'obra', 'gesso', 'pintura'] },
  { target: 'Saúde', keywords: ['saude', 'clinica', 'medica', 'odont', 'farmacia', 'fisioterapia', 'emagrecimento', 'terapia', 'psic', 'nutri', 'pilates', 'fono', 'enfermagem'] },
  { target: 'Eventos', keywords: ['evento', 'festa', 'filmagem', 'foto', 'cerimonial', 'som', 'dj', 'casamento', 'decoracao de festa', 'locacao', 'animacao'] },
];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  loadDotEnv(path.join(workspaceRoot, '.env'));
  const options = parseArgs(process.argv.slice(2));

  const anonClient = createOptionalClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const adminClient = createOptionalClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const dbClient = adminClient ?? anonClient;

  if (!dbClient) {
    throw new Error('Variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorias.');
  }

  const schema = await detectSchema(dbClient);
  const existingState = await loadExistingState(dbClient);
  const sourceItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const dedupedSourceItems = dedupeSourceItems(sourceItems);
  const filteredSourceItems = options.sourceIds.length
    ? dedupedSourceItems.filter((item) => options.sourceIds.includes(String(item.id)))
    : dedupedSourceItems;
  const normalizedItems = filteredSourceItems.slice(0, options.limit).map(normalizeSourceItem);

  const environmentCache = new Map();
  const records = [];
  for (const item of normalizedItems) {
    item.images = await filterValidUniqueImageUrls(item.images, {
      skipRemoteValidation: options.fastPreview || options.action === 'apply',
    });
    const resolution = await resolveEnvironmentForItem(item, existingState, environmentCache, { skipGoogle: options.skipGoogle });
    records.push(buildRecord(item, resolution, existingState, schema));
  }

  const plan = summarizePlan(records);
  cachePreview(plan, options);

  if (options.action === 'dry-run') {
    printDryRun(plan, options, schema);
    return;
  }

  if (!adminClient) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY e obrigatoria para --apply.');
  }
  if (!schema.importSource) {
    throw new Error('A coluna services.import_source nao existe. Aplique a migration 020 antes do --apply.');
  }

  await createBackup(adminClient);
  const uploadClient = await createImageUploadClient(options.skipImages);
  const result = await applyPlan(adminClient, records, existingState, uploadClient, options.skipImages, options.approvedOnly);
  printApplyResult(result, options);
}

function parseArgs(argv) {
  const options = {
    action: 'dry-run',
    json: false,
    limit: Number.POSITIVE_INFINITY,
    skipImages: false,
    fastPreview: false,
    approvedOnly: false,
    skipGoogle: false,
    sourceIds: [],
  };

  for (const arg of argv) {
    if (arg === '--dry-run') options.action = 'dry-run';
    else if (arg === '--apply') options.action = 'apply';
    else if (arg === '--json') options.json = true;
    else if (arg === '--skip-images') options.skipImages = true;
    else if (arg === '--fast-preview') options.fastPreview = true;
    else if (arg === '--skip-google') options.skipGoogle = true;
    else if (arg === '--approved-only') options.approvedOnly = true;
    else if (arg.startsWith('--source-id=')) options.sourceIds.push(String(arg.slice(12)));
    else if (arg.startsWith('--source-ids=')) {
      options.sourceIds.push(...arg.slice(13).split(',').map((value) => value.trim()).filter(Boolean));
    }
    else if (arg.startsWith('--limit=')) options.limit = toPositiveInteger(arg.slice(8), 'limit');
    else throw new Error(`Argumento nao suportado: ${arg}`);
  }

  options.sourceIds = [...new Set(options.sourceIds)];
  return options;
}

function createOptionalClient(url, key) {
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function detectSchema(client) {
  return {
    importSource: await columnExists(client, 'services', 'import_source'),
    cnpj: await columnExists(client, 'services', 'cnpj'),
    publisherType: await columnExists(client, 'services', 'publisher_type'),
    accessType: await columnExists(client, 'environment_members', 'access_type'),
    googlePlaceId: await columnExists(client, 'environments', 'google_place_id'),
  };
}

async function columnExists(client, table, column) {
  const { error } = await client.from(table).select(column).limit(1);
  return !error || error.code !== '42703';
}

async function loadExistingState(client) {
  const state = emptyState();
  state.environments = await fetchAll(client, 'environments', 'id,name,slug,type,status,google_place_id,address,latitude,longitude,requires_moderator_approval,requires_radius_validation');
  state.services = await fetchAll(client, 'services', 'id,provider_id,title,whatsapp,instagram,image_url,images_urls,environment_id');
  state.users = await fetchAll(client, 'users', 'id,email,name');
  state.memberships = await fetchAll(client, 'environment_members', 'user_id,environment_id,status,role,access_type');
  state.links = await fetchAll(client, 'service_environment_links', 'service_id,environment_id,created_by');

  for (const env of state.environments) {
    if (env.google_place_id) state.environmentByGooglePlaceId.set(env.google_place_id, env);
    state.environmentBySlug.set(String(env.slug || ''), env);
  }
  for (const service of state.services) {
    state.serviceById.set(service.id, service);
    const wa = normalizePhoneDigits(service.whatsapp);
    const ig = normalizeInstagramHandle(service.instagram);
    if (wa) state.serviceByWhatsapp.set(wa, service);
    if (ig) state.serviceByInstagram.set(ig, service);
  }
  for (const user of state.users) state.userById.set(user.id, user);
  for (const user of state.users) {
    if (user.email) state.userByEmail.set(String(user.email).toLowerCase(), user);
  }
  for (const membership of state.memberships) state.membershipByKey.set(`${membership.user_id}:${membership.environment_id}`, membership);
  for (const link of state.links) state.linkByKey.set(`${link.service_id}:${link.environment_id}`, link);

  return state;
}

async function fetchAll(client, table, select) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`Falha ao ler ${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function emptyState() {
  return {
    environments: [],
    services: [],
    users: [],
    memberships: [],
    links: [],
    environmentByGooglePlaceId: new Map(),
    environmentBySlug: new Map(),
    serviceById: new Map(),
    serviceByWhatsapp: new Map(),
    serviceByInstagram: new Map(),
    userById: new Map(),
    userByEmail: new Map(),
    membershipByKey: new Map(),
    linkByKey: new Map(),
  };
}

function dedupeSourceItems(items) {
  const merged = new Map();

  for (const item of items) {
    const key = String(item.id);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...item,
        photos: Array.isArray(item.photos) ? [...item.photos] : [],
        categories_detalhadas: Array.isArray(item.categories_detalhadas) ? [...item.categories_detalhadas] : [],
        category_candidates: [item.category_principal].filter(Boolean),
      });
      continue;
    }

    existing.photos = [...new Set([...(Array.isArray(existing.photos) ? existing.photos : []), ...(Array.isArray(item.photos) ? item.photos : [])])];
    existing.categories_detalhadas = [...new Set([...(Array.isArray(existing.categories_detalhadas) ? existing.categories_detalhadas : []), ...(Array.isArray(item.categories_detalhadas) ? item.categories_detalhadas : [])])];
    existing.category_candidates = [...new Set([...(existing.category_candidates || []), item.category_principal].filter(Boolean))];
    existing.content_html = longestText(existing.content_html, item.content_html);
    existing.summary = longestText(existing.summary, item.summary);
    existing.title = longestText(existing.title, item.title);
    existing.address = longestText(existing.address, item.address);
    existing.phone = existing.phone || item.phone;
    existing.whatsapp = existing.whatsapp || item.whatsapp;
    existing.instagram = existing.instagram || item.instagram;
    existing.large_thumbnail = existing.large_thumbnail || item.large_thumbnail;
    existing.original_thumbnail = existing.original_thumbnail || item.original_thumbnail;
    existing.thumbnail = existing.thumbnail || item.thumbnail;
    existing.latitude = existing.latitude || item.latitude;
    existing.longitude = existing.longitude || item.longitude;
  }

  return [...merged.values()].map((item) => ({
    ...item,
    category_principal: selectBestCategoryCandidate(item.category_candidates || [], item),
  }));
}

function longestText(a, b) {
  return String(b || '').trim().length > String(a || '').trim().length ? b : a;
}

function selectBestCategoryCandidate(candidates, item) {
  if (!Array.isArray(candidates) || candidates.length === 0) return item.category_principal;
  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreCategoryText(candidate, item.title, `${item.summary || ''} ${stripHtml(item.content_html || '')}`),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.candidate || item.category_principal;
}

function normalizeSourceItem(item) {
  const businessName = extractBusinessName(item);
  const title = cleanTitle(item.title, businessName);
  const description = buildDescription(item, businessName, title, item.address);
  const whatsapp = extractWhatsapp(item.whatsapp) || coercePhoneToWhatsapp(normalizePhoneDigits(item.phone));
  const instagram = extractInstagramHandle(item);
  const address = parseAddress(item.address);
  const latitude = normalizeCoordinate(item.latitude, 'latitude');
  const longitude = normalizeCoordinate(item.longitude, 'longitude');
  const category = mapCategory(item.category_principal, item.categories_detalhadas, title, description);
  const cnpj = extractCnpj([item.summary, item.content_html, item.title, businessName].join(' '));
  const images = collectImageUrls(item);
  const identityKey = buildIdentityKey({ cnpj, whatsapp, instagram, businessName: businessName || title, address });
  const userId = stableUuid(`roteiro:user:${identityKey}`);
  const serviceId = stableUuid(`roteiro:service:${item.id}`);

  const invalidReasons = [];
  if (!title) invalidReasons.push('Titulo vazio apos sanitizacao.');
  if (!description) invalidReasons.push('Descricao vazia apos sanitizacao.');
  if (!whatsapp && !instagram) invalidReasons.push('Sem WhatsApp nem Instagram validos.');
  if (latitude == null || longitude == null) invalidReasons.push('Coordenadas invalidas.');

  return {
    source: item,
    sourceId: String(item.id),
    userId,
    serviceId,
    userEmail: `roteiro-comercial+${crypto.createHash('sha1').update(identityKey).digest('hex').slice(0, 24)}@${INTERNAL_EMAIL_DOMAIN}`,
    businessName: truncate(businessName || title || `Importado ${item.id}`, 150),
    title: truncate(title || businessName || `Importado ${item.id}`, 150),
    description,
    whatsapp,
    instagram,
    cnpj,
    address,
    latitude,
    longitude,
    category,
    images,
    invalidReasons,
  };
}

async function resolveEnvironmentForItem(item, existingState, cache, options = {}) {
  const key = `${item.latitude}:${item.longitude}:${options.skipGoogle ? 'local' : 'google'}`;
  if (cache.has(key)) return cache.get(key);

  if (options.skipGoogle) {
    const localFallback = mapLocalEnvironmentFallback(item);
    const existing = existingState.environmentBySlug.get(localFallback.slug) || null;
    const result = {
      mode: existing ? 'reuse' : 'create',
      source: 'manual_lookup_pending',
      environment: existing || localFallback,
      distanceMeters: 0,
    };
    cache.set(key, result);
    return result;
  }

  const nearby = await googleNearbyCondos(item.latitude, item.longitude);
  if (nearby.length > 0) {
    const place = nearby[0];
    const existing = existingState.environmentByGooglePlaceId.get(place.id) || null;
    const result = {
      mode: existing ? 'reuse' : 'create',
      source: 'condominium',
      environment: existing || mapGooglePlaceToEnvironment(place),
      distanceMeters: distanceMeters(item.latitude, item.longitude, place.location.latitude, place.location.longitude),
    };
    cache.set(key, result);
    return result;
  }

  const geocode = await googleReverseGeocode(item.latitude, item.longitude);
  const fallback = mapGeocodeToEnvironment(geocode);
  const existing = fallback.google_place_id
    ? existingState.environmentByGooglePlaceId.get(fallback.google_place_id) || null
    : existingState.environmentBySlug.get(fallback.slug) || null;

  const result = {
    mode: existing ? 'reuse' : 'create',
    source: 'neighborhood_fallback',
    environment: existing || fallback,
    distanceMeters: 0,
  };
  cache.set(key, result);
  return result;
}

function mapLocalEnvironmentFallback(item) {
  const neighborhood = cleanupText(item.address?.neighborhood || '');
  const city = cleanupText(item.address?.city || '');
  const state = cleanupText(item.address?.state || '');
  const baseName = truncate(neighborhood || city || 'Ambiente pendente de busca', 150);
  const name = buildEnvironmentName(baseName, city);

  return {
    id: stableUuid(`local-env:${item.sourceId}:${name}:${item.latitude}:${item.longitude}`),
    name,
    slug: slugify([name, city, state].filter(Boolean).join(' ')),
    type: 'residential',
    status: 'active',
    google_place_id: null,
    address: '',
    latitude: item.latitude,
    longitude: item.longitude,
    requires_moderator_approval: false,
    requires_radius_validation: true,
    neighborhood,
    city,
    state,
  };
}

async function googleNearbyCondos(latitude, longitude) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': GOOGLE_FIELDS,
    },
    body: JSON.stringify({
      includedTypes: CONDOMINIUM_TYPES,
      maxResultCount: 10,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 3000,
        },
      },
    }),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'Falha ao consultar Google Places Nearby.');
  return (Array.isArray(json.places) ? json.places : [])
    .filter(isConfidentCondominiumPlace)
    .sort((a, b) => scoreCondominiumPlace(b) - scoreCondominiumPlace(a));
}

async function googleReverseGeocode(latitude, longitude) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${latitude},${longitude}`);
  url.searchParams.set('key', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('region', 'br');

  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok || json.status !== 'OK') throw new Error(json?.error_message || `Falha ao consultar Geocoding: ${json?.status}`);
  return json.results?.[0];
}

function mapGooglePlaceToEnvironment(place) {
  const components = Array.isArray(place.addressComponents) ? place.addressComponents : [];
  const city = pickGoogleComponent(components, ['locality', 'administrative_area_level_2']);
  const baseName = truncate(place.displayName?.text || 'Ambiente importado', 150);
  const name = buildEnvironmentName(baseName, city);
  return {
    id: stableUuid(`google-env:${place.id}`),
    name,
    slug: slugify(name),
    type: inferCurrentEnvironmentType(place.primaryType),
    status: 'active',
    google_place_id: place.id,
    address: place.formattedAddress || '',
    latitude: Number(place.location?.latitude ?? 0),
    longitude: Number(place.location?.longitude ?? 0),
    requires_moderator_approval: false,
    requires_radius_validation: true,
    neighborhood: pickGoogleComponent(components, ['neighborhood', 'sublocality', 'sublocality_level_1']),
    city,
    state: pickGoogleComponent(components, ['administrative_area_level_1']),
  };
}

function mapGeocodeToEnvironment(result) {
  const components = Array.isArray(result?.address_components) ? result.address_components : [];
  const neighborhood = pickGeocodeComponent(components, ['sublocality_level_1', 'sublocality', 'neighborhood']) || pickGeocodeComponent(components, ['locality']);
  const city = pickGeocodeComponent(components, ['locality', 'administrative_area_level_2']);
  const state = pickGeocodeComponent(components, ['administrative_area_level_1']);
  const baseName = truncate(neighborhood || city || 'Regiao importada', 150);
  const name = buildEnvironmentName(baseName, city);

  return {
    id: stableUuid(`google-geocode-env:${result?.place_id || name}`),
    name,
    slug: slugify([name, city, state].filter(Boolean).join(' ')),
    type: 'residential',
    status: 'active',
    google_place_id: result?.place_id || null,
    address: result?.formatted_address || [name, city, state].filter(Boolean).join(', '),
    latitude: Number(result?.geometry?.location?.lat ?? 0),
    longitude: Number(result?.geometry?.location?.lng ?? 0),
    requires_moderator_approval: false,
    requires_radius_validation: true,
    neighborhood,
    city,
    state,
  };
}

function inferCurrentEnvironmentType(primaryType) {
  const value = String(primaryType || '').toLowerCase();
  if (['church', 'place_of_worship', 'cathedral', 'chapel', 'temple'].includes(value)) return 'church';
  if (value === 'shopping_mall') return 'club';
  return 'residential';
}

function isConfidentCondominiumPlace(place) {
  const name = normalizeLooseText(place?.displayName?.text || '');
  if (!name) return false;
  if (!CONDOMINIUM_TYPES.includes(String(place?.primaryType || ''))) return false;
  if (NEGATIVE_ENVIRONMENT_HINTS.some((hint) => name === hint || name.startsWith(`${hint} `) || name.endsWith(` ${hint}`))) return false;
  if (name.length < 6) return false;
  return CONDOMINIUM_NAME_HINTS.some((hint) => name.includes(hint));
}

function scoreCondominiumPlace(place) {
  const name = normalizeLooseText(place?.displayName?.text || '');
  let score = 0;
  for (const hint of CONDOMINIUM_NAME_HINTS) {
    if (name.includes(hint)) score += 10;
  }
  if (name.includes('condominio')) score += 20;
  if (name.includes('residencial')) score += 15;
  if (name.includes('edificio') || name.includes('predio')) score += 12;
  return score;
}

function buildRecord(item, resolution, existingState, schema) {
  const reasons = [...item.invalidReasons];
  const existingService = existingState.serviceById.get(item.serviceId) || null;
  const whatsappConflict = item.whatsapp ? existingState.serviceByWhatsapp.get(item.whatsapp) : null;
  const instagramConflict = item.instagram ? existingState.serviceByInstagram.get(item.instagram) : null;

  if (whatsappConflict && whatsappConflict.provider_id !== item.userId && whatsappConflict.id !== item.serviceId) {
    reasons.push('WhatsApp ja utilizado por outro servico.');
  }
  if (instagramConflict && instagramConflict.provider_id !== item.userId && instagramConflict.id !== item.serviceId) {
    reasons.push('Instagram ja utilizado por outro servico.');
  }

  return {
    item,
    resolution,
    existingUser: existingState.userByEmail.get(String(item.userEmail).toLowerCase()) || existingState.userById.get(item.userId) || null,
    existingService,
    existingMembership: null,
    existingLink: existingState.linkByKey.get(`${item.serviceId}:${resolution.environment.id}`) || null,
    categoryPending: Boolean(item.category.pending),
    isInvalid: reasons.length > 0,
    reasons,
    schema,
  };
}

function summarizePlan(records) {
  const valid = records.filter((r) => !r.isInvalid);
  const envCreationKeys = new Set(valid.filter((r) => r.resolution.mode === 'create').map((r) => r.resolution.environment.google_place_id || r.resolution.environment.slug));
  const approvals = loadApprovals();

  return {
    summary: {
      sourceRecords: records.length,
      validRecords: valid.length,
      invalidRecords: records.length - valid.length,
      uniqueUsers: new Set(valid.map((r) => r.item.userId)).size,
      environmentsToCreate: envCreationKeys.size,
      environmentsToReuse: valid.filter((r) => r.resolution.mode === 'reuse').length,
      membershipsToCreate: valid.filter((r) => !r.existingMembership).length,
      servicesToCreate: valid.filter((r) => !r.existingService).length,
      servicesToUpdate: valid.filter((r) => Boolean(r.existingService)).length,
      linksToCreate: valid.filter((r) => !r.existingLink).length,
      imagesReferenced: valid.reduce((sum, r) => sum + r.item.images.length, 0),
      pendingCategories: valid.filter((r) => r.categoryPending).length,
    },
    invalidSamples: records.filter((r) => r.isInvalid).slice(0, 20).map((r) => ({ sourceId: r.item.sourceId, title: r.item.title, reasons: r.reasons })),
    environmentSamples: valid.slice(0, 20).map((r) => ({
      sourceId: r.item.sourceId,
      title: r.item.title,
      environmentMode: r.resolution.mode,
      environmentSource: r.resolution.source,
      environmentName: r.resolution.environment.name,
      googlePlaceId: r.resolution.environment.google_place_id,
      address: r.resolution.environment.address,
      distanceMeters: r.resolution.distanceMeters,
    })),
    reviewRecords: records.map((r) => ({
      sourceId: r.item.sourceId,
      approved: approvals.approvedSourceIds.includes(r.item.sourceId),
      title: r.item.title,
      businessName: r.item.businessName,
      userEmail: r.item.userEmail,
      whatsapp: r.item.whatsapp,
      instagram: r.item.instagram,
      cnpj: r.item.cnpj || null,
      category: r.item.category.label,
      categoryPending: r.categoryPending,
      categoryReason: r.item.category.reason,
      description: r.item.description,
      coordinates: { latitude: r.item.latitude, longitude: r.item.longitude },
      address: r.item.address,
      imagesCount: r.item.images.length,
      imageSamples: r.item.images.slice(0, 3),
      environment: {
        mode: r.resolution.mode,
        source: r.resolution.source,
        name: r.resolution.environment.name,
        slug: r.resolution.environment.slug,
        type: r.resolution.environment.type,
        googlePlaceId: r.resolution.environment.google_place_id || null,
        address: r.resolution.environment.address,
        latitude: r.resolution.environment.latitude,
        longitude: r.resolution.environment.longitude,
        distanceMeters: r.resolution.distanceMeters,
      },
      existing: {
        user: Boolean(r.existingUser),
        service: Boolean(r.existingService),
        membership: Boolean(r.existingMembership),
        link: Boolean(r.existingLink),
      },
      invalid: r.isInvalid,
      reasons: r.reasons,
    })),
    records,
  };
}

function printDryRun(plan, options, schema) {
  const approvals = loadApprovals();
  const output = {
    schema,
    summary: plan.summary,
    invalidSamples: plan.invalidSamples,
    environmentSamples: plan.environmentSamples,
    approvals,
    reviewRecords: plan.reviewRecords,
  };
  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log('Dry-run do importador Roteiro Comercial');
  for (const [key, value] of Object.entries(plan.summary)) {
    console.log(`${key}: ${value}`);
  }
  console.log(`schema.importSource: ${schema.importSource}`);
  console.log(`schema.cnpj: ${schema.cnpj}`);
  console.log(`schema.publisherType: ${schema.publisherType}`);
  console.log(`schema.accessType: ${schema.accessType}`);
  console.log(`schema.googlePlaceId: ${schema.googlePlaceId}`);
  console.log(`approvedRecords: ${approvals.approvedSourceIds.length}`);

  if (plan.invalidSamples.length) {
    console.log('\nPrimeiros invalidos:');
    for (const row of plan.invalidSamples.slice(0, 10)) {
      console.log(`- ${row.sourceId} | ${row.title}`);
      for (const reason of row.reasons) console.log(`  - ${reason}`);
    }
  }

  console.log('\nPrimeiros ambientes resolvidos:');
  for (const row of plan.environmentSamples.slice(0, 10)) {
    console.log(`- ${row.sourceId} | ${row.environmentName} | ${row.environmentSource} | ${row.environmentMode}`);
  }
}

async function createBackup(client) {
  const dir = path.join(backupsRoot, timestampForPath());
  fs.mkdirSync(dir, { recursive: true });

  const tables = [
    ['users', '*'],
    ['environments', '*'],
    ['environment_members', '*'],
    ['services', '*'],
    ['service_environment_links', '*'],
    ['reviews', '*'],
    ['subscriptions', '*'],
    ['reports', '*'],
    ['user_place_favorites', '*'],
  ];

  for (const [table, select] of tables) {
    try {
      const rows = await fetchAll(client, table, select);
      fs.writeFileSync(path.join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
    } catch (error) {
      fs.writeFileSync(path.join(dir, `${table}.error.txt`), String(error instanceof Error ? error.message : error));
    }
  }
}

async function applyPlan(client, records, existingState, uploadClient, skipImages, approvedOnly) {
  const result = {
    environmentsCreated: 0,
    authUsersCreated: 0,
    usersCreatedOrUpdated: 0,
    membershipsCreatedOrUpdated: 0,
    servicesCreatedOrUpdated: 0,
    linksCreatedOrUpdated: 0,
    imagesUploaded: 0,
    skippedInvalid: records.filter((r) => r.isInvalid).length,
    failures: [],
  };

  const envCreatedByKey = new Map();
  const approvals = loadApprovals();
  const approvedSet = new Set(approvals.approvedSourceIds);
  const actionableRecords = records.filter((r) => !r.isInvalid && (!approvedOnly || approvedSet.has(r.item.sourceId)));
  result.approvedFilterEnabled = approvedOnly;
  result.recordsSelectedForApply = actionableRecords.length;
  result.categoriesMapped = Object.fromEntries(
    actionableRecords.map((record) => [record.item.sourceId, record.item.category.label]),
  );

  for (const record of actionableRecords) {
    try {
      const envKey = record.resolution.environment.google_place_id || record.resolution.environment.slug;
      let environmentId =
        envCreatedByKey.get(envKey)
        || existingState.environmentByGooglePlaceId.get(record.resolution.environment.google_place_id || '')?.id
        || existingState.environmentBySlug.get(record.resolution.environment.slug)?.id
        || null;

      if (!environmentId) {
        const resolvedEnvironment = await ensureEnvironment(client, existingState, record.resolution.environment);
        environmentId = resolvedEnvironment.id;
        envCreatedByKey.set(envKey, environmentId);
        if (resolvedEnvironment.created) result.environmentsCreated += 1;
      }

      const authUser = await resolveImportedAuthUser(client, existingState, record.item);
      if (authUser.created) result.authUsersCreated += 1;

      const importedUserId = authUser.id;
      const importedUserUploadSession = skipImages ? null : await uploadClient.createSession(record.item.userEmail, authUser.password);

      const userWrite = await client.from('users').upsert({
        id: importedUserId,
        email: record.item.userEmail,
        name: record.item.businessName,
        role: 'user',
        plan: 'free',
        avatar: null,
      }, { onConflict: 'id' });
      if (userWrite.error) throw new Error(`users: ${userWrite.error.message}`);
      result.usersCreatedOrUpdated += 1;
      existingState.userById.set(importedUserId, {
        id: importedUserId,
        email: record.item.userEmail,
        name: record.item.businessName,
      });
      existingState.userByEmail.set(String(record.item.userEmail).toLowerCase(), {
        id: importedUserId,
        email: record.item.userEmail,
        name: record.item.businessName,
      });

      const membershipWrite = await client.from('environment_members').upsert({
        user_id: importedUserId,
        environment_id: environmentId,
        status: 'active',
        role: 'member',
        access_type: 'service_provider',
      }, { onConflict: 'user_id,environment_id' });
      if (membershipWrite.error) throw new Error(`environment_members: ${membershipWrite.error.message}`);
      result.membershipsCreatedOrUpdated += 1;

      let internalImages = Array.isArray(record.existingService?.images_urls)
        ? record.existingService.images_urls.filter((value) => typeof value === 'string' && isInternalImageUrl(value))
        : [];
      let mainImage = isInternalImageUrl(record.existingService?.image_url) ? record.existingService.image_url : null;

      if (!skipImages && uploadClient && importedUserUploadSession && (!mainImage || internalImages.length === 0)) {
        internalImages = [];
        const uploadedHashes = new Set();
        for (const url of record.item.images) {
          try {
            const uploaded = await uploadClient.uploadRemoteImage(importedUserUploadSession, url, uploadedHashes);
            internalImages.push(uploaded);
            result.imagesUploaded += 1;
          } catch (error) {
            result.failures.push({ stage: 'images', sourceId: record.item.sourceId, error: String(error instanceof Error ? error.message : error) });
          }
        }
        mainImage = internalImages[0] || null;
      }

      const serviceWrite = await client.from('services').upsert({
        id: record.item.serviceId,
        slug: slugify(record.item.source.slug || record.item.title),
        title: record.item.title,
        description: record.item.description,
        category: record.item.category.label,
        image_url: mainImage,
        images_urls: internalImages,
        provider_id: importedUserId,
        provider: record.item.businessName,
        whatsapp: record.item.whatsapp,
        instagram: record.item.instagram ? `@${record.item.instagram.replace(/^@/, '')}` : null,
        website_url: null,
        cnpj: record.item.cnpj || null,
        publisher_type: 'service_provider',
        frequency: null,
        status: 'active',
        is_active: true,
        environment_id: environmentId,
        latitude: record.item.latitude,
        longitude: record.item.longitude,
        menu: [],
        tags: [],
        import_source: IMPORT_SOURCE,
      }, { onConflict: 'id' });
      if (serviceWrite.error) throw new Error(`services: ${serviceWrite.error.message}`);
      result.servicesCreatedOrUpdated += 1;

      const linkWrite = await client.from('service_environment_links').upsert({
        service_id: record.item.serviceId,
        environment_id: environmentId,
        created_by: importedUserId,
      }, { onConflict: 'service_id,environment_id' });
      if (linkWrite.error) throw new Error(`service_environment_links: ${linkWrite.error.message}`);
      result.linksCreatedOrUpdated += 1;
    } catch (error) {
      result.failures.push({ stage: 'record', sourceId: record.item.sourceId, error: String(error instanceof Error ? error.message : error) });
    }
  }

  return result;
}

async function resolveImportedAuthUser(client, existingState, item) {
  const emailKey = String(item.userEmail).toLowerCase();
  const existingProfile = existingState.userByEmail.get(emailKey);
  const password = buildImportedUserPassword(item.userEmail);
  if (existingProfile?.id) {
    const updated = await client.auth.admin.updateUserById(existingProfile.id, {
      password,
      email_confirm: true,
      user_metadata: {
        name: item.businessName,
        import_source: IMPORT_SOURCE,
      },
      app_metadata: {
        provider: 'email',
        imported: true,
        import_source: IMPORT_SOURCE,
      },
    });
    if (updated.error) {
      throw new Error(`auth.users: ${updated.error.message}`);
    }
    return { id: existingProfile.id, created: false, password };
  }

  const created = await client.auth.admin.createUser({
    email: item.userEmail,
    password,
    email_confirm: true,
    user_metadata: {
      name: item.businessName,
      import_source: IMPORT_SOURCE,
    },
    app_metadata: {
      provider: 'email',
      imported: true,
      import_source: IMPORT_SOURCE,
    },
  });

  if (created.error || !created.data.user?.id) {
    throw new Error(`auth.users: ${created.error?.message || 'Falha ao criar usuario autenticavel.'}`);
  }

  return { id: created.data.user.id, created: true, password };
}

function buildImportedUserPassword(email) {
  const hash = crypto.createHash('sha256').update(`${IMPORT_SOURCE}:${String(email).toLowerCase()}`).digest('hex');
  return `Imp!${hash.slice(0, 20)}Aa1`;
}

async function ensureEnvironment(client, existingState, environment) {
  const byGooglePlaceId = environment.google_place_id
    ? existingState.environmentByGooglePlaceId.get(environment.google_place_id) || null
    : null;
  if (byGooglePlaceId?.id) {
    return { id: byGooglePlaceId.id, created: false };
  }

  const bySlug = existingState.environmentBySlug.get(environment.slug) || null;
  if (bySlug?.id) {
    return { id: bySlug.id, created: false };
  }

  const payload = {
    name: environment.name,
    slug: environment.slug,
    type: environment.type,
    status: 'active',
    google_place_id: environment.google_place_id,
    address: environment.address,
    latitude: environment.latitude,
    longitude: environment.longitude,
    requires_moderator_approval: environment.requires_moderator_approval,
    requires_radius_validation: environment.requires_radius_validation,
  };

  const inserted = await client
    .from('environments')
    .insert(payload)
    .select('id,name,slug,google_place_id')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(`environments: ${inserted.error?.message || 'Falha ao criar ambiente.'}`);
  }

  const createdRecord = inserted.data;
  existingState.environmentBySlug.set(String(createdRecord.slug || environment.slug), createdRecord);
  if (createdRecord.google_place_id) {
    existingState.environmentByGooglePlaceId.set(createdRecord.google_place_id, createdRecord);
  }

  return { id: createdRecord.id, created: true };
}

function loadApprovals() {
  if (!fs.existsSync(approvalsPath)) {
    return { approvedSourceIds: [], updatedAt: null };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(approvalsPath, 'utf8'));
    return {
      approvedSourceIds: Array.isArray(parsed?.approvedSourceIds) ? parsed.approvedSourceIds.map(String) : [],
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return { approvedSourceIds: [], updatedAt: null };
  }
}

function cachePreview(plan, options) {
  if (Array.isArray(options?.sourceIds) && options.sourceIds.length > 0) {
    return;
  }
  fs.writeFileSync(
    previewCachePath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        isPartial: false,
        summary: plan.summary,
        invalidSamples: plan.invalidSamples,
        environmentSamples: plan.environmentSamples,
        reviewRecords: plan.reviewRecords,
      },
      null,
      2,
    ),
  );
}

async function createImageUploadClient(skipImages) {
  if (skipImages) return null;

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL',
    'NEXT_PUBLIC_R2_PUBLIC_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) throw new Error(`Variavel obrigatoria ausente para upload: ${key}`);
  }

  return {
    async createSession(email, password) {
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error) throw new Error(`Falha ao autenticar usuario importado para upload: ${signIn.error.message}`);

      return client;
    },

    async uploadRemoteImage(client, remoteUrl, uploadedHashes) {
      const { bytes, contentType } = await fetchRemoteImageAsset(remoteUrl);
      validateImageBytes(bytes, remoteUrl);
      const imageHash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (uploadedHashes.has(imageHash)) {
        throw new Error(`Imagem duplicada descartada: ${remoteUrl}`);
      }
      uploadedHashes.add(imageHash);
      const objectPath = `services/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;

      let edgeUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
      if (!edgeUrl.includes('r2-signed-upload')) {
        edgeUrl = edgeUrl.endsWith('/') ? `${edgeUrl}r2-signed-upload` : `${edgeUrl}/r2-signed-upload`;
      }

      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Sessao de upload indisponivel.');

      const signed = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ path: objectPath, contentType }),
      });
      if (!signed.ok) throw new Error(`Falha ao solicitar URL assinada para ${remoteUrl}`);
      const { uploadUrl } = await signed.json();

      const uploaded = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: bytes,
      });
      if (!uploaded.ok) throw new Error(`Falha ao enviar imagem para storage interno: ${remoteUrl}`);

      return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${objectPath}`;
    },
  };
}

async function filterValidUniqueImageUrls(urls, options = {}) {
  const validUrls = [];
  const hashes = new Set();
  const canonicalKeys = new Set();

  for (const url of Array.isArray(urls) ? urls : []) {
    try {
      const canonicalKey = canonicalizeImageUrl(url);
      if (!canonicalKey) continue;
      if (canonicalKeys.has(canonicalKey)) continue;
      canonicalKeys.add(canonicalKey);
      if (options.skipRemoteValidation) {
        validUrls.push(url);
        if (validUrls.length >= 5) break;
        continue;
      }
      const { bytes } = await fetchRemoteImageAsset(url);
      validateImageBytes(bytes, url);
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hashes.has(hash)) continue;
      hashes.add(hash);
      validUrls.push(url);
    } catch {
      // Preview ignores invalid/corrupted image candidates.
    }
    if (validUrls.length >= 5) break;
  }

  return validUrls;
}

async function fetchRemoteImageAsset(remoteUrl) {
  const original = await fetch(remoteUrl);
  if (!original.ok) throw new Error(`Falha ao baixar imagem externa: ${remoteUrl}`);
  const bytes = Buffer.from(await original.arrayBuffer());
  const contentType = original.headers.get('content-type') || detectImageContentType(bytes);
  return { bytes, contentType };
}

function printApplyResult(result, options) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Importacao concluida');
  for (const [key, value] of Object.entries(result)) {
    if (key === 'failures') continue;
    console.log(`${key}: ${value}`);
  }
  if (result.failures.length) {
    console.log('\nFalhas:');
    for (const row of result.failures.slice(0, 20)) {
      console.log(`- [${row.stage}] ${row.sourceId || ''} ${row.error}`);
    }
  }
}

function extractBusinessName(item) {
  const text = decodeHtml(stripHtml(item.content_html || ''));
  const patterns = [/empresa\s*:\s*([^\n\r]+)/i, /loja\s*:\s*([^\n\r]+)/i, /estabelecimento\s*:\s*([^\n\r]+)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = sanitizePublicText(match?.[1] || '');
    if (value && !looksLikePromotionText(value)) return value;
  }
  return null;
}

function extractInstagramHandle(item) {
  const direct = normalizeInstagramHandle(item.instagram);
  if (direct) return direct;

  const candidates = [
    item.summary,
    item.content_html,
    item.title,
    item.description,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const text = String(candidate);
    const urlMatch = text.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
    if (urlMatch?.[1]) {
      const normalized = normalizeInstagramHandle(urlMatch[0]);
      if (normalized) return normalized;
    }

    const handleMatch = text.match(/(?:^|\s)@([A-Za-z0-9._]{3,30})(?![A-Za-z0-9._])/);
    if (handleMatch?.[1]) {
      const normalized = normalizeInstagramHandle(handleMatch[1]);
      if (normalized) return normalized;
    }
  }

  return null;
}

function cleanTitle(title, businessName) {
  const sanitized = sanitizePublicText(title);
  if (!sanitized) return '';
  if (!businessName) return sanitized;
  if (normalizeLooseText(sanitized).includes(normalizeLooseText(businessName))) return sanitized;
  if (looksLikePromotionText(sanitized)) return `${businessName} - ${sanitized}`;
  return sanitized;
}

function buildDescription(item, businessName, title, rawAddress) {
  const parts = [sanitizePublicText(item.summary), sanitizePublicText(decodeHtml(stripHtml(item.content_html || '')))].filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const part of parts) {
    const normalized = normalizeLooseText(part);
    if (!normalized || seen.has(normalized)) continue;
    if (title && normalized.includes(normalizeLooseText(title))) continue;
    seen.add(normalized);
    unique.push(part);
  }
  const serviceAddress = cleanupText(rawAddress);
  if (serviceAddress) {
    unique.push(`Endereço do serviço: ${serviceAddress}`);
  }
  return truncate(unique.join(' ') || `${businessName || title}.`, 4000);
}

function sanitizePublicText(value) {
  return cleanupText(decodeHtml(String(value || '')))
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\+\s*informacoes?.*/gi, ' ')
    .replace(/\broteiro comercial\b/gi, ' ')
    .replace(/\bencontrei sua empresa no app roteiro comercial\b/gi, ' ')
    .replace(/\bencontrei sua empresa no site roteiro comercial\b/gi, ' ')
    .replace(/\s+\/\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWhatsapp(raw) {
  const text = cleanupText(raw);
  if (!text) return null;
  try {
    const url = new URL(text);
    return finalizeWhatsappDigits(normalizePhoneDigits(url.searchParams.get('phone') || url.pathname));
  } catch {
    return finalizeWhatsappDigits(normalizePhoneDigits(text));
  }
}

function normalizeInstagramHandle(raw) {
  const text = cleanupText(raw);
  if (!text) return null;
  let candidate = text;
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      if (url.hostname.replace(/^www\./, '').toLowerCase() !== 'instagram.com') return null;
      candidate = url.pathname.split('/').filter(Boolean)[0] || '';
    } catch {
      candidate = text;
    }
  }
  candidate = candidate.replace(/^@+/, '').replace(/\/+$/, '').trim().toLowerCase();
  return candidate || null;
}

function parseAddress(raw) {
  const cleaned = cleanupText(raw).replace(/^✅\s*/u, '');
  const parts = cleaned.split(' - ').map(cleanupText).filter(Boolean);
  const firstPart = parts[0] || '';
  let street = firstPart;
  let number = '';
  let neighborhood = '';
  let city = '';
  let state = '';

  const commaSegments = firstPart.split(',').map(cleanupText).filter(Boolean);
  if (commaSegments.length >= 2) {
    street = commaSegments[0];
    const numberMatch = commaSegments[1].match(/^(\d+[A-Za-z0-9/-]*)/);
    if (numberMatch) {
      number = cleanupText(numberMatch[1]);
    }
  }

  if (!number) {
    const streetNumberMatch = firstPart.match(/^(.*?)[,\s]+(\d+[A-Za-z0-9/-]*)(?:\b|$)/);
    if (streetNumberMatch) {
      street = cleanupText(streetNumberMatch[1]);
      number = cleanupText(streetNumberMatch[2]);
    }
  }

  const leading = street.match(/^(\d+[A-Za-z0-9/-]*)\s+(.+)$/);
  if (leading) {
    number = number || cleanupText(leading[1]);
    street = cleanupText(leading[2]);
  }

  const last = parts[parts.length - 1] || '';
  const cityState = last.match(/^(.+?)(?:\/|\s+-\s+)([A-Z]{2})$/i);
  if (cityState) {
    city = cleanupText(cityState[1]);
    state = cityState[2].toUpperCase();
    neighborhood = cleanupText(parts[parts.length - 2] || '');
  } else if (parts.length >= 3) {
    neighborhood = cleanupText(parts[parts.length - 2] || '');
    city = cleanupText(parts[parts.length - 1] || '');
  } else if (parts.length === 2) {
    neighborhood = cleanupText(parts[1] || '');
  }

  return {
    raw: cleaned,
    normalized: cleanupText([street, number, neighborhood, city].filter(Boolean).join(', ')),
    street: cleanupText(street),
    number: cleanupText(number),
    neighborhood: cleanupText(neighborhood),
    city: cleanupText(city),
    state: cleanupText(state),
  };
}

function buildEnvironmentName(baseName, city) {
  const cleanBaseName = cleanupText(baseName);
  const cleanCity = cleanupText(city);
  if (!cleanCity) return truncate(cleanBaseName, 150);
  const normalizedBase = normalizeLooseText(cleanBaseName);
  const normalizedCity = normalizeLooseText(cleanCity);
  if (normalizedBase.includes(normalizedCity)) return truncate(cleanBaseName, 150);
  return truncate(`${cleanBaseName} - ${cleanCity}`, 150);
}

function mapCategory(principal, detailed, title, description) {
  const principalText = normalizeLooseText(principal);
  const detailedText = normalizeLooseText(Array.isArray(detailed) ? detailed.join(' ') : '');
  const titleText = normalizeLooseText(title);
  const descriptionText = normalizeLooseText(description);
  let best = null;
  for (const rule of CATEGORY_RULES_V2) {
    const score = scoreRule(rule, principalText, detailedText, titleText, descriptionText);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { label: rule.target, score };
  }
  if (best && CANONICAL_CATEGORIES.includes(best.label)) {
    return { label: best.label, pending: false, reason: `score: ${best.score}` };
  }
  return { label: 'Outros', pending: true, reason: `Sem correspondencia clara para "${cleanupText(principal)}"` };
}

function scoreRule(rule, principalText, detailedText, titleText, descriptionText) {
  let score = 0;
  for (const keyword of rule.keywords) {
    if (principalText.includes(keyword)) score += 8;
    if (detailedText.includes(keyword)) score += 5;
    if (titleText.includes(keyword)) score += 4;
    if (descriptionText.includes(keyword)) score += 1;
  }
  return score;
}

function scoreCategoryText(candidate, title, description) {
  const principalText = normalizeLooseText(candidate);
  const titleText = normalizeLooseText(title);
  const descriptionText = normalizeLooseText(description);
  let best = 0;
  for (const rule of CATEGORY_RULES_V2) {
    if (!principalText) continue;
    const score = scoreRule(rule, principalText, '', titleText, descriptionText);
    if (score > best) best = score;
  }
  return best;
}

function collectImageUrls(item) {
  const urls = [];
  const add = (value) => {
    if (typeof value !== 'string') return;
    const url = value.trim();
    if (!/^https?:\/\//i.test(url)) return;
    if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) && !/cmsphoto|resizeapi/i.test(url)) return;
    urls.push(url);
  };
  for (const photo of Array.isArray(item.photos) ? item.photos : []) add(photo);
  add(item.original_thumbnail);
  add(item.large_thumbnail);
  add(item.thumbnail);
  const dedup = new Map();
  for (const url of urls) {
    const key = canonicalizeImageUrl(url);
    if (!dedup.has(key)) dedup.set(key, url);
  }
  return [...dedup.values()].slice(0, 5);
}

function canonicalizeImageUrl(url) {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) return '';

  try {
    const parsed = new URL(cleanUrl);
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    const wwMatch = normalizedPath.match(/\/(\d+)-(\d+)\.(jpg|jpeg|png|webp)$/i);
    if (wwMatch) {
      return `ww-cdn:${wwMatch[1]}-${wwMatch[2]}`;
    }
    const resizeMatch = normalizedPath.match(/\/resizeapi\/([a-f0-9]{20,})\//i);
    if (resizeMatch) {
      return `resizeapi:${resizeMatch[1]}`;
    }
    return `${parsed.hostname.toLowerCase()}${normalizedPath.toLowerCase()}`;
  } catch {
    return cleanUrl.replace(/\?.*$/, '').toLowerCase();
  }
}

function detectImageContentType(bytes) {
  if (!bytes || bytes.length < 12) return 'application/octet-stream';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if ((bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)) return 'image/gif';
  return 'application/octet-stream';
}

function validateImageBytes(bytes, remoteUrl) {
  if (!bytes || bytes.length < 128) {
    throw new Error(`Imagem invalida ou corrompida: ${remoteUrl}`);
  }
  const contentType = detectImageContentType(bytes);
  if (!contentType.startsWith('image/')) {
    throw new Error(`Arquivo baixado nao e imagem valida: ${remoteUrl}`);
  }
}

function buildIdentityKey({ cnpj, whatsapp, instagram, businessName, address }) {
  if (cnpj) return `cnpj:${cnpj}`;
  if (whatsapp) return `whatsapp:${whatsapp}`;
  if (instagram) return `instagram:${instagram}`;
  return `name-address:${normalizeLooseText(businessName)}:${normalizeLooseText(address.normalized || address.raw)}`;
}

function extractCnpj(text) {
  const match = String(text || '').match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  return match ? match[0].replace(/\D/g, '').slice(0, 14) : '';
}

function pickGoogleComponent(components, wantedTypes) {
  for (const component of components) {
    if (component.types?.some((type) => wantedTypes.includes(type)) && component.longText) return component.longText;
  }
  return '';
}

function pickGeocodeComponent(components, wantedTypes) {
  for (const component of components) {
    if (Array.isArray(component.types) && component.types.some((type) => wantedTypes.includes(type)) && component.long_name) return component.long_name;
  }
  return '';
}

function normalizeCoordinate(value, kind) {
  const numeric = Number(String(value ?? '').replace(',', '.').trim());
  if (!Number.isFinite(numeric)) return null;
  if (kind === 'latitude' && (numeric < -90 || numeric > 90)) return null;
  if (kind === 'longitude' && (numeric < -180 || numeric > 180)) return null;
  return Number(numeric.toFixed(8));
}

function normalizePhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || null;
}

function coercePhoneToWhatsapp(phoneDigits) {
  return finalizeWhatsappDigits(phoneDigits);
}

function finalizeWhatsappDigits(phoneDigits) {
  if (!phoneDigits) return null;
  if (phoneDigits.startsWith('55') && (phoneDigits.length === 12 || phoneDigits.length === 13)) return phoneDigits;
  if (phoneDigits.length === 10 || phoneDigits.length === 11) return `55${phoneDigits}`;
  return null;
}

function looksLikePromotionText(text) {
  const normalized = normalizeLooseText(text);
  return ['desconto', 'promo', 'off', 'oferta', 'fgts', 'cadastro direto'].some((token) => normalized.includes(token));
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanupText(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeLooseText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  const slug = normalizeLooseText(value).replace(/\s+/g, '-');
  return slug || 'registro-importado';
}

function truncate(value, maxLength) {
  const text = String(value || '').trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function stableUuid(seed) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function timestampForPath() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function toPositiveInteger(value, fieldName) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) throw new Error(`Valor invalido para ${fieldName}: ${value}`);
  return numeric;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earth * c);
}

function isInternalImageUrl(value) {
  return typeof value === 'string'
    && Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_URL)
    && value.startsWith(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);
}
