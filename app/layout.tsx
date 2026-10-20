import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SignDrop - Digital Signature Collector',
  description:
    'Minimalist signature collection app with high-resolution JPEG and PDF generation and direct email submission to okaforrichard76@gmail.com.',
  openGraph: {
    title: 'SignDrop - Digital Signature Collector',
    description:
      'Minimalist signature collection app with high-resolution JPEG and PDF generation and direct email submission to okaforrichard76@gmail.com.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-zinc-900 antialiased selection:bg-zinc-950 selection:text-white">
        {children}
      </body>
    </html>
  );
}
