import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './styles/base.css';
import './styles/chrome.css';
import './styles/panels.css';

// Inter, servie localement par Next (aucune requête à Google côté navigateur).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'deepflow',
  description: 'Order flow Binance : heatmap, footprint, profils et signaux expliqués.',
};

export const viewport: Viewport = { themeColor: '#0b0b0b', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
