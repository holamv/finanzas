import type { Metadata } from 'next';
import { Inter, Nunito } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FlowMaster AI | Manzana Verde',
  description: 'Proyecciones de flujo de caja y análisis financiero con IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${nunito.variable}`}>
      <body className="bg-background text-foreground font-body antialiased">
        {children}
        <script src="https://js.puter.com/v2/" />
      </body>
    </html>
  );
}
