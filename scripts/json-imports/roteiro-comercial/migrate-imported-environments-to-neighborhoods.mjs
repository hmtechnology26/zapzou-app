import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

loadEnv(path.join(repoRoot, ".env"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SOURCE = "roteiro_comercial";
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SERVICE_ROLE || !GOOGLE_API_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_GOOGLE_MAPS_API_KEY são obrigatórias.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-") || "bairro-importado";
}

function cleanupText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildEnvironmentName(neighborhood, city) {
  const cleanNeighborhood = cleanupText(neighborhood);
  const cleanCity = cleanupText(city);
  if (!cleanCity) return cleanNeighborhood || "Bairro importado";
  if (!cleanNeighborhood) return cleanCity;
  if (normalize(cleanNeighborhood).includes(normalize(cleanCity))) return cleanNeighborhood;
  return `${cleanNeighborhood} - ${cleanCity}`;
}

async function fetchAll(table, select, queryBuilder) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from(table).select(select).range(from, from + 999);
    query = queryBuilder(query);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");

  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok || json.status !== "OK") {
    throw new Error(json?.error_message || `Falha no Geocoding: ${json?.status || response.status}`);
  }
  return json.results?.[0] || null;
}

function pickGeocodeComponent(components, wantedTypes) {
  for (const component of components || []) {
    if (Array.isArray(component.types) && component.types.some((type) => wantedTypes.includes(type))) {
      return component.long_name || "";
    }
  }
  return "";
}

function mapNeighborhoodEnvironment(result, fallbackLat, fallbackLng) {
  const components = Array.isArray(result?.address_components) ? result.address_components : [];
  const neighborhood =
    pickGeocodeComponent(components, ["sublocality_level_1", "sublocality", "neighborhood"]) ||
    pickGeocodeComponent(components, ["locality"]);
  const city = pickGeocodeComponent(components, ["locality", "administrative_area_level_2"]);
  const state = pickGeocodeComponent(components, ["administrative_area_level_1"]);
  const name = buildEnvironmentName(neighborhood || city || "Bairro importado", city);
  const slug = slugify([name, city, state].filter(Boolean).join(" "));

  return {
    name,
    slug,
    type: "residential",
    status: "active",
    google_place_id: null,
    address: result?.formatted_address || [neighborhood, city, state].filter(Boolean).join(", "),
    latitude: Number(result?.geometry?.location?.lat ?? fallbackLat ?? 0),
    longitude: Number(result?.geometry?.location?.lng ?? fallbackLng ?? 0),
    requires_moderator_approval: false,
    requires_radius_validation: true,
  };
}

async function ensureEnvironment(environmentBySlug, environment) {
  const existing = environmentBySlug.get(environment.slug);
  if (existing?.id) return { id: existing.id, created: false };

  const inserted = await supabase
    .from("environments")
    .insert(environment)
    .select("id,name,slug")
    .single();

  if (inserted.error || !inserted.data?.id) {
    if (inserted.error?.code === "23505") {
      const found = await supabase
        .from("environments")
        .select("id,name,slug")
        .eq("slug", environment.slug)
        .maybeSingle();

      if (found.error) throw found.error;
      if (found.data?.id) {
        environmentBySlug.set(found.data.slug, found.data);
        return { id: found.data.id, created: false };
      }
    }
    throw new Error(inserted.error?.message || "Falha ao criar ambiente.");
  }

  environmentBySlug.set(inserted.data.slug, inserted.data);
  return { id: inserted.data.id, created: true };
}

const services = await fetchAll(
  "services",
  "id,provider_id,environment_id,title",
  (query) => query.eq("import_source", SOURCE),
);

const environments = await fetchAll(
  "environments",
  "id,slug,name,address,latitude,longitude",
  (query) => query,
);

const environmentBySlug = new Map(environments.map((environment) => [String(environment.slug || ""), environment]));
const servicesByEnvironmentId = new Map();
for (const service of services) {
  const list = servicesByEnvironmentId.get(service.environment_id) || [];
  list.push(service);
  servicesByEnvironmentId.set(service.environment_id, list);
}

const preview = [];

for (const [environmentId, groupedServices] of servicesByEnvironmentId.entries()) {
  const currentEnvironment = environments.find((environment) => environment.id === environmentId) || null;
  const latitude = Number(currentEnvironment?.latitude);
  const longitude = Number(currentEnvironment?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    for (const service of groupedServices) {
      preview.push({
        serviceId: service.id,
        title: service.title,
        status: "skipped",
        reason: "Ambiente atual sem latitude/longitude válidas.",
      });
    }
    continue;
  }

  const geocode = await reverseGeocode(latitude, longitude);
  const environment = mapNeighborhoodEnvironment(geocode, latitude, longitude);
  const resolved = await ensureEnvironment(environmentBySlug, environment);

  for (const service of groupedServices) {
    preview.push({
      serviceId: service.id,
      title: service.title,
      oldEnvironmentId: service.environment_id,
      newEnvironmentName: environment.name,
      newEnvironmentSlug: environment.slug,
      newEnvironmentId: resolved.id,
      environmentCreated: resolved.created,
    });

    if (!APPLY) continue;

    const updateService = await supabase
      .from("services")
      .update({ environment_id: resolved.id })
      .eq("id", service.id)
      .eq("import_source", SOURCE);
    if (updateService.error) throw updateService.error;

    const deleteLinks = await supabase
      .from("service_environment_links")
      .delete()
      .eq("service_id", service.id);
    if (deleteLinks.error) throw deleteLinks.error;

    const insertLink = await supabase
      .from("service_environment_links")
      .insert({
        service_id: service.id,
        environment_id: resolved.id,
        created_by: service.provider_id,
      });
    if (insertLink.error) throw insertLink.error;

    const upsertMembership = await supabase
      .from("environment_members")
      .upsert({
        user_id: service.provider_id,
        environment_id: resolved.id,
        role: "member",
        status: "active",
        access_type: "service_provider",
      });
    if (upsertMembership.error) throw upsertMembership.error;
  }
}

const output = {
  mode: APPLY ? "apply" : "dry-run",
  totalImportedServices: services.length,
  processed: preview.filter((item) => item.status !== "skipped").length,
  skipped: preview.filter((item) => item.status === "skipped").length,
  createdEnvironments: preview.filter((item) => item.environmentCreated).length,
  sample: preview.slice(0, 120),
};

fs.writeFileSync(
  path.join(__dirname, "migrate-imported-environments-to-neighborhoods-preview.json"),
  JSON.stringify(output, null, 2),
);

console.log(JSON.stringify(output, null, 2));
