import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tradutor de Entrevistas em Tempo Real",
  description: "Aplicativo de tradução e assistência em tempo real para entrevistas e reuniões",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
