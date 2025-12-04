import '@styles/globals.scss';

import { APP_NAME } from '@utils/constants';
import type { Metadata } from 'next';
import Script from 'next/script';
import { getServerSession } from 'next-auth';

import { authOptions } from './auth';
import { setInitialThemeScript } from './components/ThemePreference';
import LayoutShell from './modules/LayoutShell';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Generative AI Field Tests',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <title>{APP_NAME}</title>
        <meta name="description" content="" />
        <link rel="icon" href="/icons/favicon.svg" sizes="any" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="msapplication-TileColor" content="#052fad" />
        <meta name="color" content="#161616" />

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
      </head>
      <body>
        <Script id="theme-script" dangerouslySetInnerHTML={{ __html: setInitialThemeScript }} />
        <LayoutShell session={session}>{children}</LayoutShell>
      </body>
    </html>
  );
}
