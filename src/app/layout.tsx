import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Unknown Shopper | Conviértete en Mystery Shopper",
  description:
    "Regístrate para participar en evaluaciones de atención y ventas en sucursales de marcas. Campañas pagadas y remuneradas." 
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
