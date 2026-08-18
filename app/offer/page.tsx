import type { Metadata } from "next";
import offerText from "../../content/offer.txt?raw";
import LegalDocument from "../legal-document";

export const metadata: Metadata = {
  title: "Публичная оферта — REDLINE",
  description: "Публичная оферта REDLINE на организацию индивидуальных онлайн-занятий.",
};

export default function OfferPage() {
  return <LegalDocument title="Публичная оферта" text={offerText} />;
}
