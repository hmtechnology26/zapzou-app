'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';

type ServiceInteractionType =
  | 'service_view'
  | 'service_click'
  | 'whatsapp_click'
  | 'instagram_click';

type ServiceInteractionRow = {
  service_id: string;
  interaction_type: ServiceInteractionType;
};

type ServiceMetrics = {
  views: number;
  serviceClicks: number;
  whatsappClicks: number;
  instagramClicks: number;
};

const emptyMetrics: ServiceMetrics = {
  views: 0,
  serviceClicks: 0,
  whatsappClicks: 0,
  instagramClicks: 0,
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toStartOfDayIso = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toEndOfDayIso = (dateValue: string) => {
  const date = new Date(`${dateValue}T23:59:59.999`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, userServices, fetchUserServices } = useApp();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateInput(date);
  });
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()));
  const [metricsByService, setMetricsByService] = useState<
    Record<string, ServiceMetrics>
  >({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');

  const hasInvalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchUserServices(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || user.plan !== 'plus') {
      setMetricsByService({});
      setMetricsLoading(false);
      setMetricsError('');
      return;
    }

    if (hasInvalidDateRange) {
      setMetricsByService({});
      setMetricsLoading(false);
      setMetricsError('A data inicial não pode ser maior que a data final.');
      return;
    }

    let active = true;

    const loadMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError('');

      try {
        const rangeStart = toStartOfDayIso(startDate);
        const rangeEnd = toEndOfDayIso(endDate);

        let query = supabase
          .from('service_interactions')
          .select('service_id, interaction_type')
          .eq('provider_id', user.id);

        if (rangeStart) {
          query = query.gte('happened_at', rangeStart);
        }

        if (rangeEnd) {
          query = query.lte('happened_at', rangeEnd);
        }

        const { data, error } = await query;

        if (!active) return;

        if (error) {
          console.warn('load dashboard metrics failed:', error);
          setMetricsError(
            'Não foi possível carregar as métricas agora. Tente novamente em instantes.',
          );
          setMetricsByService({});
          setMetricsLoading(false);
          return;
        }

        const nextMetrics: Record<string, ServiceMetrics> = {};

        (data as ServiceInteractionRow[] | null | undefined)?.forEach((row) => {
          if (!row?.service_id) return;
          const current = nextMetrics[row.service_id] || { ...emptyMetrics };

          if (row.interaction_type === 'service_view') {
            current.views += 1;
          } else if (row.interaction_type === 'service_click') {
            current.serviceClicks += 1;
          } else if (row.interaction_type === 'whatsapp_click') {
            current.whatsappClicks += 1;
          } else if (row.interaction_type === 'instagram_click') {
            current.instagramClicks += 1;
          }

          nextMetrics[row.service_id] = current;
        });

        setMetricsByService(nextMetrics);
      } catch (error) {
        if (!active) return;
        console.warn('load dashboard metrics exception:', error);
        setMetricsError(
          'Não foi possível carregar as métricas agora. Tente novamente em instantes.',
        );
        setMetricsByService({});
      } finally {
        if (active) {
          setMetricsLoading(false);
        }
      }
    };

    void loadMetrics();

    return () => {
      active = false;
    };
  }, [user?.id, user?.plan, startDate, endDate, hasInvalidDateRange]);

  const servicesWithMetrics = useMemo(() => {
    return [...userServices]
      .map((service) => ({
        service,
        metrics: metricsByService[service.id] || emptyMetrics,
      }))
      .sort((a, b) => {
        const totalA =
          a.metrics.views +
          a.metrics.serviceClicks +
          a.metrics.whatsappClicks +
          a.metrics.instagramClicks;
        const totalB =
          b.metrics.views +
          b.metrics.serviceClicks +
          b.metrics.whatsappClicks +
          b.metrics.instagramClicks;
        return totalB - totalA;
      });
  }, [userServices, metricsByService]);

  const totals = useMemo(() => {
    return servicesWithMetrics.reduce(
      (acc, item) => {
        acc.views += item.metrics.views;
        acc.serviceClicks += item.metrics.serviceClicks;
        acc.whatsappClicks += item.metrics.whatsappClicks;
        acc.instagramClicks += item.metrics.instagramClicks;
        return acc;
      },
      { ...emptyMetrics },
    );
  }, [servicesWithMetrics]);

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (user.plan !== 'plus') {
    return (
      <div className="min-h-screen bg-background">
        <TopAppBar />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-20">
          <section className="rounded-3xl border border-primary/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon="insights" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black text-on-surface">Dashboard avançado</h1>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Esse recurso é exclusivo para usuários no plano PLUS.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/plans/plus?returnTo=/dashboard')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-white"
                >
                  <Icon icon="workspace_premium" size={18} />
                  Fazer upgrade para PLUS
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(15,23,42,0.03)_100%)] pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-6 pt-16 md:space-y-8 md:px-8 md:pt-20">
        <section className="rounded-[1.8rem] border border-primary/10 bg-surface-container-lowest p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-on-surface md:text-3xl">
                Dashboard de visualizações
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Métricas por serviço no período selecionado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUserServices(user.id)}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-on-surface"
            >
              <Icon icon="refresh" size={16} />
              Atualizar serviços
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                Data inicial
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 rounded-xl border border-outline-variant/20 bg-background px-3 text-sm text-on-surface"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                Data final
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 rounded-xl border border-outline-variant/20 bg-background px-3 text-sm text-on-surface"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => applyQuickRange(7)}
                className="h-11 rounded-xl border border-outline-variant/20 bg-background px-3 text-xs font-bold text-on-surface"
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange(30)}
                className="h-11 rounded-xl border border-outline-variant/20 bg-background px-3 text-xs font-bold text-on-surface"
              >
                30 dias
              </button>
            </div>
          </div>

          {metricsError && (
            <div className="mt-4 rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
              {metricsError}
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              Visualizações
            </p>
            <p className="mt-2 text-2xl font-black text-[#30cc36]">{totals.views}</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              Cliques no serviço
            </p>
            <p className="mt-2 text-2xl font-black text-[#30cc36]">{totals.serviceClicks}</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              Cliques em contratar
            </p>
            <p className="mt-2 text-2xl font-black text-[#30cc36]">{totals.whatsappClicks}</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              Cliques no Instagram
            </p>
            <p className="mt-2 text-2xl font-black text-[#30cc36]">{totals.instagramClicks}</p>
          </article>
        </section>

        <section className="space-y-3">
          {metricsLoading ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
              Carregando métricas...
            </div>
          ) : servicesWithMetrics.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
              Você ainda não tem serviços publicados para analisar.
            </div>
          ) : (
            servicesWithMetrics.map(({ service, metrics }) => (
              <article
                key={service.id}
                className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-on-surface">{service.title}</h2>
                    <p className="text-xs text-on-surface-variant">
                      {service.category || 'Sem categoria'}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Total acumulado de visualizações: {service.views || 0}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-outline-variant/10 bg-background p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Visualizações
                    </p>
                    <p className="mt-1 text-xl font-black text-[#30cc36]">{metrics.views}</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/10 bg-background p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Cliques no serviço
                    </p>
                    <p className="mt-1 text-xl font-black text-[#30cc36]">
                      {metrics.serviceClicks}
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/10 bg-background p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Cliques em contratar
                    </p>
                    <p className="mt-1 text-xl font-black text-[#30cc36]">
                      {metrics.whatsappClicks}
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/10 bg-background p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Cliques no Instagram
                    </p>
                    <p className="mt-1 text-xl font-black text-[#30cc36]">
                      {metrics.instagramClicks}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
