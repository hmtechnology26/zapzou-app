import type { MetadataRoute } from 'next';
import { createPublicSupabaseClient, getSiteUrl, slugify } from '@/lib/seo';

const siteUrl = getSiteUrl();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const staticRoutes: MetadataRoute.Sitemap = [
  '/',
  '/home',
  '/landing',
  '/contact',
  '/explore',
  '/places',
  '/plans',
  '/privacy',
  '/terms',
].map((path) => ({
  url: `${siteUrl}${path}`,
  changeFrequency: 'weekly',
  priority: path === '/' ? 1 : path === '/home' || path === '/landing' ? 0.95 : 0.7,
  lastModified: new Date(),
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return staticRoutes;

  try {
    const [{ data: environments }, { data: services }] = await Promise.all([
      supabase
        .from('environments')
        .select('slug,name,status,updated_at')
        .eq('status', 'active'),
      supabase
        .from('services')
        .select('slug,title,status,is_active,updated_at,environment_id,environments(slug)')
        .or('status.eq.active,is_active.eq.true'),
    ]);

    const environmentRoutes: MetadataRoute.Sitemap = (environments || [])
      .map((env) => {
        const slug = env.slug || slugify(env.name || '');
        if (!slug) return null;
        return {
          url: `${siteUrl}/places/${slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          lastModified: env.updated_at ? new Date(env.updated_at) : new Date(),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const serviceRoutes: MetadataRoute.Sitemap = (services || [])
      .map((service) => {
        const slug = service.slug || slugify(service.title || '');
        if (!slug) return null;

        const envSlug = (service as any).environments?.slug;
        if (!envSlug) {
          return {
            url: `${siteUrl}/service/${slug}`,
            changeFrequency: 'weekly' as const,
            priority: 0.75,
            lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
          };
        }

        return {
          url: `${siteUrl}/places/${envSlug}/services/${slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.75,
          lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    return [...staticRoutes, ...environmentRoutes, ...serviceRoutes];
  } catch (error) {
    console.warn('sitemap generation failed:', error);
    return staticRoutes;
  }
}
