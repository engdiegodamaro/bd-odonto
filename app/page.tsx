"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Instagram,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/drabrunadamaro/";
const WHATSAPP_URL =
  "https://wa.me/5511973058848?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o%20na%20BD%20Odontologia.";
const ADDRESS = "Rua Bom Pastor, 2444 - Ipiranga, São Paulo - SP, sala 1403";
const PHONE_LABEL = "(11) 97305-8848";

const LAYOUT = {
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
  section: "py-14 sm:py-20",
} as const;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type Treatment = {
  id: string;
  label: string;
  title: string;
  text: string;
  items: string[];
  icon: LucideIcon;
};

type Photo = {
  src: string;
  title: string;
};

const navItems = [
  { href: "#inicio", label: "Início" },
  { href: "#tratamentos", label: "Tratamentos" },
  { href: "#profissional", label: "Profissional" },
  { href: "#consultorio", label: "Consultório" },
  // { href: "#resultados", label: "Resultados" },
  { href: "#contato", label: "Contato" },
];

const treatments: Treatment[] = [
  {
    id: "estetica",
    label: "Estética",
    title: "Sorriso mais leve, harmônico e natural",
    text: "Planejamento cuidadoso para valorizar seu sorriso com equilíbrio, naturalidade e segurança em cada detalhe.",
    items: ["Clareamento dental", "Facetas", "Lentes de contato dental", "Harmonização facial"],
    icon: Sparkles,
  },
  {
    id: "reabilitacao",
    label: "Reabilitação",
    title: "Mais conforto para falar, sorrir e mastigar",
    text: "Tratamentos voltados a devolver função, estabilidade e confiança no dia a dia com um plano individualizado.",
    items: ["Implantes", "Próteses", "Reabilitação oral", "Cirurgia"],
    icon: ShieldCheck,
  },
  {
    id: "saude",
    label: "Saúde bucal",
    title: "Prevenção, diagnóstico e cuidado contínuo",
    text: "Acompanhamento próximo para diferentes necessidades clínicas, com orientação clara durante todo o tratamento.",
    items: ["Ortodontia", "Canal", "Periodontia", "Radiografias"],
    icon: Stethoscope,
  },
  {
    id: "familia",
    label: "Família",
    title: "Atendimento acolhedor em cada fase da vida",
    text: "Cuidado para crianças, adultos e famílias com atenção individual, escuta e uma experiência mais tranquila.",
    items: ["Odontopediatria", "Avaliação preventiva", "DTM e dor orofacial"],
    icon: UserRound,
  },
];

const officePhotos: Photo[] = [
  { src: "/consultorio-1.png", title: "Recepção" },
  { src: "/consultorio-2.png", title: "Consultório" },
  { src: "/consultorio-3.png", title: "Detalhes do espaço" },
  { src: "/consultorio-4.png", title: "Ambiente da clínica" },
];

const steps = [
  { title: "Conversa inicial", text: "Entendimento da sua necessidade e orientação sobre o melhor caminho." },
  { title: "Avaliação detalhada", text: "Análise cuidadosa para definir prioridades, possibilidades e etapas do tratamento." },
  { title: "Planejamento", text: "Proposta individualizada, explicada com clareza e focada no seu objetivo." },
  { title: "Acompanhamento", text: "Suporte durante o tratamento para que você se sinta seguro em cada fase." },
];

const faqs = [
  {
    q: "Quais tratamentos a BD Odontologia oferece?",
    a: "A clínica oferece ortodontia, estética dental, harmonização facial, implantodontia, prótese, endodontia, periodontia, cirurgia, odontopediatria, exames radiográficos e atendimento para DTM e dor orofacial.",
  },
  {
    q: "Como posso agendar uma avaliação?",
    a: "O agendamento pode ser feito diretamente pelo WhatsApp da clínica, de forma prática e rápida.",
  },
  {
    q: "A clínica atende casos de saúde e também estética?",
    a: "Sim. A BD Odontologia trabalha com uma abordagem completa, unindo prevenção, reabilitação, função e estética conforme a necessidade de cada paciente.",
  },
  {
    q: "Onde a clínica está localizada?",
    a: `A clínica está em ${ADDRESS}.`,
  },
];

