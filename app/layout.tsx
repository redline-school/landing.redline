import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const faviconUrl = `${publicBasePath}/redline-icon.png?v=20260817`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? new URL(`${protocol}://${host}`) : undefined;
  const title = "REDLINE";
  const description =
    "Индивидуальные занятия по математике, русскому языку и физике для 1–9 классов. Бесплатная диагностика, личный план и первый измеримый результат за 3 занятия.";
  const socialImage = baseUrl
    ? new URL(`${publicBasePath}/og-v2.png`, baseUrl).toString()
    : undefined;

  return {
    metadataBase: baseUrl,
    title,
    description,
    icons: {
      icon: [{ url: faviconUrl, type: "image/png", sizes: "1024x1024" }],
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ru_RU",
      images: socialImage
        ? [{ url: socialImage, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

