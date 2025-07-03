import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CultureMade - Coming Soon",
  description: "Something amazing is coming soon. We're crafting a premium e-commerce experience that will revolutionize how you shop for culture and style.",
  keywords: ["ecommerce", "culture", "fashion", "coming soon", "premium"],
  authors: [{ name: "CultureMade" }],
  openGraph: {
    title: "CultureMade - Coming Soon",
    description: "Something amazing is coming soon. Premium e-commerce experience launching soon.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CultureMade - Coming Soon",
    description: "Something amazing is coming soon. Premium e-commerce experience launching soon.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
