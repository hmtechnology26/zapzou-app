import type { Metadata } from 'next';
import ServiceDetailClient from './page-client';
import { createPublicSupabaseClient, getSiteUrl, humanizeSlug } from '@/lib/seo';
import { normalizeWebsiteUrl } from '@/lib/website';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
};

async function getServiceBySlug(slug: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: bySlug } = await supabase
      .from('services')
      .select('title, slug, description, image_url, website_url, environment_id, status, is_active, environments(name, slug)')
      .eq('slug', slug)
      .maybeSingle();

    if (bySlug) return bySlug;

    const { data: byId } = await supabase
      .from('services')
      .select('title, slug, description, image_url, website_url, environment_id, status, is_active, environments(name, slug)')
      .eq('id', slug)
      .maybeSingle();

    return byId ?? null;
  } catch (error) {
    console.warn('getServiceBySlug failed:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  const siteUrl = getSiteUrl();
  const title = service?.title || humanizeSlug(params.slug) || 'Servico';
  const environmentSlug = service?.environments?.slug;
  const description =
    service?.description?.slice(0, 160) ||
    `Veja detalhes do servico ${title}, fotos, avaliacao e contato direto na ConectaE.`;
  const canonical = environmentSlug
    ? `${siteUrl}/places/${environmentSlug}/services/${params.slug}`
    : `${siteUrl}/service/${params.slug}`;
  const isIndexable = service?.status === 'active' || service?.is_active === true || !service;

  return {
    title: `${title} | ConectaE`,
    description,
    alternates: { canonical },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${title} | ConectaE`,
      description,
      siteName: 'ConectaE',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ConectaE`,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  const siteUrl = getSiteUrl();
  const title = service?.title || humanizeSlug(params.slug) || 'Servico';
  const description =
    service?.description ||
    'Confira o servico, veja detalhes importantes e entre em contato com facilidade.';
  const environmentName = service?.environments?.name || '';
  const environmentSlug = service?.environments?.slug;
  const websiteHref = normalizeWebsiteUrl(service?.website_url);
  const canonical = environmentSlug
    ? `${siteUrl}/places/${environmentSlug}/services/${params.slug}`
    : `${siteUrl}/service/${params.slug}`;

  const seoContent = (
    <section className="sr-only" aria-hidden="true">
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
          Servico publicavel
          {environmentName ? ` em ${environmentName}` : ''}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-on-surface">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-on-surface-variant">
          {description}
        </p>
        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center rounded-full border border-outline-variant/10 bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
          >
            Visitar site
          </a>
        )}
      </div>
    </section>
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description,
    url: canonical,
    provider: {
      '@type': 'Organization',
      name: 'ConectaE',
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceDetailClient seoContent={seoContent} />
    </>
  );
}
