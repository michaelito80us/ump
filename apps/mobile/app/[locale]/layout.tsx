import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

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
      <body>
        <NextIntlClientProvider messages={messages}>
          <div>
            <p>Locale: {locale}</p>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
