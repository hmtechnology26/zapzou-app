import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata } from 'next';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';

export const metadata: Metadata = {
  title: 'Conectae - Hub de Servicos',
  description: 'Conecte-se com prestadores de servicos na sua regiao',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#006d2f',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  manifest: '/manifest.json',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