function ExternalAnchor({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-[#E8DDD4] bg-white shadow-[0_16px_44px_rgba(82,59,45,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8B7C72] sm:text-xs">{overline}</p>
      <h2 className="mt-4 text-[clamp(1.75rem,7vw,2.35rem)] leading-[1.08] text-[#2D2825] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#6A605A] sm:text-base">{description}</p>
    </div>
  );
}

export default function BDOdontologiaPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTreatment, setActiveTreatment] = useState(treatments[0].id);
  const [activePhoto, setActivePhoto] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const prevHtmlOverflow = document.documentElement.style.overflowY;
    const prevBodyOverflow = document.body.style.overflowY;

    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";

    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflow;
      document.body.style.overflowY = prevBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const selectedTreatment = useMemo(
    () => treatments.find((item) => item.id === activeTreatment) ?? treatments[0],
    [activeTreatment],
  );

  const currentPhoto = officePhotos[activePhoto] ?? officePhotos[0];

  const prevPhoto = () => setActivePhoto((value) => (value - 1 + officePhotos.length) % officePhotos.length);
  const nextPhoto = () => setActivePhoto((value) => (value + 1) % officePhotos.length);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8F4F0] pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-[#2D2825] sm:pb-0">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(186,163,145,0.20), transparent 32%), linear-gradient(180deg, rgba(248,244,240,0.96) 0%, rgba(248,244,240,0.78) 54%, rgba(248,244,240,0) 100%)",
        }}
      />

      <header
        className="sticky top-0 z-40 border-b border-[#EAE0D8] bg-[#F8F4F0]/88 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className={cx(LAYOUT.container, "flex items-center justify-between gap-3 py-3.5 sm:gap-4 sm:py-4")}>
          <Link href="#inicio" className="flex min-w-0 items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E3D6CC] bg-white">
              <Image src="/logo2.png" alt="Logo BD Odontologia" fill className="object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5E534D] sm:text-xs">BD Odontologia</p>
              <p className="text-xs text-[#86786E] sm:text-sm">Atendimento odontológico</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-[#5D514A] lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#A18B7B]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/acesso"
              className="inline-flex items-center rounded-full border border-[#DECFC4] bg-white px-4 py-2.5 text-sm font-medium text-[#5A4E47] transition hover:bg-[#FBF8F5]"
            >
              Área de acesso
            </Link>
            <ExternalAnchor
              href={WHATSAPP_URL}
              className="inline-flex items-center gap-2 rounded-full bg-[#BAA391] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,70,56,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
            >
              Agendar avaliação
              <ArrowRight className="h-4 w-4" />
            </ExternalAnchor>
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
          <div className="border-t border-[#E7D9CF] bg-[#F8F4F0] lg:hidden">
            <div
              className={cx(
                LAYOUT.container,
                "flex max-h-[70svh] flex-col gap-2 overflow-y-auto py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
              )}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-[#5C483E] transition hover:bg-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
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
                <ExternalAnchor href={WHATSAPP_URL} className="rounded-2xl bg-[#BAA391] px-4 py-3 text-center text-sm font-medium text-white">
                  Agendar avaliação
                </ExternalAnchor>
              </div>
            </div>
          </div>
        )}
      </header>

      <section
        id="inicio"
        className={cx(LAYOUT.container, "scroll-mt-24 pb-14 pt-10 sm:scroll-mt-28 sm:pb-20 lg:pt-16")}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.04fr_0.96fr] xl:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4D8CE] bg-white px-4 py-2 text-sm text-[#786B64] shadow-sm">
              <CalendarDays className="h-4 w-4 text-[#BAA391]" />
              Avaliação com horário agendado
            </div>

            <h1 className="mt-6 max-w-4xl text-[clamp(2rem,9vw,3.75rem)] leading-[1.05] text-[#2D2825]">
              Cuidado odontológico com atenção aos detalhes, conforto e confiança em cada etapa.
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#6A605A] sm:text-base sm:leading-8 md:text-lg">
              Na BD Odontologia, cada tratamento é conduzido com escuta, planejamento individualizado e uma experiência pensada para que você se sinta seguro do início ao fim.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ExternalAnchor
                href={WHATSAPP_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BAA391] px-6 py-3.5 text-sm font-medium text-white shadow-[0_18px_38px_rgba(91,70,56,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D]"
              >
                Agendar avaliação
                <ArrowRight className="h-4 w-4" />
              </ExternalAnchor>
              <Link
                href="#tratamentos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DBCFC6] bg-white px-6 py-3.5 text-sm font-medium text-[#5B514B] transition hover:bg-[#FCFAF8]"
              >
                Ver tratamentos
              </Link>
            </div>

            {/* <div className="mt-8 flex flex-wrap gap-2.5">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-[#E7DBD2] bg-white px-4 py-2 text-sm text-[#6D625B]"
                >
                  {item}
                </span>
              ))}
            </div> */}
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 hidden h-28 w-28 rounded-full bg-[#D8CCC3]/45 blur-3xl sm:block" />
            <Card className="overflow-hidden border-[#E5D7CC] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF6F1_100%)] p-3 sm:p-4">
              <div className="relative overflow-hidden rounded-[24px] bg-[#EFE6DF]">
                <div className="absolute left-3 top-3 z-10 max-w-[80%] rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-medium text-[#5B5049] shadow-sm sm:left-4 sm:top-4 sm:max-w-none sm:px-4 sm:py-2 sm:text-xs">
                  Atendimento acolhedor e planejamento cuidadoso
                </div>
                <div className="relative aspect-[4/4.35] sm:aspect-[4/4.6]">
                  <Image src="/consultorio-1.png" alt="Ambiente da BD Odontologia" fill className="object-cover" priority />
                </div>
              </div>
              {/* <div className="grid gap-3 p-2 pt-4 sm:grid-cols-3">
                {reasons.map((item) => (
                  <div key={item.title} className="rounded-[22px] bg-[#FBF8F5] p-4">
                    <p className="text-sm font-semibold text-[#2D2825]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6E645E]">{item.text}</p>
                  </div>
                ))}
              </div> */}
            </Card>
          </div>
        </div>
      </section>

      <section id="tratamentos" className={cx(LAYOUT.container, LAYOUT.section, "scroll-mt-24 sm:scroll-mt-28")}>
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <SectionHeader
            overline="Tratamentos"
            title="Cuidado completo para saúde, função e estética do sorriso"
            description="As especialidades são organizadas para facilitar sua escolha e mostrar, com clareza, como a clínica pode cuidar do que você precisa neste momento."
          />

          <Card className="p-4 sm:p-6">
            <p className="text-[11px] font-medium text-[#8B7C72] sm:hidden">Toque para trocar a especialidade</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-0 sm:flex sm:flex-wrap sm:gap-2.5">
              {treatments.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === selectedTreatment.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTreatment(item.id)}
                    className={cx(
                      "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[13px] font-medium transition sm:w-auto sm:rounded-full sm:px-4 sm:py-2.5 sm:text-sm",
                      isActive
                        ? "border-[#BAA391] bg-[#EDE2D9] text-[#5A4A40] shadow-[0_16px_34px_rgba(126,98,79,0.10)]"
                        : "border-[#E6D9D0] bg-[#FCFAF8] text-[#5D524B] hover:bg-white",
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-5 rounded-[22px] bg-[#FBF8F5] p-4 sm:mt-6 sm:gap-6 sm:rounded-[24px] sm:p-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B7C72]">{selectedTreatment.label}</p>
                <h3 className="mt-2 text-[1.65rem] leading-[1.1] text-[#2D2825] sm:mt-3 sm:text-[30px]">{selectedTreatment.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6B615B] sm:mt-4 sm:text-base">{selectedTreatment.text}</p>
                <ExternalAnchor
                  href={WHATSAPP_URL}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCCEC4] bg-white px-4 py-3 text-sm font-medium text-[#5B5049] transition hover:bg-[#F5F0EB] sm:mt-5 sm:w-auto sm:py-2.5"
                >
                  Solicitar avaliação
                  <ArrowRight className="h-4 w-4" />
                </ExternalAnchor>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {selectedTreatment.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-[#E8DDD4] bg-white px-3.5 py-3.5 text-[13px] font-medium leading-5 text-[#3D342F] sm:rounded-[20px] sm:px-4 sm:py-4 sm:text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="profissional" className={cx(LAYOUT.container, LAYOUT.section, "scroll-mt-24 sm:scroll-mt-28")}>
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative min-h-[360px] bg-[#EDE3DB]">
              <Image src="/dra-bruna.png" alt="Dra. Bruna" fill className="object-cover" />
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8B7C72] sm:text-xs">Profissional</p>
              <h2 className="mt-4 text-3xl leading-tight text-[#2D2825] sm:text-4xl">Atendimento próximo, cuidadoso e focado em transmitir confiança</h2>
              <p className="mt-5 text-sm leading-8 text-[#6A605A] sm:text-base">
                A BD Odontologia valoriza uma abordagem humana, clara e individualizada. Cada paciente é recebido com atenção às necessidades clínicas, aos objetivos do tratamento e à experiência durante o cuidado.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] bg-[#FBF8F5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B7C72]">Formação</p>
                  <p className="mt-2 text-sm leading-6 text-[#5F544E]">Especialista em Próteses, Facetas e Lentes de contato</p>
                </div>
                <div className="rounded-[22px] bg-[#FBF8F5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B7C72]">CRO-SP</p>
                  <p className="mt-2 text-sm leading-6 text-[#5F544E]">CRO-SP 134865</p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-[#E7DBD2] bg-white p-4 sm:p-5">
                <p className="text-sm leading-7 text-[#5B514B]">
                  Uma odontologia que une saúde, estética e planejamento com orientação clara em cada fase do tratamento.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="consultorio" className={cx(LAYOUT.container, LAYOUT.section, "scroll-mt-24 sm:scroll-mt-28")}>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            overline="Consultório"
            title="Um ambiente acolhedor, organizado e pensado para uma experiência tranquila"
            description="Como as fotos do consultório são em formato retrato, reorganizei a galeria para valorizar melhor cada imagem, sem corte ruim e com navegação mais elegante."
          />

          <Card className="overflow-hidden border-[#E5D7CC] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF6F1_100%)] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_112px] lg:items-stretch">
              <div className="relative overflow-hidden rounded-[24px] bg-[#EFE6DF]">
                <div className="relative mx-auto w-full max-w-[520px] aspect-[4/5] sm:max-w-[580px]">
                  <Image src={currentPhoto.src} alt={currentPhoto.title} fill className="object-cover" />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent p-4 text-white sm:p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/75">Consultório</p>
                    <p className="mt-1 text-lg font-medium">{currentPhoto.title}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/18 backdrop-blur transition hover:bg-white/28"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/18 backdrop-blur transition hover:bg-white/28"
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
                {officePhotos.map((photo, index) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    className={cx(
                      "group relative overflow-hidden rounded-[18px] border bg-[#F5EEE8] transition",
                      index === activePhoto
                        ? "border-[#BAA391] ring-2 ring-[#E8DDD4]"
                        : "border-[#E7DBD2] hover:border-[#D4C3B7]",
                    )}
                    aria-label={photo.title}
                  >
                    <div className="relative aspect-[3/4]">
                      <Image src={photo.src} alt={photo.title} fill className="object-cover transition duration-300 group-hover:scale-[1.03]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>


      {/* <section id="resultados" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-8">
          <SectionHeader
            overline="Resultados"
            title="Resultados que ajudam a visualizar a evolução do tratamento"
            description=""
          />

          <div className="grid gap-5 md:grid-cols-2">
            {beforeAfterCases.map((item) => (
              <Card key={item.title} className="overflow-hidden p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#2D2825]">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[#6A605A]">{item.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-[#F3EAE3] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B7C72]">
                    Caso
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[#E8DDD4] bg-[#FBF8F5] p-3">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8B7C72]">
                      Antes
                    </div>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#EFE6DF]">
                      <Image src={item.before} alt={`Antes do tratamento - ${item.title}`} fill className="object-cover" />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#E8DDD4] bg-[#FBF8F5] p-3">
                    <div className="mb-3 inline-flex rounded-full bg-[#BAA391] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                      Depois
                    </div>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#EFE6DF]">
                      <Image src={item.after} alt={`Depois do tratamento - ${item.title}`} fill className="object-cover" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      <section className={cx(LAYOUT.container, LAYOUT.section)}>
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeader
            overline="Como funciona"
            title="Um atendimento claro, organizado e pensado para transmitir segurança"
            description="A experiência é conduzida com atenção desde o primeiro contato, para que você entenda cada etapa e se sinta confortável ao longo do processo."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={step.title} className="border-[#E5D7CC] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF6F1_100%)] p-5 sm:p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2EAE4] text-sm font-semibold text-[#7A675B]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-xl text-[#2D2825]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6A605A]">{step.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contato"
        className={cx(LAYOUT.container, "scroll-mt-24 pb-16 pt-2 sm:scroll-mt-28 sm:pb-24")}
      >
        <Card className="overflow-hidden border-[#DCCDBF] bg-[linear-gradient(135deg,#BAA391_0%,#C7B3A4_100%)] text-[#2D2825]">
          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5F4E44] sm:text-xs">Contato</p>
              <h2 className="mt-4 text-3xl leading-tight text-[#2D2825] sm:text-4xl">Agende sua avaliação e converse com a clínica pelo WhatsApp</h2>
              <p className="mt-5 max-w-xl text-sm leading-8 text-[#3E3530]/80 sm:text-base">
                Tire dúvidas, conheça os tratamentos disponíveis e inicie seu atendimento de forma prática, com orientação clara desde o primeiro contato.
              </p>

              <div className="mt-8 space-y-3 text-sm text-[#3E3530]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#6F5C50]" />
                  <span>{ADDRESS}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-4 w-4 shrink-0 text-[#6F5C50]" />
                  <span>{PHONE_LABEL}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Instagram className="mt-1 h-4 w-4 shrink-0 text-[#6F5C50]" />
                  <span>@drabrunadamaro</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ExternalAnchor
                  href={WHATSAPP_URL}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#6E5B50] transition hover:bg-[#F6F0EB]"
                >
                  Chamar no WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </ExternalAnchor>
                <ExternalAnchor
                  href={INSTAGRAM_URL}
                  className="inline-flex items-center justify-center rounded-full border border-[#8F7768] px-6 py-3 text-sm font-medium text-[#3E3530] transition hover:bg-[#C8B4A5]/35"
                >
                  Ver Instagram
                </ExternalAnchor>
              </div>
            </div>

            <div className="bg-[#C9B5A7] p-5 sm:p-6 lg:p-8">
              <div className="rounded-[24px] bg-white p-5 text-[#2D2825] sm:p-6">
                <h3 className="text-2xl leading-tight">Dúvidas frequentes</h3>
                <div className="mt-5 space-y-3">
                  {faqs.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div key={item.q} className="rounded-[20px] border border-[#E8DDD4] bg-[#FCFAF8] px-4 py-3.5">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 text-left"
                          onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                        >
                          <span className="text-sm font-medium text-[#2D2825] sm:text-[15px]">{item.q}</span>
                          <ChevronDown className={cx("h-4 w-4 shrink-0 text-[#8E7C71] transition", isOpen && "rotate-180")} />
                        </button>
                        {isOpen ? <p className="mt-3 pr-6 text-sm leading-7 text-[#6A605A]">{item.a}</p> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <div
        className="fixed inset-x-4 z-50 sm:hidden"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <ExternalAnchor
          href={WHATSAPP_URL}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#BAA391] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(126,98,79,0.26)] transition active:scale-[0.99]"
        >
          <Phone className="h-4 w-4" />
          Agendar no WhatsApp
        </ExternalAnchor>
      </div>

      <ExternalAnchor
        href={WHATSAPP_URL}
        className="fixed bottom-5 right-5 z-50 hidden items-center gap-2 rounded-full bg-[#BAA391] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(126,98,79,0.26)] transition hover:-translate-y-0.5 hover:bg-[#A28D7D] sm:inline-flex"
      >
        <Phone className="h-4 w-4" />
        WhatsApp
      </ExternalAnchor>
    </main>
  );
}
