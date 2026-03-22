"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  HeartHandshake,
  Instagram,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  Star,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/bd.clinicaodontologicaa/";
const WHATSAPP_URL =
  "https://web.whatsapp.com/send/?phone=5511984760850&text&type=phone_number&app_absent=0";

type Service = {
  id: string;
  icon: LucideIcon;
  title: string;
  short: string;
  description: string;
  bullets: string[];
};

type ContactItem = {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
  cta?: string;
};

const services: Service[] = [
  {
    id: "ortodontia",
    icon: SmilePlus,
    title: "Ortodontia",
    short: "Aparelhos autoligáveis, fixos, estéticos e alinhadores.",
    description:
      "Tratamentos completos para alinhamento dental, com opções modernas e personalizadas, como aparelhos autoligáveis, fixos, estéticos e alinhadores.",
    bullets: [
      "Aparelhos autoligáveis",
      "Aparelhos fixos e estéticos",
      "Alinhadores e planejamento individual",
    ],
  },
  {
    id: "estetica-dental",
    icon: Sparkles,
    title: "Estética dental",
    short: "Restaurações com porcelanas e resinas.",
    description:
      "Tratamentos restauradores voltados à harmonia do sorriso, com abordagem estética e funcional por meio de porcelanas e resinas.",
    bullets: [
      "Porcelanas e resinas",
      "Harmonia do sorriso",
      "Estética com naturalidade",
    ],
  },
  {
    id: "harmonizacao-facial",
    icon: HeartHandshake,
    title: "Harmonização facial",
    short: "Tratamentos terapêuticos, funcionais e estéticos.",
    description:
      "Atuação voltada ao equilíbrio facial e bem-estar, com tratamentos que unem função, estética e abordagem terapêutica.",
    bullets: [
      "Equilíbrio facial",
      "Abordagem funcional",
      "Estética com planejamento",
    ],
  },
  {
    id: "implantodontia",
    icon: ShieldCheck,
    title: "Implantodontia",
    short: "Reposição dental com função, estética e saúde.",
    description:
      "Tratamento indicado para repor a perda parcial ou total dos dentes, restituindo função mastigatória, estética e saúde do sorriso.",
    bullets: [
      "Reposição parcial ou total",
      "Recuperação estética e funcional",
      "Mais segurança e qualidade de vida",
    ],
  },
  {
    id: "protese",
    icon: BadgeCheck,
    title: "Prótese",
    short: "Reposição de um ou mais dentes perdidos.",
    description:
      "Uma excelente alternativa para pacientes que desejam repor um ou mais dentes perdidos, com foco em conforto, função e estética.",
    bullets: [
      "Reposição dental",
      "Conforto mastigatório",
      "Reabilitação estética",
    ],
  },
  {
    id: "endodontia",
    icon: Stethoscope,
    title: "Endodontia",
    short: "Tratamento de canal e cuidado da parte interna do dente.",
    description:
      "Especialidade que atua no diagnóstico e tratamento da parte interna do dente, incluindo procedimentos de canal com precisão e cuidado.",
    bullets: [
      "Tratamento de canal",
      "Preservação dental",
      "Cuidado especializado",
    ],
  },
  {
    id: "periodontia",
    icon: ShieldCheck,
    title: "Periodontia",
    short: "Saúde gengival e prevenção bucal.",
    description:
      "Prevenção da saúde bucal e tratamento de doenças gengivais, como gengivite e periodontite, com acompanhamento individualizado.",
    bullets: [
      "Prevenção gengival",
      "Tratamento de gengivite",
      "Controle de periodontite",
    ],
  },
  {
    id: "cirurgia",
    icon: CalendarDays,
    title: "Cirurgia",
    short: "Diagnóstico, tratamento e extrações indicadas.",
    description:
      "Diagnóstico, tratamento e acompanhamento de dentes com indicação de extração, como nos casos de dentes sisos.",
    bullets: [
      "Avaliação cirúrgica",
      "Extrações indicadas",
      "Acompanhamento clínico",
    ],
  },
  {
    id: "odontopediatria",
    icon: SmilePlus,
    title: "Odontopediatria",
    short: "Saúde bucal infantil do nascimento à adolescência.",
    description:
      "Cuidados voltados à saúde bucal de crianças, desde o nascimento até a adolescência, com acolhimento e abordagem adequada a cada fase.",
    bullets: [
      "Atendimento infantil",
      "Acompanhamento por faixa etária",
      "Prevenção e orientação",
    ],
  },
  {
    id: "exames-radiograficos",
    icon: BadgeCheck,
    title: "Exames radiográficos",
    short: "Exames de suporte ao diagnóstico e avaliação clínica.",
    description:
      "Exames e avaliações de suporte ao diagnóstico, com foco na saúde bucal e no atendimento individual de cada paciente.",
    bullets: [
      "Suporte ao diagnóstico",
      "Avaliação individual",
      "Mais precisão clínica",
    ],
  },
  {
    id: "dtm-dor-orofacial",
    icon: HeartHandshake,
    title: "DTM e dor orofacial",
    short: "Cuidado para dor e desconforto com foco em qualidade de vida.",
    description:
      "Atendimento voltado ao cuidado da dor e do desconforto orofacial, ajudando a melhorar bem-estar, função e qualidade de vida.",
    bullets: [
      "Avaliação da dor orofacial",
      "Cuidado funcional",
      "Foco em qualidade de vida",
    ],
  },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: "Excelência clínica",
    text: "Atendimento com alto padrão técnico, planejamento cuidadoso e foco na segurança em cada etapa.",
  },
  {
    icon: Sparkles,
    title: "Estética com naturalidade",
    text: "Resultados elegantes e harmoniosos, respeitando a individualidade de cada sorriso.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado humanizado",
    text: "Uma experiência acolhedora, próxima e transparente do primeiro contato ao pós-tratamento.",
  },
];

