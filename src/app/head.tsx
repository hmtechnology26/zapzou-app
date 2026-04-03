import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Conectae',
  url: siteUrl,
  logo: `${siteUrl}/conectae_logo.png`,
  sameAs: [],
};

export default function Head() {
  return (
    <>
      <meta name="application-name" content="Conectae" />
      <meta name="apple-mobile-web-app-title" content="Conectae" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
