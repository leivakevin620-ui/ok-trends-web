import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "O&K Trends | Tienda de estilo y accesorios",
    template: "%s | O&K Trends",
  },
  description:
    "Tienda virtual de O&K Trends: relojes, perfumes, ropa, gorras, zapatos y accesorios.",
  metadataBase: new URL("https://ok-trends.example"),
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
