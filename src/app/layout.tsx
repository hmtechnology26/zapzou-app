import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata } from 'next';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';
import { ServiceWorkerCleanup } from './service-worker-cleanup';

export const metadata: Metadata = {
  title: 'ZapZou - Marketplace de Serviços',
  description: 'Conecte-se com prestadores de serviços na sua região',
  icons: {
    icon: '/favicon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
};

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
        <ServiceWorkerCleanup />
      </body>
    </html>
  );
}
