
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CulinaryStoreProvider } from '@/hooks/use-culinary-store';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bookeato',
  description: 'Book your slot for cooking and get personalized meal recommendations.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              window.addEventListener('error', function(e) {
                if (e && (e.message && e.message.indexOf('ChunkLoadError') !== -1 || e.target && e.target.tagName === 'SCRIPT')) {
                  var lastReload = sessionStorage.getItem('chunk_reload_ts');
                  var now = Date.now();
                  if (!lastReload || (now - parseInt(lastReload)) > 5000) {
                    sessionStorage.setItem('chunk_reload_ts', now.toString());
                    window.location.reload();
                  }
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e && e.reason && (e.reason.name === 'ChunkLoadError' || (e.reason.message && e.reason.message.indexOf('Loading chunk') !== -1))) {
                  var lastReload = sessionStorage.getItem('chunk_reload_ts');
                  var now = Date.now();
                  if (!lastReload || (now - parseInt(lastReload)) > 5000) {
                    sessionStorage.setItem('chunk_reload_ts', now.toString());
                    window.location.reload();
                  }
                }
                if (e && e.reason && e.reason.message && e.reason.message.indexOf('ca9') !== -1) {
                  e.preventDefault();
                }
              });
            })();
          `
        }} />
      </head>
      <body className={`${poppins.className} font-body antialiased`} suppressHydrationWarning>
        <div className="gradient-bg"></div>
        <FirebaseClientProvider>
          <CulinaryStoreProvider>
            {children}
          </CulinaryStoreProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
