import './globals.css';
import 'react-material-symbols/rounded';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientOnly } from './client-only';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

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
      <body className={inter.className}>
        <ClientOnly>
          <Providers>
            <ProtectedLayout>{children}</ProtectedLayout>
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
