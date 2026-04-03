import type { Metadata } from 'next';
import PlaceDetailClient from './page-client';
import { createPublicSupabaseClient, getSiteUrl, humanizeSlug } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
};

async function getEnvironmentBySlug(slug: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const decoded = slug.replace(/-/g, ' ');

  const { data } = await supabase
    .from('environments')
    .select('id, name, slug, type, image_url, members_count, status, updated_at')
    .or(`slug.eq.${slug},name.ilike.${decoded}`)
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const env = await getEnvironmentBySlug(params.slug);
  const siteUrl = getSiteUrl();
  const title = env?.name || humanizeSlug(params.slug) || 'Ambiente';
  const description =
    `Veja anuncios, servicos e informacoes do ambiente ${title} na Conectae.`;
  const canonical = `${siteUrl}/places/${params.slug}`;
  const isIndexable = env?.status === 'active' || !env;

  return {
    title: `${title} | Conectae`,
    description,
    alternates: { canonical },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${title} | Conectae`,
      description,
      siteName: 'Conectae',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Conectae`,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const env = await getEnvironmentBySlug(params.slug);
  const title = env?.name || humanizeSlug(params.slug) || 'Ambiente';
  const typeLabel =
    env?.type === 'church'
      ? 'Igreja'
      : env?.type === 'residential'
        ? 'Condominio'
        : env?.type === 'club'
          ? 'Clube'
          : 'Ambiente';
  const memberCount = typeof env?.members_count === 'number' ? env.members_count : null;

  const seoContent = (
    <section className="mx-auto max-w-7xl px-4 pt-24 pb-2">
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
          {typeLabel}
          {memberCount !== null ? ` • ${memberCount} membros` : ''}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-on-surface">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-on-surface-variant">
          Veja anuncios, prestadores e servicos vinculados a este ambiente.
        </p>
      </div>
    </section>
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: title,
    url: canonical,
    areaServed: title,
    provider: {
      '@type': 'Organization',
      name: 'Conectae',
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlaceDetailClient seoContent={seoContent} />
    </>
  );
}
