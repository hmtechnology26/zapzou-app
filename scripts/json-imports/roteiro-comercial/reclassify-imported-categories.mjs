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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
}

const APPLY = process.argv.includes("--apply");
const SOURCE = "roteiro_comercial";

const CATEGORY = {
  FOOD: "Alimentação",
  CLEAN: "Limpeza",
  MAINT: "Manutenção",
  AUTO: "Mecânica",
  RESALE: "Revenda",
  PETS: "Agro & Pets",
  BEAUTY: "Beleza",
  TECH: "Tecnologia",
  BUILD: "Construção",
  HEALTH: "Saúde",
  EVENTS: "Eventos",
  FAITH: "Religião",
  CLOTHES: "Vestuário",
  TRANSPORT: "Transporte",
  OTHER: "Outros",
};

const ALL_CATEGORIES = Object.values(CATEGORY);

const RULES = {
  [CATEGORY.PETS]: [
    /\bpet\b/,
    /pet shop/,
    /petshop/,
    /veterin/,
    /\bracao\b/,
    /banho e tosa/,
    /adestrament/,
    /cachorro/,
    /\bgato\b/,
    /\bcao\b/,
  ],
  [CATEGORY.CLOTHES]: [
    /\broupas?\b/,
    /\bcloset\b/,
    /\bboutique\b/,
    /\bmoda\b/,
    /vestuario/,
    /\bcalcados?\b/,
    /lingerie/,
    /moda fitness/,
    /moda praia/,
    /moda intima/,
    /camisetas?/,
    /casacos?/,
    /sex shop/,
  ],
  [CATEGORY.FOOD]: [
    /\brestaurante\b/,
    /\blancheria\b/,
    /\blanchonete\b/,
    /hamburg/,
    /\bpizza\b/,
    /pizzaria/,
    /\bacai\b/,
    /\bcafe\b/,
    /padaria/,
    /confeitaria/,
    /doceria/,
    /\bsushi\b/,
    /sorveteria/,
    /marmit/,
    /\blanche\b/,
    /\bxis\b/,
    /almoco/,
    /porcoes/,
    /hamburgueria/,
    /bebidas?/,
    /cervejas?/,
    /\bpub\b/,
  ],
  [CATEGORY.HEALTH]: [
    /\bclinica\b/,
    /\bmedic/,
    /odont/,
    /psicol/,
    /fisioter/,
    /fono/,
    /nutri/,
    /laboratorio/,
    /\bexames?\b/,
    /hospital/,
    /\bacademia\b/,
    /pilates/,
    /massagem/,
    /terapia/,
    /reabilit/,
    /cardio/,
    /dermato/,
    /urolog/,
    /pediatra/,
    /ressonancia/,
    /tomografia/,
    /ecografia/,
  ],
  [CATEGORY.BEAUTY]: [
    /barbearia/,
    /cabelo/,
    /manicure/,
    /pedicure/,
    /sobrancelha/,
    /cilios/,
    /maquiagem/,
    /depil/,
    /\bestetica\b/,
    /tatuagem/,
    /tattoo/,
    /piercing/,
    /spa\b/,
    /salao/,
  ],
  [CATEGORY.TECH]: [
    /notebook/,
    /celular/,
    /smartphone/,
    /iphone/,
    /samsung/,
    /xiaomi/,
    /informatica/,
    /computadores?/,
    /desktops?/,
    /monitores?/,
    /mouses?/,
    /teclados?/,
    /telecom/,
    /assistencia tecnica/,
    /programacao/,
    /\bhtml\b/,
    /\bpython\b/,
    /impressoras?/,
    /graficas?/,
    /comunicacao visual/,
    /design visual/,
    /impressos?/,
    /marketing digital/,
    /\bsites?\b/,
  ],
  [CATEGORY.BUILD]: [
    /material de construcao/,
    /madeireira/,
    /ferragem/,
    /acabamentos?/,
    /\btintas?\b/,
    /ferramentas?/,
    /vidracaria/,
    /esquadrias?/,
    /aluminio/,
    /marmoraria/,
    /granito/,
    /gesso/,
    /marcenaria/,
    /moveis planejados/,
    /portas? e janelas?/,
    /espelhos?/,
    /vidros?/,
    /persianas?/,
  ],
  [CATEGORY.CLEAN]: [
    /\blimpeza\b/,
    /faxina/,
    /diarista/,
    /higieniz/,
    /lavagem/,
    /limpa estofado/,
    /impermeabilizacao/,
    /dedetiz/,
    /sanitiz/,
  ],
  [CATEGORY.AUTO]: [
    /martelinho/,
    /insulfilm/,
    /peliculas?/,
    /\bppf\b/,
    /envelopamento/,
    /automotiv/,
    /auto center/,
    /auto eletrica/,
    /\bmecanica\b/,
    /injecao eletronica/,
    /airbag/,
    /freios?/,
    /suspensao/,
    /pneus?/,
    /borracharia/,
    /chave automotiva/,
    /multimidia/,
    /estetica automotiva/,
    /lataria/,
    /funilaria/,
    /autopecas?/,
  ],
  [CATEGORY.RESALE]: [
    /\brevenda\b/,
    /seminovos?/,
    /usados?/,
    /multimarcas/,
    /veiculos?/,
    /automoveis?/,
    /\bimoveis\b/,
    /imobiliari/,
    /compra e venda/,
    /locacao de imoveis/,
    /corretor/,
  ],
  [CATEGORY.TRANSPORT]: [
    /auto escola/,
    /primeira habilitacao/,
    /renovacao/,
    /mudanca de categoria/,
    /adicao de categoria/,
    /\bfrete\b/,
    /\bmudanca\b/,
    /motoboy/,
    /\btaxi\b/,
    /\buber\b/,
    /guincho/,
    /van\b/,
  ],
  [CATEGORY.EVENTS]: [
    /eventos?/,
    /decorac/,
    /buffet/,
    /cerimonial/,
    /casamento/,
    /aniversario/,
    /festa/,
    /fantasias adulto/,
    /locacao de fantasias/,
    /\bdj\b/,
    /fotografia/,
    /filmagem/,
    /paintball/,
  ],
  [CATEGORY.FAITH]: [
    /igreja/,
    /templo/,
    /paroquia/,
    /ministerio/,
    /artigos religiosos/,
    /esoteric/,
    /holistic/,
    /cristais/,
    /incensos?/,
  ],
  [CATEGORY.MAINT]: [
    /chaveiro/,
    /eletricista/,
    /encanador/,
    /marido de aluguel/,
    /ar condicionado/,
    /refrigeracao/,
    /\bconserto\b/,
    /\bmanutencao\b/,
    /\binstalacao\b/,
    /serralheir/,
    /fechadura/,
    /biometrica/,
    /portao/,
    /interfone/,
    /controle de acesso/,
  ],
};

