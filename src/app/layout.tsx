import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata } from 'next';
import { ClientOnly } from './client-only';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';

export const metadata: Metadata = {
  title: 'ZapZou - Marketplace de Serviços',
  description: 'Conecte-se com prestadores de serviços na sua região',
  icons: {
    icon: '/favicon.png',
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
        <ClientOnly>
          <Providers>
            <ProtectedLayout>{children}</ProtectedLayout>
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
