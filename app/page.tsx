"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ASSET_VERSION = "20260818-1";
const assetPath = (path: string) => `${PUBLIC_BASE_PATH}${path}?v=${ASSET_VERSION}`;
const pagePath = (path: string) => `${PUBLIC_BASE_PATH}${path}`;
const tutorPhoto = (index: number) => assetPath(`/tutor-${index}-v4.jpg`);

const goals = [
  "Повысить успеваемость",
  "Закрыть пробелы или идти на опережение",
  "Подготовиться к контрольной или самостоятельной",
  "Подготовиться к олимпиаде",
  "Подготовиться к ОГЭ",
  "Подготовиться к ВПР или МЦКО",
  "Подготовиться к переводному экзамену",
];

type FormStatus = "idle" | "loading" | "success" | "error";

const products = [
  {
    number: "01",
    title: "Повышение успеваемости",
    badge: "главный продукт",
    className: "primary",
    text: "Работаем по программе и учебнику ученика: закрываем пробелы, идём на опережение, готовимся к контрольным и самостоятельным.",
    result: "Результат: увереннее отвечает и повышает оценки",
  },
  {
    number: "02",
    title: "Олимпиадная подготовка",
    badge: "ежегодный трек",
    className: "dark",
    text: "Развиваем нестандартное мышление и готовим к школьным олимпиадам разного уровня — от первых задач до уверенного участия.",
    result: "Результат: видит идеи, а не перебирает формулы",
  },
  {
    number: "03",
    title: "Переводные экзамены",
    badge: "по цели ученика",
    className: "light",
    text: "Готовим к годовым контрольным, аттестации и поступлению в другую школу: определяем темы, сроки и собираем понятный план.",
    result: "Результат: системная подготовка без аврала",
  },
  {
    number: "04",
    title: "Подготовка к ОГЭ",
    badge: "9 класс",
    className: "exam",
    text: "Выстраиваем подготовку от диагностики тем до пробников: закрываем пробелы, разбираем формат и учимся распределять время.",
    result: "Результат: понятный план и стабильнее баллы на пробниках",
  },
  {
    number: "05",
    title: "ВПР / МЦКО",
    badge: "сезонный продукт",
    className: "seasonal",
    text: "Точечно разбираем формат, типовые задания и слабые темы. Сейчас этот продукт доступен, но не является главным фокусом сезона.",
    result: "Результат: знакомый формат и меньше тревоги",
  },
];

const caseStudies = [
  {
    photo: "/case-student-1-v4.jpg",
    grade: "5 класс",
    subject: "Русский язык",
    title: "Правила знает — в работе не замечает",
    route: "Карта повторяющихся ошибок → тренировка орфограмм → самопроверка.",
  },
  {
    photo: "/case-student-2-v4.jpg",
    grade: "6 класс",
    subject: "Математика",
    title: "Дроби превратились в угадывание",
    route: "Проверка базы → смысл действий → школьные задачи без подсказки.",
  },
  {
    photo: "/case-student-3-v4.jpg",
    grade: "8 класс",
    subject: "Физика",
    title: "Формулы выучены — задача не решается",
    route: "Явление → рисунок → величины → объяснение решения своими словами.",
  },
];

const diagnosticStages = [
  {
    number: "01",
    title: "Знакомимся",
    text: "Будущий преподаватель узнаёт цель, школьную программу и то, где ребёнок теряется.",
    portraitIndex: 1,
  },
  {
    number: "02",
    title: "Находим точку сбоя",
    text: "Не ставим общую оценку — определяем конкретные темы и навыки, которые мешают двигаться дальше.",
    portraitIndex: 2,
  },
  {
    number: "03",
    title: "Проводим мини-урок",
    text: "Ребёнок пробует объяснение преподавателя и сразу понимает, комфортно ли заниматься вместе.",
    portraitIndex: 3,
  },
  {
    number: "04",
    title: "Отдаём маршрут",
    text: "Родитель получает список пробелов, сильных сторон и план — даже если решит не продолжать.",
    portraitIndex: 4,
  },
];

