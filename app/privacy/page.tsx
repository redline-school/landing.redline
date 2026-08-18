import type { Metadata } from "next";
import privacyText from "../../content/privacy.txt?raw";
import LegalDocument from "../legal-document";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных — REDLINE",
  description: "Политика обработки и защиты персональных данных REDLINE.",
};

export default function PrivacyPage() {
  return <LegalDocument title="Политика обработки персональных данных" text={privacyText} />;
}
