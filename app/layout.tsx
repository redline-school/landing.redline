import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const faviconUrl = `${publicBasePath}/redline-favicon-20260818.ico`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? new URL(`${protocol}://${host}`) : undefined;
  const title = "REDLINE — репетиторы для школьников 1–9 классов";
  const description =
    "Индивидуальные занятия по математике, русскому языку и физике для 1–9 классов. Бесплатная диагностика, личный план и первый измеримый результат за 3 занятия.";
  const socialImage = baseUrl
    ? new URL(`${publicBasePath}/og-v2.png`, baseUrl).toString()
    : undefined;

  return {
    metadataBase: baseUrl,
    title,
    description,
    keywords: ["REDLINE", "репетитор для школьника", "онлайн-репетитор", "математика", "русский язык", "физика", "1–9 классы"],
    alternates: {
      canonical: "https://landing.redline-tutors.ru/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: {
      icon: [
        { url: faviconUrl, type: "image/x-icon", sizes: "any" },
        { url: `${publicBasePath}/redline-favicon-20260818.png`, type: "image/png", sizes: "1024x1024" },
      ],
      shortcut: faviconUrl,
      apple: `${publicBasePath}/redline-icon.png?v=20260818`,
    },
    openGraph: {
      title,
      description,
      url: "https://landing.redline-tutors.ru/",
      siteName: "REDLINE",
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
  const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const faviconUrl = `${publicBasePath}/redline-favicon-20260818.ico`;
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href={faviconUrl} type="image/x-icon" sizes="any" />
        <link rel="shortcut icon" href={faviconUrl} type="image/x-icon" />
      </head>
      <body>{children}</body>
    </html>
  );
}

