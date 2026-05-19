'use client';

import { useEffect, useMemo, useState } from 'react';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

type ReviewRecord = {
  sourceId: string;
  approved: boolean;
  title: string;
  businessName: string;
  userEmail: string;
  whatsapp: string | null;
  instagram: string | null;
  cnpj: string | null;
  category: string;
  categoryPending: boolean;
  categoryReason: string;
  description: string;
  coordinates: { latitude: number; longitude: number };
  address: { normalized: string; city: string; state: string; neighborhood: string };
  imagesCount: number;
  imageSamples: string[];
  environment: {
    mode: string;
    source: string;
    name: string;
    slug: string;
    type: string;
    googlePlaceId: string | null;
    address: string;
    distanceMeters: number;
  };
  existing: {
    user: boolean;
    service: boolean;
    membership: boolean;
    link: boolean;
  };
  invalid: boolean;
  reasons: string[];
};

type PreviewResponse = {
  schema?: Record<string, boolean>;
  summary?: Record<string, number>;
  reviewRecords?: ReviewRecord[];
  invalidSamples?: Array<{ sourceId: string; title: string; reasons: string[] }>;
  environmentSamples?: Array<Record<string, unknown>>;
  generatedAt?: string;
  isPartial?: boolean;
};

export default function RoteiroImportReviewPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [approvedSourceIds, setApprovedSourceIds] = useState<string[]>([]);
  const [excludedSourceIds, setExcludedSourceIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const excludedSet = useMemo(() => new Set(excludedSourceIds), [excludedSourceIds]);
  const records = useMemo(
    () => (preview?.reviewRecords ?? []).filter((record) => !excludedSet.has(record.sourceId)),
    [preview?.reviewRecords, excludedSet],
  );
  const approvedSet = useMemo(() => new Set(approvedSourceIds), [approvedSourceIds]);
  const insertedCount = records.filter((record) => approvedSet.has(record.sourceId) || record.existing.service).length;
  const previewEndpoint = '/api/admin/imports/roteiro/preview';
  const approvalsEndpoint = '/api/admin/imports/roteiro/approvals';

  async function loadPreview() {
    const res = await fetch(previewEndpoint, { cache: 'no-store' });
    const json = await res.json();
    if (json?.exists && json?.preview) {
      setPreview(json.preview);
    }
  }

  async function loadApprovals() {
    const res = await fetch(approvalsEndpoint, { cache: 'no-store' });
    const json = await res.json();
    setApprovedSourceIds(Array.isArray(json?.approvedSourceIds) ? json.approvedSourceIds : []);
    setExcludedSourceIds(Array.isArray(json?.excludedSourceIds) ? json.excludedSourceIds : []);
  }

  useEffect(() => {
    void Promise.all([loadPreview(), loadApprovals()]);
  }, []);

  useEffect(() => {
    if (!preview) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [preview]);

  async function generatePreview(googleLookup = false) {
    if (googleLookup) setGoogleLoading(true);
    else setLoading(true);
    setError('');
    setStatusMessage('');
    try {
      const res = await fetch(previewEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleLookup,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.preview) {
        throw new Error(json?.error || 'Falha ao gerar preview.');
      }
      setPreview(json.preview);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (googleLookup) setGoogleLoading(false);
      else setLoading(false);
    }
  }

  async function mutateApproval(action: string, sourceId?: string) {
    setMutating(true);
    setError('');
    setStatusMessage('');
    try {
      const res = await fetch(approvalsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sourceId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Falha ao atualizar aprovacoes.');
      }
      setApprovedSourceIds(Array.isArray(json?.approvedSourceIds) ? json.approvedSourceIds : []);
      setExcludedSourceIds(Array.isArray(json?.excludedSourceIds) ? json.excludedSourceIds : []);
      if (action === 'approve-one') {
        setStatusMessage('Servico aprovado e inserido no banco.');
      } else if (action === 'approve-all') {
        setStatusMessage('Servicos aprovados e inseridos no banco.');
      } else if (action === 'exclude-one') {
        setStatusMessage('Bloco removido da lista.');
      } else if (action === 'restore-all') {
        setStatusMessage('Blocos removidos restaurados.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMutating(false);
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <TopAppBar />
      <main className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">Importacao Assistida</p>
              <h1 className="text-2xl font-black tracking-tight text-on-surface">Roteiro Comercial</h1>
              <p className="max-w-3xl text-sm text-on-surface-variant">
                Esta tela gera um preview sem consumir Google no carregamento. A busca de ambiente mais proximo fica manual,
                por botao, antes da insercao individual ou em massa.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => generatePreview(false)}
                disabled={loading || googleLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                <Icon icon="refresh" size={18} />
                {loading ? 'Gerando...' : 'Gerar Preview'}
              </button>
            <button
              type="button"
              onClick={() => generatePreview(true)}
                disabled={loading || googleLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-5 py-3 text-sm font-black text-on-surface disabled:opacity-60"
              >
                <Icon icon="travel_explore" size={18} />
                {googleLoading ? 'Buscando...' : 'Buscar no Google'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              {statusMessage}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => mutateApproval('approve-all')}
              disabled={mutating || !records.length}
              className="rounded-full bg-on-surface px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-60"
            >
              Aprovar e Inserir Todos
            </button>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
              {insertedCount} inseridos
            </div>
            <div className="rounded-full border border-outline-variant/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">
              {records.length} registros carregados
            </div>
            <div className="rounded-full border border-outline-variant/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">
              {excludedSourceIds.length} removidos
            </div>
            <button
              type="button"
              onClick={() => mutateApproval('restore-all')}
              disabled={mutating}
              className="rounded-full border border-outline-variant/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-on-surface disabled:opacity-60"
            >
              Restaurar removidos
            </button>
            <div className="rounded-full border border-outline-variant/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">
              Apply: `node scripts/json-imports/roteiro-comercial/import-roteiro-comercial.mjs --apply --approved-only`
            </div>
          </div>

          {preview?.generatedAt && (
            <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-xs text-on-surface-variant">
              Preview gerado em {new Date(preview.generatedAt).toLocaleString('pt-BR')}
              {preview.isPartial ? ' (parcial)' : ' (completo)'}
            </div>
          )}
        </section>

        {preview?.summary && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Object.entries(preview.summary).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{key}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-on-surface">{value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-4">
          {records.length === 0 ? (
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-8 text-center text-on-surface-variant">
              Gere um preview para revisar os registros antes do apply real.
            </div>
          ) : (
            records.map((record) => {
              const approved = approvedSet.has(record.sourceId) || record.existing.service;
              const previewImages = dedupePreviewImages(record.imageSamples);
              return (
                <article
                  key={record.sourceId}
                  className={`rounded-3xl border p-5 sm:p-6 ${
                    record.invalid
                      ? 'border-error/30 bg-error/5'
                      : approved
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-outline-variant/20 bg-surface-container-low'
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                          {record.sourceId}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                          record.invalid ? 'bg-error/15 text-error' : approved ? 'bg-primary/15 text-primary' : 'bg-surface-container-lowest text-on-surface'
                        }`}>
                          {record.invalid ? 'Invalido' : approved ? 'Inserido' : 'Pendente'}
                        </span>
                        <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface">
                          {record.category}
                        </span>
                        <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface">
                          {formatEnvironmentSource(record.environment.source)}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xl font-black tracking-tight text-on-surface">{record.title}</h2>
                        <p className="text-sm text-on-surface-variant">{record.businessName}</p>
                      </div>

                      <p className="max-w-4xl text-sm leading-6 text-on-surface-variant">{record.description}</p>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Info label="Contato" value={formatPrimaryContact(record.whatsapp, record.instagram)} />
                        <Info label="Instagram" value={formatInstagram(record.instagram)} />
                        <Info label="Endereco" value={record.address.normalized || record.environment.address} />
                        <Info label="Coordenadas" value={`${record.coordinates.latitude}, ${record.coordinates.longitude}`} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Info label="Ambiente sugerido" value={record.environment.name} />
                        <Info label="Tipo" value={record.environment.type} />
                        <Info label="Google Place ID" value={record.environment.googlePlaceId || 'Pendente'} />
                        <Info label="Distancia" value={record.environment.distanceMeters ? `${record.environment.distanceMeters}m` : 'Pendente'} />
                      </div>

                      {record.categoryPending && (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                          Categoria pendente: {record.categoryReason}
                        </div>
                      )}

                      {record.invalid && record.reasons.length > 0 && (
                        <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                          {record.reasons.join(' | ')}
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => mutateApproval('approve-one', record.sourceId)}
                        disabled={mutating || record.invalid || approved}
                        className={`rounded-full px-4 py-3 text-sm font-black ${
                          approved
                            ? 'border border-outline-variant/20 bg-surface-container-lowest text-on-surface'
                            : 'bg-primary text-white'
                        } disabled:opacity-60`}
                      >
                        {approved ? 'Inserido' : 'Aprovar e Inserir'}
                      </button>
                      <button
                        type="button"
                        onClick={() => mutateApproval('exclude-one', record.sourceId)}
                        disabled={mutating || approved}
                        className="rounded-full border border-error/20 bg-error/5 px-4 py-3 text-sm font-black text-error disabled:opacity-60"
                      >
                        Excluir bloco
                      </button>

                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Imagens</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{previewImages.length} imagens</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {previewImages.map((image, index) => (
                            <a
                              key={index}
                              href={image}
                              target="_blank"
                              rel="noreferrer"
                              className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={image} alt="" className="h-20 w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
                        <p>Usuario existente: {record.existing.user ? 'sim' : 'nao'}</p>
                        <p>Servico existente: {record.existing.service ? 'sim' : 'nao'}</p>
                        <p>Membership existente: {record.existing.membership ? 'sim' : 'nao'}</p>
                        <p>Link existente: {record.existing.link ? 'sim' : 'nao'}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function formatEnvironmentSource(value: string) {
  if (value === 'manual_lookup_pending') return 'Busca manual pendente';
  if (value === 'neighborhood_fallback') return 'Fallback bairro';
  if (value === 'condominium') return 'Condominio';
  return value;
}

function formatInstagram(value: string | null) {
  if (!value) return 'Nao informado';
  return value.startsWith('@') ? value : `@${value}`;
}

function formatPrimaryContact(whatsapp: string | null, instagram: string | null) {
  if (whatsapp) return whatsapp;
  if (instagram) return formatInstagram(instagram);
  return 'Sem contato';
}

function dedupePreviewImages(images: string[]) {
  const unique = new Map<string, string>();
  for (const image of Array.isArray(images) ? images : []) {
    const key = canonicalizePreviewImage(image);
    if (!key || unique.has(key)) continue;
    unique.set(key, image);
  }
  return [...unique.values()];
}

function canonicalizePreviewImage(url: string) {
  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    const wwMatch = normalizedPath.match(/\/(\d+)-(\d+)\.(jpg|jpeg|png|webp)$/i);
    if (wwMatch) return `ww-cdn:${wwMatch[1]}-${wwMatch[2]}`;
    const resizeMatch = normalizedPath.match(/\/resizeapi\/([a-f0-9]{20,})\//i);
    if (resizeMatch) return `resizeapi:${resizeMatch[1]}`;
    return `${parsed.hostname.toLowerCase()}${normalizedPath.toLowerCase()}`;
  } catch {
    return url;
  }
}
