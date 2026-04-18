import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';
import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ConectaE - Hub de Servicos',
    template: '%s | Conectae',
  },
  description: 'Conecte-se com prestadores de servicos, ambientes e anuncios na sua regiao.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    'servicos locais',
    'anuncios',
    'ambientes',
    'igreja',
    'condominio',
    'conectae',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'ConectaE - Hub de Servicos',
    description: 'Conecte-se com prestadores de servicos, ambientes e anuncios na sua regiao.',
    siteName: 'Conectae',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConectaE - Hub de Servicos',
    description: 'Conecte-se com prestadores de servicos, ambientes e anuncios na sua regiao.',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#006d2f',
};

export const dynamic = 'force-dynamic';
const isProduction = process.env.NODE_ENV === 'production';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {!isProduction && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function (registrations) {
                        registrations.forEach(function (registration) {
                          registration.unregister();
                        });
                      });
                    }

                    if ('caches' in window) {
                      caches.keys().then(function (keys) {
                        keys.forEach(function (key) {
                          if (key.indexOf('zapzou-') === 0) {
                            caches.delete(key);
                          }
                        });
                      });
                    }
                  } catch (error) {
                    console.warn('Failed to clear dev caches.', error);
                  }
                })();
              `,
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
