import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/contact', '/explore', '/places', '/service', '/plans', '/privacy', '/terms'],
        disallow: [
          '/admin/',
          '/auth/',
          '/bulletins',
          '/edit-profile',
          '/favorites',
          '/finances',
          '/login',
          '/members',
          '/meus-anuncios',
          '/meus-ambientes',
          '/moderation',
          '/notifications',
          '/profile',
          '/register-service',
          '/select-environments',
        ],
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
