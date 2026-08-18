import Image from "next/image";

const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type LegalDocumentProps = {
  title: string;
  text: string;
};

export default function LegalDocument({ title, text }: LegalDocumentProps) {
  const normalizedText = text.replaceAll(
    "team@redline-shool.ru",
    "team@redline-school.ru",
  );

  return (
    <>
      <header className="legal-header">
        <div className="container legal-header-inner">
          <a className="brand" href={`${PUBLIC_BASE_PATH}/`} aria-label="REDLINE — на главную">
            <Image
              src={`${PUBLIC_BASE_PATH}/redline-logo-user.png?v=20260818`}
              alt=""
              width={62}
              height={44}
              priority
            />
            <span><strong>REDLINE</strong><small>репетиторы · 1–9 классы</small></span>
          </a>
          <a className="legal-back" href={`${PUBLIC_BASE_PATH}/`}>← Вернуться на лендинг</a>
        </div>
      </header>

      <main className="legal-page">
        <article className="container legal-shell">
          <p className="section-kicker">Документы REDLINE</p>
          <h1>{title}</h1>
          <div className="legal-copy">
            {normalizedText.split(/\r?\n/).map((line, index) => {
              const value = line.trim();
              if (!value || index < 2) return null;
              if (/^\d+\.\s/.test(value)) return <h2 key={`${index}-${value}`}>{value}</h2>;
              if (/^[А-ЯЁ][^.!?]{1,80}:$/.test(value)) return <h3 key={`${index}-${value}`}>{value}</h3>;
              const isListItem = /[;:]$/.test(value) && !/^\d+\./.test(value);
              return <p className={isListItem ? "legal-list-item" : undefined} key={`${index}-${value}`}>{value}</p>;
            })}
          </div>
        </article>
      </main>
    </>
  );
}
