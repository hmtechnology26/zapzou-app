import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();

const staticRoutes: MetadataRoute.Sitemap = [
  '/',
  '/contact',
  '/explore',
  '/places',
  '/plans',
  '/privacy',
  '/terms',
].map((path) => ({
  url: `${siteUrl}${path}`,
  changeFrequency: 'weekly',
  priority: path === '/' ? 1 : 0.7,
  lastModified: new Date(),
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutes;
}
