import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LEMI - Interior Fixtures Business Management System',
  description: 'Customer Billing, Payment & Business Management System for LEMI Interior Fixtures',
  icons: {
    icon: '/lemi-logo.png',
    shortcut: '/lemi-logo.png',
    apple: '/lemi-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
