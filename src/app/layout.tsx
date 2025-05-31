
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Tacna Transit Navigator',
  description: 'Optimize your bus routes in Tacna, Peru. Avoid congestion and blocked roads with AI-powered suggestions.',
};

declare global {
  interface Window {
    initMap?: () => void;
    google?: typeof google; // Ensure google namespace is available
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDzPa0SZnwuTDGxkcXEmk7TlODjpBg15bQ'; // Fallback only for local dev if .env var is missing
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <MainLayout>{children}</MainLayout>
        <Toaster />
        <Script
          strategy="lazyOnload"
          src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`}
          defer
          async
        />
      </body>
    </html>
  );
}
