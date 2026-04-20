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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  Promise.resolve()
                    .then(function () {
                      if ('serviceWorker' in navigator) {
                        return navigator.serviceWorker.getRegistrations().then(function (registrations) {
                          return Promise.all(
                            registrations.map(function (registration) {
                              return registration.unregister();
                            })
                          );
                        });
                      }
                    })
                    .then(function () {
                      if ('caches' in window) {
                        return caches.keys().then(function (keys) {
                          return Promise.all(
                            keys.map(function (key) {
                              return caches.delete(key);
                            })
                          );
                        });
                      }
                    })
                    .catch(function (error) {
                      console.warn('PWA cleanup failed.', error);
                    });
                } catch (error) {
                  console.warn('PWA cleanup init failed.', error);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
