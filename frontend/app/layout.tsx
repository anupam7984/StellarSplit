import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarSplit - On-Chain Bill Splitter",
  description: "A decentralized bill-splitting application built on the Stellar blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}