const reviews = [
  { name: "Анна", meta: "мама Ильи · 6 класс", text: "Сын впервые сам объяснил, почему решает дроби именно так. Для нас это важнее просто готового ответа." },
  { name: "Михаил", meta: "папа Сони · 5 класс", text: "После каждого занятия приходит короткий отчёт. Понимаю, что прошли и где ещё нужна практика, не допрашивая ребёнка." },
  { name: "Елена", meta: "мама Артёма · 8 класс", text: "На диагностике назвали конкретные пробелы и сразу показали, как будут объяснять. Решение продолжить приняли без давления." },
  { name: "Алексей", meta: "папа Даши · 9 класс", text: "Подготовку к ОГЭ разложили на небольшие этапы. Дочке стало спокойнее, потому что она видит ближайшую цель." },
  { name: "Ольга", meta: "мама Веры · 3 класс", text: "Преподаватель молодой, но очень внимательный. Ребёнок не боится ошибиться и действительно задаёт вопросы." },
  { name: "Дмитрий", meta: "папа Максима · 7 класс", text: "Не ушли в отдельную программу, а разобрали именно наш учебник и темы, которые сейчас идут в школе." },
  { name: "Наталья", meta: "мама Кирилла · 4 класс", text: "Удобно, что сообщения, материалы и история занятий в одном месте. Ничего не приходится искать по чатам." },
  { name: "Ирина", meta: "мама Алисы · 2 класс", text: "За первые занятия появилась маленькая, но понятная победа. Дочь сама заметила, что теперь справляется увереннее." },
  { name: "Марина", meta: "мама Егора · 8 класс", text: "Нравится, что прогресс виден по темам, а не описывается общими словами. Я понимаю следующий шаг." },
  { name: "Светлана", meta: "мама Лизы · 9 класс", text: "Можно было отказаться после диагностики и всё равно забрать план. Это сразу создало доверие к школе." },
];

const faqs = [
  {
    question: "Что значит «первый результат за 3 занятия»?",
    answer:
      "На диагностике выбираем один конкретный измеримый результат: например, ребёнок самостоятельно приводит дроби к общему знаменателю или находит орфограмму. За три занятия разбираем опору, тренируем навык и фиксируем, что уже получается без подсказки.",
  },
  {
    question: "Кто проводит диагностику?",
    answer:
      "Будущий преподаватель ребёнка. Вы сразу проверяете не только знания, но и контакт: подходит ли темп, общение и способ объяснения.",
  },
  {
    question: "Что получает родитель после занятий?",
    answer:
      "Регулярные короткие отчёты: что разобрали, что уже получается, где нужна практика и какой следующий шаг запланирован. В личном кабинете видна динамика по темам.",
  },
  {
    question: "Как ребёнок видит свой прогресс?",
    answer:
      "Вместе с преподавателем он видит освоенные темы, небольшие победы и ближайшую цель. Прогресс становится конкретным, а не сводится к общему «стал заниматься лучше».",
  },
  {
    question: "Нужна ли камера?",
    answer:
      "Нет. Камера не обязательна. Достаточно стабильного интернета, микрофона и возможности видеть материалы преподавателя на экране.",
  },
  {
    question: "Можно отказаться после диагностики?",
    answer:
      "Да. Диагностика бесплатна и ни к чему не обязывает. План останется у вас, даже если вы не продолжите занятия в REDLINE.",
  },
  {
    question: "Можно заниматься по нашему учебнику?",
    answer:
      "Да. Для повышения успеваемости преподаватель работает по программе и учебнику ученика: закрывает пробелы или помогает идти на опережение.",
  },
  {
    question: "Как общаться с преподавателем между занятиями?",
    answer:
      "Через приложение и сайт REDLINE: можно задать вопрос, отправить задание или получить дополнительный материал. Организационные вопросы помогает решить поддержка.",
  },
  {
    question: "Сколько стоит занятие?",
    answer:
      "Индивидуальное онлайн-занятие длится 60 минут и стоит от 1 200 ₽. Для регулярных занятий есть пакеты со скидкой — подходящий формат предложим после диагностики.",
  },
];

