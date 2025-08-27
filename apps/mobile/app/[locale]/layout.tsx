import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PWAInstaller } from '../../src/components/PWAInstaller';
import { OfflineIndicator } from '../../src/components/OfflineIndicator';
import { ServiceWorkerRegistration } from '../../src/components/ServiceWorkerRegistration';

const locales = ['en', 'es'];

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <title>UMP Tournament Manager</title>

        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="UMP Tournament Manager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="UMP Tournament Manager"
        />
        <meta
          name="description"
          content="Unified Management Platform for Tournament Management"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.svg" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152x152.svg"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-192x192.svg"
        />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-192x192.svg"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-192x192.svg"
        />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/icons/icon-192x192.svg"
          as="image"
          type="image/svg+xml"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Splash Screen */}
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Allow zoom for accessibility */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          <div>{children}</div>
          <PWAInstaller />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