const stats = [
  { label: "Especialidades", value: "11" },
  { label: "Atendimento", value: "Humanizado" },
  { label: "Agendamento", value: "WhatsApp" },
];

const steps = [
  {
    number: "01",
    title: "Primeiro contato",
    text: "O paciente conhece a clínica, esclarece dúvidas e agenda sua avaliação com praticidade.",
  },
  {
    number: "02",
    title: "Avaliação individualizada",
    text: "Cada caso é analisado com cuidado para definir um plano de tratamento claro e seguro.",
  },
  {
    number: "03",
    title: "Planejamento do tratamento",
    text: "As decisões clínicas priorizam saúde, função, conforto e estética, conforme a necessidade do paciente.",
  },
  {
    number: "04",
    title: "Acompanhamento próximo",
    text: "O paciente é acompanhado em todas as etapas, com orientação transparente e experiência acolhedora.",
  },
];

const testimonials = [
  {
    name: "Atendimento acolhedor",
    role: "Experiência do paciente",
    text: "O atendimento transmite segurança, acolhimento e atenção genuína às necessidades de cada paciente.",
  },
  {
    name: "Confiança no cuidado",
    role: "Experiência clínica",
    text: "A clínica une conhecimento técnico e proximidade, fazendo o paciente se sentir bem cuidado em todas as etapas.",
  },
  {
    name: "Contato facilitado",
    role: "Agendamento",
    text: "O processo de contato e agendamento é simples, direto e pensado para facilitar a vida do paciente.",
  },
];

const faqs = [
  {
    q: "Quais tratamentos a clínica oferece?",
    a: "A BD Odontologia conta com ortodontia, estética dental, harmonização facial, implantodontia, prótese, endodontia, periodontia, cirurgia, odontopediatria, exames radiográficos e atendimento para DTM e dor orofacial.",
  },
  {
    q: "Onde a clínica está localizada?",
    a: "A clínica está localizada na Rua Bom Pastor, 2444 - Ipiranga, São Paulo - SP, 04203002 - 1403.",
  },
  {
    q: "Como funciona o agendamento?",
    a: "O agendamento pode ser iniciado diretamente pelo WhatsApp da clínica, com atendimento rápido e acolhedor.",
  },
  {
    q: "A rota /acesso continua disponível?",
    a: "Sim. O acesso continua disponível normalmente no cabeçalho e no rodapé da página.",
  },
];