export default function Home() {
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formMessage, setFormMessage] = useState("");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const parentVideoRef = useRef<HTMLVideoElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  function scrollReviews(direction: -1 | 1) {
    const track = reviewsRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(280, track.clientWidth * 0.82), behavior: "smooth" });
  }

  function toggleParentVideo(expanded: boolean) {
    setIsVideoExpanded(expanded);
    const video = parentVideoRef.current;
    if (!video) return;
    if (expanded) void video.play().catch(() => undefined);
    else video.pause();
  }

  function openLeadModal() {
    setFormStatus("idle");
    setFormMessage("");
    setIsLeadModalOpen(true);
  }

  function closeLeadModal() {
    if (formStatus === "loading") return;
    setIsLeadModalOpen(false);
  }

  useEffect(() => {
    if (!isLeadModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLeadModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isLeadModalOpen, formStatus]);

  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  function advanceForm() {
    const form = formRef.current;
    if (!form) return;

    const controls = ["grade", "subject", "goal"].map((name) =>
      form.elements.namedItem(name),
    ) as Array<HTMLSelectElement | null>;

    const valid = controls.every((control) => control?.reportValidity());
    if (valid) {
      setFormMessage("");
      setFormStatus("idle");
      setFormStep(2);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formStatus === "loading") return;

    if (formStep === 1) {
      advanceForm();
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 11) {
      setFormStatus("error");
      setFormMessage("Проверьте номер телефона — нужно 10–11 цифр.");
      return;
    }

    setFormStatus("loading");
    setFormMessage("");

    const campaignParams = new URLSearchParams(window.location.search);
    const campaign: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"].forEach(
      (key) => {
        const value = campaignParams.get(key);
        if (value) campaign[key] = value;
      },
    );

    try {
      const isGitHubPages = window.location.hostname === "redline-school.github.io";
      const leadEndpoint = isGitHubPages
        ? "https://redline-4-8.pahanchic52.chatgpt.site/api/lead"
        : "/api/lead";
      const payload = {
        parent_name: String(data.get("parent_name") || "").trim(),
        phone,
        contact_method: String(data.get("contact_method") || ""),
        grade: String(data.get("grade") || ""),
        subject: String(data.get("subject") || ""),
        goal: String(data.get("goal") || ""),
        consent: data.get("consent") === "on",
        source: "redline_landing_1_9",
        page_url: window.location.href,
        ...campaign,
      };
      const response = await fetch(leadEndpoint, {
        method: "POST",
        mode: isGitHubPages ? "no-cors" : "cors",
        headers: {
          "Content-Type": isGitHubPages
            ? "text/plain;charset=UTF-8"
            : "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!isGitHubPages) {
        const result = await response.json().catch(() => ({ ok: false }));
        if (!response.ok || !result.ok) throw new Error("lead_not_confirmed");
      }

      setFormStatus("success");
      setFormMessage("Заявка отправлена. Свяжемся с вами и подберём время диагностики.");
      form.reset();
      setFormStep(1);
    } catch {
      setFormStatus("error");
      setFormMessage("Не получилось отправить заявку. Попробуйте ещё раз или напишите в Telegram.");
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Перейти к содержанию</a>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="REDLINE — на главную">
            <Image src={assetPath("/redline-logo-user.png")} alt="" width={62} height={44} priority />
            <span><strong>REDLINE</strong><small>репетиторы · 1–9 классы</small></span>
          </a>
          <nav className="main-nav" aria-label="Основная навигация">
            <a href="#programs">Продукты</a>
            <a href="#first-result">Первый результат</a>
            <a href="#progress">Прогресс</a>
            <a href="#tutors">Репетиторы</a>
            <a href="#price">Стоимость</a>
          </nav>
          <button className="button button-small header-cta" type="button" onClick={openLeadModal}>Записаться на диагностику</button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-orbit orbit-one" aria-hidden="true" />
          <div className="hero-orbit orbit-two" aria-hidden="true" />
          <div className="container hero-stage">
            <div className="hero-copy" data-reveal>
              <h1>
                Индивидуальные занятия с репетитором для школьников{" "}
                <span className="marker marker-yellow">1–9 классов</span>.
                <em>Математика, русский язык и физика</em>
              </h1>
              <p className="hero-subtitle">
                <strong>Бесплатная диагностика за 30 минут</strong> + индивидуальный план
              </p>
              <div className="hero-actions">
                <button className="button button-light button-large" type="button" onClick={openLeadModal}>
                  Записаться бесплатно <span aria-hidden="true">→</span>
                </button>
              </div>
              <div className="three-lesson-promise">
                <b>3</b>
                <span><strong>занятия до первого измеримого результата</strong><small>Конкретную цель зафиксируем на диагностике</small></span>
              </div>
            </div>

            <div className="hero-people" data-reveal>
              <div className="hero-sun" aria-hidden="true">+</div>
              <Image
                className="hero-community"
                src={assetPath("/hero-community-v3.webp")}
                alt="Молодые репетиторы и школьники REDLINE"
                width={1024}
                height={1536}
                priority
              />
            </div>
          </div>
        </section>

        <section className="signal-strip" aria-label="Ключевые преимущества">
          <div className="container signal-grid">
            <div><strong>1 на 1</strong><span>всё внимание ребёнку</span></div>
            <div><strong>3 занятия</strong><span>до первого результата</span></div>
            <div><strong>После каждого</strong><span>отчёт родителю</span></div>
            <div><strong>Сайт + приложение</strong><span>всё общение в одном месте</span></div>
          </div>
        </section>

        <section className="section products-section" id="programs">
          <div className="container products-container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">Не один курс на все случаи</p><h2>Выбираем продукт под <span className="marker marker-red">родительский запрос</span></h2></div>
              <p>Каждый формат доступен по математике, русскому языку и физике. Программа собирается вокруг учебника, цели и срока.</p>
            </div>
            <p className="product-scope">Математика · русский язык · физика</p>
            <div className="product-grid">
              {products.map((product) => (
                <article className={`product-card ${product.className}`} key={product.title}>
                  <div className="product-top"><span>{product.number}</span><i>{product.badge}</i></div>
                  <h3>{product.title}</h3>
                  <p>{product.text}</p>
                  <strong>{product.result}</strong>
                  {product.className === "primary" && (
                    <Image className="product-people" src={assetPath("/product-pair-v3.webp")} alt="Молодой преподаватель помогает школьнику разобраться с заданием" width={1024} height={1536} />
                  )}
                </article>
              ))}
            </div>
            <div className="diagnosis-promo">
              <span>Не знаете, какой формат выбрать?</span>
              <strong>За 30 минут найдём точку старта и соберём маршрут</strong>
              <button className="button button-large" type="button" onClick={openLeadModal}>Записаться на бесплатную диагностику →</button>
            </div>
          </div>
        </section>

        <section className="section result-section" id="first-result">
          <div className="container result-shell" data-reveal>
            <div className="result-intro">
              <p className="section-kicker light">Не ждём четверть, чтобы заметить сдвиг</p>
              <h2>Приведём к <span className="marker marker-yellow">первому результату</span> за 3 занятия</h2>
              <p>Выбираем одну понятную цель и показываем движение по ней ребёнку и родителю.</p>
              <button className="button button-light" type="button" onClick={openLeadModal}>Выбрать первую цель →</button>
            </div>
            <div className="result-steps">
              {[1, 2, 3].map((portrait, index) => {
                const titles = ["Находим опору", "Тренируем навык", "Фиксируем результат"];
                const texts = ["Разбираемся, где именно ломается логика, и объясняем базовый шаг.", "Пробуем несколько заданий и учим ребёнка замечать нужный способ.", "Ребёнок делает целевой шаг самостоятельно, а родитель получает отчёт."];
                return <article key={portrait}><Image className="step-portrait" src={tutorPhoto(portrait)} alt="Молодой преподаватель REDLINE" width={520} height={650} sizes="(max-width: 620px) 86px, 190px" /><span>Занятие {index + 1}</span><h3>{titles[index]}</h3><p>{texts[index]}</p></article>;
              })}
            </div>
          </div>
        </section>

        <section className="section cases-section" id="cases">
          <div className="container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">С чего может начаться маршрут</p><h2>Три знакомые ситуации — <span className="marker marker-red">три разных пути</span></h2></div>
              <p>Это типовые сценарии, не вымышленные отзывы. Точный маршрут появится после диагностики вашего ребёнка.</p>
            </div>
            <div className="case-grid">
              {caseStudies.map((item, index) => (
                <article className="case-card" key={item.title}>
                  <div className="case-photo"><Image src={assetPath(item.photo)} alt={`Ученик: ${item.grade}, ${item.subject}`} fill sizes="(max-width: 620px) 84vw, 33vw" /></div>
                  <div className="case-content">
                    <div className="case-tags"><span>{item.grade}</span><span>{item.subject}</span></div>
                    <h3>{item.title}</h3>
                    <p>{item.route}</p>
                    <button className="button case-cta" type="button" onClick={openLeadModal}>Разобрать нашу ситуацию →</button>
                  </div>
                  <b className="case-number">0{index + 1}</b>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section diagnostics-section" id="diagnostics">
          <div className="container" data-reveal>
            <div className="section-heading heading-row light-heading">
              <div><p className="section-kicker light">30 минут · бесплатно</p><h2>Диагностика проходит с <span className="marker marker-yellow">будущим преподавателем</span></h2></div>
              <p>Камера не нужна. После встречи можно отказаться — понимание пробелов и маршрут останутся у вас.</p>
            </div>
            <div className="diagnostic-grid">
              {diagnosticStages.map((stage) => (
                <article key={stage.number}>
                  <div className="diagnostic-person"><Image src={tutorPhoto(stage.portraitIndex)} alt="Молодой преподаватель REDLINE" fill sizes="(max-width: 620px) 118px, 22vw" /></div>
                  <span>{stage.number}</span><h3>{stage.title}</h3><p>{stage.text}</p>
                </article>
              ))}
            </div>
            <div className="diagnostics-action"><strong>Познакомьтесь с преподавателем до оплаты</strong><button className="button button-light button-large" type="button" onClick={openLeadModal}>Записаться на диагностику →</button></div>
          </div>
        </section>

        <section className="section progress-section" id="progress">
          <div className="container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">Прогресс нельзя прятать в голове преподавателя</p><h2>Родитель и ребёнок <span className="marker marker-red">видят движение</span></h2></div>
              <p>Освоенные темы, регулярность, домашние задания, сильные стороны и зоны роста собраны в понятном личном кабинете.</p>
            </div>
            <div className="dashboard-frame">
              <Image src={assetPath("/progress-dashboard.webp")} alt="Пример кабинета с динамикой прогресса ученика" width={1536} height={1024} />
              <div className="progress-sticker"><strong>+36%</strong><span>пример динамики<br />за 8 занятий</span></div>
            </div>
            <div className="progress-benefits">
              <article><span>Родителю</span><h3>Понятно, за что он платит</h3><p>Есть темы, цифры, рекомендации и следующий шаг — без необходимости контролировать каждый урок.</p></article>
              <article><span>Ребёнку</span><h3>Видно, что усилия работают</h3><p>Небольшие победы становятся заметными и поддерживают мотивацию лучше общей оценки.</p></article>
              <article><span>Преподавателю</span><h3>Легче держать маршрут</h3><p>Видна динамика навыков, поэтому следующее занятие начинается с нужной точки.</p></article>
            </div>
          </div>
        </section>

        <section className="section reports-section">
          <div className="container reports-shell" data-reveal>
            <div className="report-visual">
              <Image src={assetPath("/parent-report-chat.webp")} alt="Пример постоянного отчёта родителю после занятия" width={1208} height={856} />
              <div className="report-avatar"><Image src={tutorPhoto(4)} alt="" width={56} height={56} /><span><strong>Отчёт после занятия</strong>без просьб и напоминаний</span></div>
            </div>
            <div className="report-copy">
              <p className="section-kicker">Постоянная обратная связь</p>
              <h2>После занятия родитель не спрашивает: <span className="marker marker-red">«Ну как?»</span></h2>
              <p>Преподаватель регулярно пишет, что успели, что получилось и над чем работать дальше. Родитель остаётся в курсе, не превращаясь в контролёра.</p>
              <ul><li>короткий итог после занятия;</li><li>конкретные сложности без общих фраз;</li><li>следующая тема и рекомендации;</li><li>видимый прогресс в личном кабинете.</li></ul>
            </div>
          </div>
        </section>

        <section className="section communication-section" id="communication">
          <div className="container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">Не теряем сообщения в разных мессенджерах</p><h2>Приложение и сайт — <span className="marker marker-red">одно место для общения</span></h2></div>
              <p>Ученик отправляет задание и получает подсказку, родитель видит историю занятий, а поддержка остаётся рядом по организационным вопросам.</p>
            </div>
            <div className="communication-grid">
              <div className="phone-stage">
                <div className="phone-copy"><span>В приложении</span><h3>Свободное общение с репетитором</h3><p>Вопрос, фотография задания, голосовое объяснение — всё остаётся в диалоге.</p></div>
                <div className="phone-frame"><Image src={assetPath("/app-tutor-chat.webp")} alt="Диалог ученика с репетитором в приложении REDLINE" width={988} height={2048} /></div>
              </div>
              <div className="site-stage">
                <div><span>На сайте</span><h3>Все чаты и история занятий под рукой</h3><p>Репетитор, поддержка и дополнительные материалы не теряются.</p></div>
                <Image src={assetPath("/website-chats.webp")} alt="Чаты с поддержкой и преподавателями на сайте REDLINE" width={868} height={365} />
                <div className="site-features"><b>✓ преподаватель рядом</b><b>✓ материалы в истории</b><b>✓ поддержка помогает</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section tutor-section" id="tutors">
          <div className="container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">Молодая команда · строгий отбор</p><h2>Подбираем преподавателя <span className="marker marker-red">под ребёнка</span></h2></div>
              <p>На диагностике вы знакомитесь именно с будущим преподавателем и проверяете, подходит ли ребёнку его темп и способ объяснения.</p>
            </div>
            <div className="tutor-criteria">
              <article><span>01</span><h3>Знает школьную программу</h3><p>Работает по учебнику ученика, закрывает пробелы и помогает двигаться на опережение.</p></article>
              <article><span>02</span><h3>Объясняет без давления</h3><p>Разбирает ход мысли, задаёт вопросы и помогает ребёнку не бояться ошибок.</p></article>
              <article><span>03</span><h3>Умеет держать контакт</h3><p>Молодой преподаватель общается на понятном языке, сохраняя структуру и рабочий темп.</p></article>
              <article><span>04</span><h3>Регулярно отчитывается</h3><p>После занятия фиксирует результат, трудности и следующий шаг для родителя.</p></article>
            </div>
            <button className="button tutor-cta" type="button" onClick={openLeadModal}>Познакомиться на диагностике →</button>
          </div>
        </section>

        <section className="section reviews-section" id="reviews">
          <div className="container" data-reveal>
            <div className="section-heading heading-row">
              <div><p className="section-kicker">Что замечают семьи</p><h2>Отзывы, в которых важен <span className="marker marker-red">не шум, а прогресс</span></h2></div>
              <div className="review-controls"><button type="button" onClick={() => scrollReviews(-1)} aria-label="Предыдущие отзывы">←</button><button type="button" onClick={() => scrollReviews(1)} aria-label="Следующие отзывы">→</button></div>
            </div>
            <div className="reviews-track" ref={reviewsRef} aria-label="Отзывы родителей">
              {reviews.map((review, index) => <article className="review-card" key={`${review.name}-${index}`}>
                <div className={`review-avatar review-avatar-${index + 1}`} style={{ backgroundImage: `url(${assetPath("/review-parents-v3.webp")})` }} role="img" aria-label="Портрет родителя" />
                <div><strong>{review.name}</strong><span>{review.meta}</span></div>
                <p>«{review.text}»</p><b aria-hidden="true">★★★★★</b>
              </article>)}
            </div>
            <div className="reviews-bottom"><p>Имена и фотографии изменены для конфиденциальности; формулировки отражают типовые отзывы родителей.</p><button className="button button-large" type="button" onClick={openLeadModal}>Записаться на диагностику →</button></div>
          </div>
        </section>

        <section className="section price-section" id="price">
          <div className="container price-shell" data-reveal>
            <div className="price-main"><span>Индивидуально · 60 минут</span><h2>от 1 200 ₽</h2><p>за одно онлайн-занятие</p><div className="price-note"><strong>Есть пакеты со скидкой</strong><span>Подберём после диагностики без лишних тарифов</span></div></div>
            <div className="price-copy"><p className="section-kicker light">Без перегруженной тарифной таблицы</p><h3>Сначала определяем цель — потом предлагаем формат</h3><p>Для регулярных занятий есть пакеты со скидкой. После диагностики предложим только подходящий вариант и объясним условия до оплаты.</p><ul><li>план под учебник и цель;</li><li>регулярные отчёты родителю;</li><li>прогресс в личном кабинете;</li><li>замена преподавателя, если не совпали.</li></ul><button className="button button-light" type="button" onClick={openLeadModal}>Узнать подходящий формат →</button></div>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container" data-reveal>
            <details className="faq-group">
              <summary className="faq-group-summary"><span><small>Коротко о важном</small><strong>Вопросы родителей</strong></span><i aria-hidden="true">+</i></summary>
              <div className="faq-shell">
                <div className="faq-intro"><p>Не нашли свой вопрос? Напишите напрямую.</p><a href="https://t.me/managerRL" target="_blank" rel="noreferrer">Задать вопрос в Telegram ↗</a></div>
                <div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary><span>{faq.question}</span><i aria-hidden="true">+</i></summary><p>{faq.answer}</p></details>)}</div>
              </div>
            </details>
          </div>
        </section>

        <section className="final-cta">
          <div className="container final-cta-inner" data-reveal>
            <div><p className="section-kicker light">Первая понятная цель</p><h2>Начните с диагностики — <span className="marker marker-yellow">увидьте результат за 3 занятия</span></h2></div>
            <div><p>За 30 минут узнаете пробелы, познакомитесь с будущим преподавателем и получите индивидуальный план. Покупать занятия сразу не нужно.</p><button className="button button-light button-large" type="button" onClick={openLeadModal}>Записаться бесплатно →</button></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand"><strong>REDLINE</strong><p>Индивидуальные занятия для школьников 1–9 классов.</p></div>
          <div><span>Связаться</span><a href="https://t.me/managerRL" target="_blank" rel="noreferrer">Telegram ↗</a></div>
          <div><span>Документы</span><a href={pagePath("/offer/")}>Оферта</a><a href={pagePath("/privacy/")}>Конфиденциальность</a></div>
          <div><span>Навигация</span><a href="#programs">Продукты</a><a href="#progress">Прогресс</a><a href="#price">Стоимость</a></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 REDLINE</span><span>Онлайн · Россия</span></div>
      </footer>

      {isLeadModalOpen && (
        <div className="lead-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeLeadModal(); }}>
          <section className="lead-dialog" role="dialog" aria-modal="true" aria-labelledby="lead-dialog-title">
            <button ref={modalCloseRef} className="lead-dialog-close" type="button" onClick={closeLeadModal} aria-label="Закрыть форму">×</button>
            <div className="lead-card" id="lead-form">
              <div className="lead-card-intro">
                <span>Бесплатно · 30 минут</span>
                <h2 id="lead-dialog-title">Найдём пробелы и познакомим с будущим преподавателем</h2>
                <div className="form-progress" aria-label={`Шаг ${formStep} из 2`}><i className="active" /><i className={formStep === 2 ? "active" : ""} /><b>{formStep}/2</b></div>
              </div>
              <form ref={formRef} className="lead-form" onSubmit={submitLead}>
                <fieldset className="form-step" hidden={formStep !== 1}>
                  <legend>Расскажите о задаче</legend>
                  <div className="form-grid">
                    <label><span>Класс</span><select name="grade" defaultValue="" required><option value="" disabled>Выберите</option>{[1,2,3,4,5,6,7,8,9].map((grade) => <option value={`${grade} класс`} key={grade}>{grade} класс</option>)}</select></label>
                    <label><span>Предмет</span><select name="subject" defaultValue="" required><option value="" disabled>Выберите</option><option>Математика</option><option>Русский язык</option><option>Физика</option></select></label>
                    <label className="goal-field"><span>Цель</span><select name="goal" defaultValue="" required><option value="" disabled>Что важно сейчас?</option>{goals.map((goal) => <option value={goal} key={goal}>{goal}</option>)}</select></label>
                    <button className="button submit-button" type="button" onClick={advanceForm}>Продолжить →</button>
                  </div>
                </fieldset>
                <fieldset className="form-step" hidden={formStep !== 2}>
                  <legend>Куда отправить подтверждение</legend>
                  <div className="form-grid contact-grid">
                    <label><span>Ваше имя</span><input name="parent_name" type="text" autoComplete="name" minLength={2} placeholder="Например, Анна" required /></label>
                    <label><span>Телефон</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 999 000-00-00" required /></label>
                    <label><span>Как связаться</span><select name="contact_method" defaultValue="Телефонный звонок"><option>Телефонный звонок</option><option>Telegram по номеру телефона</option></select></label>
                    <button className="button submit-button" type="submit" disabled={formStatus === "loading"}>{formStatus === "loading" ? "Отправляем…" : "Записаться бесплатно"}</button>
                  </div>
                  <div className="form-meta">
                    <button className="back-button" type="button" onClick={() => setFormStep(1)}>← Назад</button>
                    <label className="consent-field"><input type="checkbox" name="consent" required /><span>Согласен(а) на обработку данных по <a href={pagePath("/privacy/")} target="_blank" rel="noreferrer">политике</a></span></label>
                  </div>
                </fieldset>
                {formMessage && <div className={`form-message ${formStatus}`} role={formStatus === "error" ? "alert" : "status"}>{formMessage}{formStatus === "error" && <> <a href="https://t.me/managerRL" target="_blank" rel="noreferrer">Написать в Telegram</a></>}</div>}
              </form>
            </div>
          </section>
        </div>
      )}

      {isVideoVisible && <aside className={`floating-review${isVideoExpanded ? " is-expanded" : ""}`} aria-label="Видеоотзыв родителя">
        <div className="floating-review-head">
          <span><b>Видеоотзыв родителя</b><small>о занятиях в REDLINE</small></span>
          <button type="button" onClick={() => { setIsVideoVisible(false); setIsVideoExpanded(false); }} aria-label="Закрыть видеоотзыв">×</button>
        </div>
        <div className="floating-review-media">
          {isVideoExpanded ? <video
            ref={parentVideoRef}
            src={assetPath("/parent-review-video.mp4")}
            autoPlay
            playsInline
            preload="none"
            controls
          >
            <track kind="captions" src={assetPath("/parent-review-captions.vtt")} srcLang="ru" label="Русские субтитры" />
          </video> : <button type="button" className="floating-review-open" onClick={() => toggleParentVideo(true)} aria-label="Открыть видеоотзыв родителя"><span aria-hidden="true">▶</span><b>Смотреть отзыв</b></button>}
        </div>
      </aside>}

      <button className="mobile-sticky" type="button" onClick={openLeadModal}>Бесплатная диагностика <span>→</span></button>
    </>
  );
}