const CATEGORY_ORDER = [
  CATEGORY.PETS,
  CATEGORY.CLOTHES,
  CATEGORY.FOOD,
  CATEGORY.HEALTH,
  CATEGORY.BEAUTY,
  CATEGORY.TECH,
  CATEGORY.BUILD,
  CATEGORY.CLEAN,
  CATEGORY.AUTO,
  CATEGORY.RESALE,
  CATEGORY.TRANSPORT,
  CATEGORY.EVENTS,
  CATEGORY.FAITH,
  CATEGORY.MAINT,
];

const TITLE_STRONG_RULES = {
  [CATEGORY.CLOTHES]: [
    /\bmoda\b/,
    /\bmodas\b/,
    /\bcloset\b/,
    /\bcalcados?\b/,
    /\bshoes\b/,
    /\bbrecho\b/,
    /\bstore\b/,
  ],
  [CATEGORY.FOOD]: [
    /\brestaurante\b/,
    /\blanches?\b/,
    /\bpizzas?\b/,
    /\bacai\b/,
    /\bcafe\b/,
    /\bhamburgueria\b/,
    /\bsushi\b/,
  ],
  [CATEGORY.BEAUTY]: [/tattoo/, /barber/, /barbearia/, /estetica/, /salao/],
  [CATEGORY.RESALE]: [/\bveiculos?\b/, /\bimoveis\b/, /multimarcas/, /\brevenda\b/],
  [CATEGORY.TRANSPORT]: [/auto escola/, /\bcfc\b/],
  [CATEGORY.TECH]: [/grafica/, /comunicacao visual/, /telecom/, /notebook/, /informatica/],
  [CATEGORY.AUTO]: [/auto center/, /\bmecanica\b/, /auto eletrica/, /martelinho/, /films?\b/, /rodas?\b/, /pneus?\b/],
  [CATEGORY.PETS]: [/pet/, /veterin/, /adestramento/],
};

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
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function countMatches(text, expressions) {
  return expressions.reduce((count, expression) => count + (expression.test(text) ? 1 : 0), 0);
}

