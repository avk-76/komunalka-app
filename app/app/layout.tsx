
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import HeaderDate from '@/components/header-date';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Калькулятор комунальних послуг',
  description: 'Розрахунок комунальних платежів для квартир',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₴</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Калькулятор комунальних послуг
                  </h1>
                </div>
                <HeaderDate />
              </div>
            </div>
          </header>
          
          <main className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