const contactItems: ContactItem[] = [
  {
    icon: MapPin,
    title: "Endereço da clínica",
    text: "Rua Bom Pastor, 2444 - Ipiranga, São Paulo - SP, 04203002 - 1403",
  },
  {
    icon: Phone,
    title: "Agendamento por WhatsApp",
    text: "Fale com a clínica pelo WhatsApp para agendar sua avaliação de forma rápida e acolhedora.",
    href: WHATSAPP_URL,
    cta: "Abrir WhatsApp",
  },
  {
    icon: Instagram,
    title: "Instagram oficial",
    text: "@bd.clinicaodontologicaa",
    href: INSTAGRAM_URL,
    cta: "Ver Instagram",
  },
  {
    icon: Clock3,
    title: "Horário de atendimento",
    text: "Defina aqui os dias e horários de funcionamento da clínica.",
  },
];

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B9298]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl leading-tight text-[#2F3437] md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[#5B646C] md:text-lg">
        {description}
      </p>
    </div>
  );
}

function ExternalButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

export default function SiteClinicaProfissional() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<string>(services[0].id);
  const [openFaq, setOpenFaq] = useState<number>(0);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === activeService) ?? services[0];
  }, [activeService]);

  return (
    <main className="h-screen overflow-y-auto overflow-x-hidden bg-[#F7F5F3] text-[#2F3437] scroll-smooth">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(201,150,44,0.18), transparent 32%), radial-gradient(circle at top right, rgba(180,141,109,0.18), transparent 28%), linear-gradient(180deg, rgba(233,220,209,0.45) 0%, rgba(250,245,241,0) 72%)",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-[#E6D6CB]/80 bg-[#F7F5F3]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="#inicio" className="flex min-w-0 items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#DEC9BA] bg-white shadow-sm">
              <Image src="/logo2.png" alt="Logo BD Odontologia" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B9298] sm:text-xs">
                BD Odontologia
              </p>
              <p className="truncate text-xs text-[#7A6458] sm:text-sm">
                Clínica odontológica especializada
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[#68544A] lg:flex">
            <Link href="#sobre" className="transition hover:text-[#BAA391]">
              Sobre
            </Link>
            <Link href="#tratamentos" className="transition hover:text-[#BAA391]">
              Tratamentos
            </Link>
            <Link href="#jornada" className="transition hover:text-[#BAA391]">
              Jornada
            </Link>
            <Link href="#faq" className="transition hover:text-[#BAA391]">
              Dúvidas
            </Link>
            <Link href="#contato" className="transition hover:text-[#BAA391]">
              Contato
            </Link>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/acesso"
              className="inline-flex items-center rounded-full border border-[#D8C1B1] bg-white px-4 py-2.5 text-sm font-medium text-[#5D483F] transition hover:bg-[#F7F5F3]"
            >
              Área de acesso
            </Link>
            <ExternalButton
              href={WHATSAPP_URL}
              className="inline-flex items-center gap-2 rounded-full bg-[#BAA391] px-5 py-2.5 text-sm font-medium text-white shadow-[0_14px_32px_rgba(166,110,0,0.20)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
            >
              Agendar avaliação
              <ArrowRight className="h-4 w-4" />
            </ExternalButton>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#DDCCBF] bg-white text-[#614C42] lg:hidden"
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#E7D9CF] bg-[#F7F5F3] lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4">
              {[
                ["#sobre", "Sobre"],
                ["#tratamentos", "Tratamentos"],
                ["#jornada", "Jornada"],
                ["#faq", "Dúvidas"],
                ["#contato", "Contato"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-[#5C483E] transition hover:bg-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/acesso"
                  className="rounded-2xl border border-[#D7C3B5] bg-white px-4 py-3 text-center text-sm font-medium text-[#5C483E]"
                  onClick={() => setMenuOpen(false)}
                >
                  Área de acesso
                </Link>
                <ExternalButton
                  href={WHATSAPP_URL}
                  className="rounded-2xl bg-[#BAA391] px-4 py-3 text-center text-sm font-medium text-white"
                >
                  Agendar avaliação
                </ExternalButton>
              </div>
            </div>
          </div>
        )}
      </header>

      <section id="inicio" className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4D3C8] bg-white/90 px-4 py-2 text-sm text-[#8B9298] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#BAA391]" />
              Cuidado odontológico com excelência, acolhimento e confiança
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl leading-[1.02] text-[#2F3437] sm:text-5xl lg:text-7xl">
              Sorrisos mais saudáveis, funcionais e bonitos com a BD Odontologia.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#5B646C] md:text-lg">
              Na BD Odontologia, cada atendimento é conduzido com atenção aos detalhes, escuta cuidadosa e foco em saúde, função e estética, para que cada paciente tenha uma experiência segura, acolhedora e personalizada.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ExternalButton
                href={WHATSAPP_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BAA391] px-6 py-3.5 text-sm font-medium text-white shadow-[0_20px_40px_rgba(166,110,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
              >
                Solicitar avaliação
                <ArrowRight className="h-4 w-4" />
              </ExternalButton>
              <Link
                href="#tratamentos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DBC7B9] bg-white px-6 py-3.5 text-sm font-medium text-[#5B646C] transition hover:bg-[#F7F5F3]"
              >
                Ver tratamentos
              </Link>
              <Link
                href="/acesso"
                className="inline-flex items-center justify-center gap-2 rounded-full px-2 py-3.5 text-sm font-medium text-[#8B9298] transition hover:text-[#BAA391]"
              >
                Ir para /acesso
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-[#E7D8CF] bg-white/85 p-5 shadow-sm"
                >
                  <p className="text-2xl font-semibold text-[#2F3437]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#736056]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#D8CEC7]/30 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#D8CEC7]/30 blur-3xl" />

            <div className="relative overflow-hidden rounded-[34px] border border-[#E4D2C6] bg-white shadow-[0_28px_70px_rgba(85,61,49,0.12)]">
              <div className="border-b border-[#EEE0D7] bg-[#F7F5F3] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B9298]">
                      BD Odontologia
                    </p>
                    <h2 className="mt-3 text-2xl text-[#2F3437] sm:text-3xl">
                      Excelência em cada sorriso
                    </h2>
                  </div>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#E6D7CD] bg-white">
                    <Image src="/logo2.png" alt="Logo da clínica" fill className="object-cover" />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                <div className="rounded-[28px] bg-[linear-gradient(135deg,#D8CEC7_0%,#D8CEC7_100%)] p-6 text-white">
                  <div className="grid items-center gap-6 md:grid-cols-[0.8fr_1.2fr]">
                    <div className="relative mx-auto h-28 w-28 md:h-32 md:w-32">
                      <Image src="/logo2.png" alt="Símbolo da marca" fill className="object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
                        Atendimento especializado
                      </p>
                      <h3 className="mt-3 text-2xl leading-tight sm:text-3xl">
                        Tratamentos pensados para cuidar do seu sorriso com segurança e naturalidade.
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-white/90">
                        A clínica une conhecimento técnico, atendimento humanizado e planejamento individualizado para oferecer tratamentos odontológicos completos, com foco em bem-estar, funcionalidade e estética do sorriso.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    "Atendimento acolhedor e humanizado",
                    "Avaliação cuidadosa e individual",
                    "Especialidades para diferentes necessidades",
                    "Agendamento facilitado por WhatsApp",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-[#E9DCD3] bg-[#FFFDFC] px-4 py-3 text-sm text-[#655146]"
                    >
                      <BadgeCheck className="h-4 w-4 shrink-0 text-[#BAA391]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8D9CE] bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-3 lg:px-8">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[28px] border border-[#EADDD4] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(90,67,55,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5F3] text-[#BAA391]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-2xl text-[#2F3437]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5B646C]">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] xl:gap-12">
          <div className="rounded-[34px] border border-[#E6D8CE] bg-white p-7 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B9298]">
              Sobre a clínica
            </p>
            <h2 className="mt-4 text-3xl leading-tight text-[#2F3437] md:text-5xl">
              Um atendimento odontológico completo, humano e especializado.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5B646C]">
              A BD Odontologia oferece um cuidado próximo e individualizado, com tratamentos voltados à prevenção, reabilitação, função e estética. Cada plano é conduzido com responsabilidade clínica, clareza e atenção às necessidades de cada paciente.
            </p>
            <p className="mt-4 text-base leading-8 text-[#5B646C]">
              Com uma abordagem que une técnica, acolhimento e planejamento, a clínica busca proporcionar uma experiência segura e confortável em todas as etapas, desde a avaliação inicial até o acompanhamento do tratamento.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Atendimento individualizado",
                text: "Cada paciente é atendido de forma única, com escuta cuidadosa e um plano de tratamento pensado para sua necessidade.",
              },
              {
                title: "Cuidado humanizado",
                text: "A clínica prioriza acolhimento, transparência e conforto para que cada consulta aconteça com tranquilidade e confiança.",
              },
              {
                title: "Tratamentos completos",
                text: "A BD Odontologia reúne especialidades que atendem diferentes necessidades clínicas, funcionais e estéticas em um só lugar.",
              },
              {
                title: "Confiança e segurança",
                text: "Os tratamentos são conduzidos com responsabilidade, planejamento e foco em resultados consistentes para a saúde bucal.",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-[#E7D8CF] bg-[#F7F5F3] p-7 transition hover:bg-white"
              >
                <div className="h-1.5 w-14 rounded-full bg-[#BAA391]" />
                <h3 className="mt-5 text-2xl text-[#2F3437]">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5B646C]">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tratamentos" className="bg-[#F7F5F3] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionTitle
            eyebrow="Tratamentos"
            title="Tratamentos que unem saúde, função e estética para o seu sorriso"
            description="Conheça as especialidades da BD Odontologia e veja como cada tratamento pode contribuir para prevenção, reabilitação, conforto e confiança no dia a dia, sempre com atendimento individualizado."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.id}
                  className="rounded-[28px] border border-[#E3D3C8] bg-white p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(112,77,27,0.10)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5F3] text-[#BAA391]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-2xl text-[#2F3437]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5B646C]">{service.short}</p>

                  <p className="mt-4 text-sm leading-7 text-[#8B9298]">
                    {service.description}
                  </p>

                  <div className="mt-5 space-y-2">
                    {service.bullets.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-sm leading-6 text-[#5E4A40]"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#BAA391]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#BAA391] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
                  >
                    Agendar avaliação
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="jornada" className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <SectionTitle
          eyebrow="Jornada do paciente"
          title="Uma experiência organizada do primeiro contato ao acompanhamento"
          description="Cada etapa do atendimento é pensada para oferecer mais clareza, segurança e confiança ao paciente."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group rounded-[30px] border border-[#E6D8CE] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(84,60,49,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-4xl text-[#BAA391]">{step.number}</span>
                <CalendarDays className="h-5 w-5 text-[#BAA391] transition group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-5 text-2xl text-[#2F3437]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#5B646C]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#3A4045] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Diferenciais da BD Odontologia
              </p>
              <h2 className="mt-4 text-3xl leading-tight sm:text-5xl">
                Cuidado completo para quem busca saúde, confiança e bem-estar.
              </h2>
              <p className="mt-5 text-sm leading-8 text-white/80 md:text-base">
                A BD Odontologia combina atendimento humanizado, especialidades integradas e planejamento cuidadoso para oferecer uma experiência odontológica de alto padrão, com foco real na qualidade de vida do paciente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Atendimento acolhedor e humanizado",
                "Avaliação cuidadosa e individual",
                "Especialidades para diferentes necessidades",
                "Tratamentos com foco em função e estética",
                "Acompanhamento próximo em cada etapa",
                "Planejamento responsável e transparente",
                "Agendamento facilitado por WhatsApp",
                "Localização de fácil acesso no Ipiranga",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F0C86F]" />
                  <p className="text-sm leading-7 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <SectionTitle
          eyebrow="Experiência BD Odontologia"
          title="Um cuidado que transmite confiança desde o primeiro contato"
          description="A forma de atender, orientar e acompanhar cada paciente faz parte da experiência da clínica e reforça o compromisso com excelência, acolhimento e resultado."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[30px] border border-[#E5D7CC] bg-white p-7 shadow-sm"
            >
              <div className="flex items-center gap-1 text-[#BAA391]">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-8 text-[#5B646C]">“{item.text}”</p>
              <div className="mt-6 border-t border-[#EEE2D9] pt-5">
                <p className="font-semibold text-[#2F3437]">{item.name}</p>
                <p className="mt-1 text-sm text-[#8B9298]">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-[#F7F5F3] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <SectionTitle
            eyebrow="Dúvidas frequentes"
            title="Dúvidas sobre atendimento, localização e agendamento"
            description="Aqui você encontra respostas rápidas para as principais dúvidas sobre os tratamentos, a localização da clínica e a forma de agendamento."
          />

          <div className="mt-10 space-y-4">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[26px] border border-[#E4D5CA] bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-medium text-[#4A372F] md:text-lg">{item.q}</span>
                    <ChevronDown
                      className={[
                        "h-5 w-5 shrink-0 text-[#8B9298] transition-transform duration-300",
                        isOpen ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  <div
                    className={[
                      "grid transition-all duration-300",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-8 text-[#5B646C]">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-[#E4D5CA] bg-[linear-gradient(135deg,#F7F5F3_0%,#F7EEE7_52%,#F7F5F3_100%)] p-8 shadow-[0_24px_60px_rgba(90,66,54,0.08)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B9298]">
                Agende sua avaliação
              </p>
              <h2 className="mt-4 text-3xl leading-tight text-[#2F3437] md:text-5xl">
                Seu sorriso merece atenção, cuidado e um tratamento pensado para você.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5B646C]">
                Entre em contato com a BD Odontologia e agende sua avaliação para conhecer o tratamento mais indicado para o seu caso.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ExternalButton
                href={WHATSAPP_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BAA391] px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(166,110,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
              >
                Agendar avaliação
                <ArrowRight className="h-4 w-4" />
              </ExternalButton>
              <Link
                href="/acesso"
                className="inline-flex items-center justify-center rounded-full border border-[#D7C2B4] bg-white px-6 py-3.5 text-sm font-medium text-[#5B646C] transition hover:bg-[#F7F5F3]"
              >
                Ir para área de acesso
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="bg-[#2F3437] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Contato e localização
              </p>
              <h2 className="mt-4 text-3xl leading-tight sm:text-5xl">
                Entre em contato e venha conhecer a BD Odontologia.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/78 md:text-base">
                Estamos no Ipiranga, em São Paulo, com atendimento pensado para oferecer praticidade no contato, acolhimento na consulta e confiança em cada etapa do tratamento.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F1CC7B]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-2xl text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/75">{item.text}</p>
                    {item.href && item.cta ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        {item.cta}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                  Fale com a clínica
                </p>
                <h3 className="mt-3 text-3xl text-white">
                  Agende sua avaliação pelo WhatsApp
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-8 text-white/78 md:text-base">
                  Nossa equipe está pronta para orientar você, esclarecer dúvidas e ajudar no agendamento da sua avaliação com praticidade e atenção.
                </p>
              </div>

              <div className="rounded-[28px] bg-white p-6 text-[#4A372F] shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
                <h4 className="text-center text-2xl leading-tight text-[#2F3437]">
                  Dê o próximo passo para cuidar do seu sorriso
                </h4>
                <p className="mt-3 text-center text-sm text-[#6F5B50]">
                  Preencha os dados para iniciar seu atendimento
                </p>
                <div className="mt-5 space-y-3">
                  <input
                    type="text"
                    placeholder="Digite seu nome completo"
                    className="w-full rounded-2xl bg-[#F1EFEE] px-4 py-3 text-sm text-[#4A372F] outline-none placeholder:text-[#8391A1]"
                  />
                  <input
                    type="tel"
                    placeholder="Digite seu telefone"
                    className="w-full rounded-2xl bg-[#F1EFEE] px-4 py-3 text-sm text-[#4A372F] outline-none placeholder:text-[#8391A1]"
                  />
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#BAA391] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    CHAMAR NO WHATSAPP
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:flex-wrap">
              <Link
                href="#inicio"
                className="inline-flex items-center justify-center rounded-full bg-[#BAA391] px-6 py-3 text-sm font-medium text-[#2F3437] transition hover:bg-[#A28D7D]"
              >
                Voltar ao topo
              </Link>
              <Link
                href="/acesso"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Área de acesso
              </Link>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
