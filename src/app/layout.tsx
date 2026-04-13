import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';
import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Conectae - Hub de Servicos',
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
    title: 'Conectae - Hub de Servicos',
    description: 'Conecte-se com prestadores de servicos, ambientes e anuncios na sua regiao.',
    siteName: 'Conectae',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conectae - Hub de Servicos',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
