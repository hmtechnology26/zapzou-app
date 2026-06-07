import type { Metadata } from 'next';
import ServiceDetailClient from './page-client';
import { createPublicSupabaseClient, getSiteUrl, humanizeSlug } from '@/lib/seo';
import { normalizeWebsiteUrl } from '@/lib/website';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string; serviceSlug: string };
};

async function getServiceContext(placeSlug: string, serviceSlug: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: bySlug } = await supabase
      .from('services')
      .select('title, slug, description, image_url, website_url, environment_id, status, is_active, environments!service_environment_links(name, slug)')
      .eq('slug', serviceSlug)
      .maybeSingle();

    const service = bySlug
      ? bySlug
      : await supabase
        .from('services')
          .select('title, slug, description, image_url, website_url, environment_id, status, is_active, environments!service_environment_links(name, slug)')
          .eq('id', serviceSlug)
          .maybeSingle()
          .then(({ data }) => data ?? null);

    if (!service) return null;

    const environmentSlug = service.environments?.find((e: any) => e.slug === placeSlug)?.slug || placeSlug;
    return {
      ...service,
      environmentSlug,
    };
  } catch (error) {
    console.warn('getServiceContext failed:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = await getServiceContext(params.slug, params.serviceSlug);
  const siteUrl = getSiteUrl();
  const serviceTitle = ctx?.title || humanizeSlug(params.serviceSlug) || 'Servico';
  const placeTitle = ctx?.environments?.find((e: any) => e.slug === params.slug)?.name || humanizeSlug(params.slug) || 'Ambiente';
  const description =
    ctx?.description?.slice(0, 160) ||
    `Veja o servico ${serviceTitle} dentro do ambiente ${placeTitle}.`;
  const canonical = `${siteUrl}/places/${params.slug}/services/${params.serviceSlug}`;
  const isIndexable = ctx?.status === 'active' || ctx?.is_active === true || !ctx;

  return {
    title: `${serviceTitle} em ${placeTitle} | Conectae`,
    description,
    alternates: { canonical },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${serviceTitle} em ${placeTitle} | Conectae`,
      description,
      siteName: 'Conectae',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${serviceTitle} em ${placeTitle} | Conectae`,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const ctx = await getServiceContext(params.slug, params.serviceSlug);
  const siteUrl = getSiteUrl();
  const serviceTitle = ctx?.title || humanizeSlug(params.serviceSlug) || 'Servico';
  const placeTitle = ctx?.environments?.find((e: any) => e.slug === params.slug)?.name || humanizeSlug(params.slug) || 'Ambiente';
  const description =
    ctx?.description ||
    'Veja os detalhes do servico dentro do ambiente e entre em contato com facilidade.';
  const canonical = `${siteUrl}/places/${params.slug}/services/${params.serviceSlug}`;
  const websiteHref = normalizeWebsiteUrl(ctx?.website_url);

  const seoContent = (
    <section className="sr-only" aria-hidden="true">
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
          {placeTitle}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-on-surface">
          {serviceTitle}
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
    name: serviceTitle,
    description,
    url: canonical,
    provider: {
      '@type': 'Organization',
      name: 'Conectae',
      url: siteUrl,
    },
    areaServed: placeTitle,
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