function canonicalCategory(value) {
  const normalized = normalize(value);
  const found = ALL_CATEGORIES.find((category) => normalize(category) === normalized);
  return found || CATEGORY.OTHER;
}

function classifyService(service) {
  const text = normalize(`${service.title || ""} ${service.description || ""}`);
  const title = normalize(service.title || "");
  const scores = Object.fromEntries(
    CATEGORY_ORDER.map((category) => [category, countMatches(text, RULES[category])]),
  );

  for (const category of Object.keys(TITLE_STRONG_RULES)) {
    if (TITLE_STRONG_RULES[category].some((expression) => expression.test(title))) {
      scores[category] += 2;
    }
  }

  if (scores[CATEGORY.PETS] > 0) scores[CATEGORY.HEALTH] = Math.max(0, scores[CATEGORY.HEALTH] - 2);
  if (scores[CATEGORY.BEAUTY] > 0) scores[CATEGORY.FOOD] = Math.max(0, scores[CATEGORY.FOOD] - 1);
  if (scores[CATEGORY.AUTO] > 0) scores[CATEGORY.MAINT] = Math.max(0, scores[CATEGORY.MAINT] - 1);

  const ranked = CATEGORY_ORDER
    .filter((category) => scores[category] > 0)
    .sort((left, right) => scores[right] - scores[left]);

  const current = canonicalCategory(service.category);
  if (ranked.length === 0) {
    return { current, proposed: current, confidence: 0 };
  }

  const best = ranked[0];
  const confidence = scores[best];

  if (current === CATEGORY.FOOD && best === CATEGORY.EVENTS) {
    return { current, proposed: current, confidence };
  }

  if (
    current === CATEGORY.BEAUTY &&
    best === CATEGORY.HEALTH &&
    (/estetica/.test(title) || /beauty/.test(title))
  ) {
    return { current, proposed: current, confidence };
  }

  if (current === CATEGORY.OTHER) {
    const hasStrongTitleMatch = (TITLE_STRONG_RULES[best] || []).some((expression) => expression.test(title));
    if (confidence >= 2 || hasStrongTitleMatch) {
      return { current, proposed: best, confidence };
    }
    return { current, proposed: current, confidence };
  }

  if (
    current !== best &&
    confidence >= 3 &&
    !(current === CATEGORY.PETS && best === CATEGORY.HEALTH)
  ) {
    return { current, proposed: best, confidence };
  }

  return { current, proposed: current, confidence };
}

async function fetchImportedServices() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("services")
      .select("id,title,description,category")
      .eq("import_source", SOURCE)
      .order("id", { ascending: true })
      .range(from, from + 999);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function updateChunk(ids, category) {
  const { error } = await supabase
    .from("services")
    .update({ category })
    .in("id", ids)
    .eq("import_source", SOURCE);

  if (error) throw error;
}

const services = await fetchImportedServices();
const mapped = services.map((service) => ({
  id: service.id,
  title: service.title || "",
  current: canonicalCategory(service.category),
  ...classifyService(service),
}));

const changes = mapped.filter((item) => item.current !== item.proposed);
const grouped = new Map();
for (const item of changes) {
  const list = grouped.get(item.proposed) || [];
  list.push(item.id);
  grouped.set(item.proposed, list);
}

const proposedSummary = Object.fromEntries(
  ALL_CATEGORIES.map((category) => [category, mapped.filter((item) => item.proposed === category).length]),
);

const output = {
  totalImported: mapped.length,
  changes: changes.length,
  proposedSummary,
  sample: changes.slice(0, 100),
};

fs.writeFileSync(
  path.join(__dirname, "category-reclassification-preview.json"),
  JSON.stringify(output, null, 2),
);

if (!APPLY) {
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

let updated = 0;
for (const [category, ids] of grouped.entries()) {
  for (let index = 0; index < ids.length; index += 100) {
    const chunk = ids.slice(index, index + 100);
    await updateChunk(chunk, category);
    updated += chunk.length;
  }
}

console.log(
  JSON.stringify(
    {
      totalImported: mapped.length,
      updated,
      categoriesTouched: [...grouped.keys()],
    },
    null,
    2,
  ),
);
