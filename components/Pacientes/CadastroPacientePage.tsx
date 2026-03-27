"use client";
import Image from "next/image";
import React, { useMemo, useState, type ReactNode } from "react";
import { UserRound, FileCheck2, Phone, IdCard } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS
========================================================= */
const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  borderStrong: "rgba(17, 24, 39, 0.18)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  mutedBg: "rgba(190, 142, 87, 0.17)",

  accent: "#baa391",
  accent2: "#baa391",
  accentSoft: "rgba(190, 142, 87, 0.17)",
  accentRing: "rgba(190, 142, 87, 0.17)",

  okBg: "rgba(186, 163, 145, 0.16)",
  okBd: "rgba(186, 163, 145, 0.34)",
  okTx: "#6F5A4D",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#7F1D1D",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",

  header: "border bg-white",
  section: "border bg-white",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",
  help: "text-[11px]",

  input:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
  textarea:
    "w-full min-h-[110px] px-3 py-2 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
} as const;

/* =========================================================
   CONSTANTS
========================================================= */
const PATIENT_STEPS = [
  { key: "agendamento", label: "Agendamento", optional: false },
  { key: "solicitacao_exames", label: "Solicitação de exames", optional: false },
  { key: "exames_realizados", label: "Exames realizados", optional: false },
  { key: "planejamento_apresentado", label: "Planejamento apresentado", optional: false },
  { key: "planejamento_aprovado", label: "Planejamento aprovado", optional: false },
  { key: "execucao_agendada", label: "Agendamento da execução", optional: false },
  { key: "contrato_formalizado", label: "Contrato formalizado", optional: false },
  { key: "termo_conclusao", label: "Termo de conclusão", optional: false },
  { key: "entrega_nf", label: "Entrega de NF", optional: true },
  { key: "retornos_programados", label: "Retornos programados", optional: false },
] as const;

type StepKey = (typeof PATIENT_STEPS)[number]["key"];
type PatientSteps = Record<StepKey, boolean>;

/* =========================================================
   UI PRIMITIVES
========================================================= */
function Btn({
  tone = "primary",
  loading,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-md " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const styles =
    tone === "primary" ? "text-white" : tone === "danger" ? "text-white" : "bg-white";

  return (
    <button
      className={cx(base, styles, className)}
      disabled={disabled || loading}
      style={
        tone === "primary"
          ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)" }
          : tone === "danger"
            ? { background: "#DC2626", borderColor: "rgba(220, 38, 38, 0.55)" }
            : { background: T.card, borderColor: T.border, color: T.text }
      }
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Salvando…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md"
      style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
    >
      {children}
    </span>
  );
}

function MsgBox({ m }: { m: { type: "ok" | "err"; text: string } | null }) {
  if (!m) return null;

  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : { background: T.errBg, borderColor: T.errBd, color: T.errTx };

  return (
    <div className="text-sm px-3 py-2 border rounded-md" style={s}>
      {m.text}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */
function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function maskCPF(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function emptySteps(): PatientSteps {
  return {
    agendamento: true,
    solicitacao_exames: false,
    exames_realizados: false,
    planejamento_apresentado: false,
    planejamento_aprovado: false,
    execucao_agendada: false,
    contrato_formalizado: false,
    termo_conclusao: false,
    entrega_nf: false,
    retornos_programados: false,
  };
}

function getCurrentStep(steps: PatientSteps, exigeNF: boolean) {
  let current: StepKey | null = null;
  for (const step of PATIENT_STEPS) {
    if (step.optional && !exigeNF) continue;
    if (steps[step.key]) current = step.key;
  }
  return current;
}

function progressPercent(steps: PatientSteps, exigeNF: boolean) {
  const relevant = PATIENT_STEPS.filter((step) => !step.optional || exigeNF);
  const done = relevant.filter((step) => steps[step.key]).length;
  return relevant.length ? Math.round((done / relevant.length) * 100) : 0;
}

/* =========================================================
   PAGE
========================================================= */
export function CadastroPacientePage() {
  return <CadastroPaciente />;
}

function CadastroPaciente() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState(() => ({
    nome_completo: "",
    celular: "",
    cpf: "",
    exige_nf: false,
    observacoes: "",
    etapas: emptySteps(),
  }));

  const currentStep = useMemo(
    () => getCurrentStep(form.etapas, form.exige_nf),
    [form.etapas, form.exige_nf]
  );

  const currentStepLabel = useMemo(
    () => PATIENT_STEPS.find((step) => step.key === currentStep)?.label || "Cadastro inicial",
    [currentStep]
  );

  const progress = useMemo(
    () => progressPercent(form.etapas, form.exige_nf),
    [form.etapas, form.exige_nf]
  );

  const setField = (k: "nome_completo" | "celular" | "cpf" | "observacoes", v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const setStep = (key: StepKey, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      etapas: { ...prev.etapas, [key]: checked },
    }));
  };

  const validate = () => {
    if (!String(form.nome_completo || "").trim()) return "Informe o nome completo.";

    const cpf = digitsOnly(form.cpf);
    const celular = digitsOnly(form.celular);

    if (cpf.length > 0 && cpf.length !== 11) return "CPF inválido. Informe 11 dígitos.";
    if (celular.length > 0 && celular.length < 10) return "Celular inválido.";
    return null;
  };

  const resetForm = () => {
    setForm({
      nome_completo: "",
      celular: "",
      cpf: "",
      exige_nf: false,
      observacoes: "",
      etapas: emptySteps(),
    });
  };

  const submit = async () => {
    setMsg(null);
    const err = validate();
    if (err) return setMsg({ type: "err", text: err });

    setLoading(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: String(form.nome_completo || "").trim(),
          celular: digitsOnly(form.celular) || null,
          cpf: digitsOnly(form.cpf) || null,
          exige_nf: form.exige_nf,
          observacoes: String(form.observacoes || "").trim() || null,
          etapas: form.etapas,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setMsg({ type: "err", text: data?.error || "Erro ao cadastrar paciente." });
      }

      setMsg({ type: "ok", text: "Paciente salvo." });
      setTimeout(() => setMsg(null), 2500);
      resetForm();
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Erro inesperado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Cadastro de paciente
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Cadastre o paciente com <span style={{ color: T.text2, fontWeight: 600 }}>nome completo</span>
                {' '}(obrigatório), e preencha <span style={{ color: T.text2, fontWeight: 600 }}>celular</span>
                {' '}e <span style={{ color: T.text2, fontWeight: 600 }}>CPF</span> apenas se quiser. Depois,
                defina o avanço inicial no fluxo de atendimento.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Paciente: {form.nome_completo || "Não informado"}</Pill>
                <Pill>Etapa atual: {currentStepLabel}</Pill>
                <Pill>Progresso: {progress}%</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Pill>{loading ? "Salvando…" : "Pronto para cadastro"}</Pill>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Dados do paciente
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Informações principais para cadastro.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Nome completo
                  </label>
                  <div className="relative mt-1">
                    <input
                      value={form.nome_completo}
                      onChange={(e) => setField("nome_completo", e.target.value)}
                      className={cx(UI.input, "rounded-md pl-10")}
                      style={{ borderColor: T.border }}
                      placeholder="Digite o nome completo"
                    />
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
                  </div>
                </div>

                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Número de celular (opcional)
                  </label>
                  <div className="relative mt-1">
                    <input
                      value={form.celular}
                      onChange={(e) => setField("celular", maskPhone(e.target.value))}
                      className={cx(UI.input, "rounded-md pl-10")}
                      style={{ borderColor: T.border }}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
                  </div>
                </div>

                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    CPF (opcional)
                  </label>
                  <div className="relative mt-1">
                    <input
                      value={form.cpf}
                      onChange={(e) => setField("cpf", maskCPF(e.target.value))}
                      className={cx(UI.input, "rounded-md pl-10")}
                      style={{ borderColor: T.border }}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
                  </div>
                </div>

                <div className="p-3 border rounded-md" style={{ borderColor: T.border, background: T.mutedBg }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.exige_nf}
                      onChange={(e) => setForm((prev) => ({ ...prev, exige_nf: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-[11px] font-medium" style={{ color: T.text2 }}>
                        Exigir entrega de NF
                      </div>
                      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                        Ative esta opção quando a etapa de nota fiscal for aplicável ao paciente.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Acompanhamento inicial
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Marque as etapas já concluídas no momento do cadastro.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7">
                  <div className="grid gap-3">
                    {PATIENT_STEPS.map((step) => {
                      const disabled = step.optional && !form.exige_nf;
                      return (
                        <label
                          key={step.key}
                          className="flex items-start gap-3 p-3 border rounded-md"
                          style={{
                            borderColor: T.border,
                            background: disabled
                              ? "rgba(17,24,39,0.03)"
                              : form.etapas[step.key]
                                ? T.accentSoft
                                : T.cardSoft,
                            opacity: disabled ? 0.6 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={disabled ? false : form.etapas[step.key]}
                            disabled={disabled}
                            onChange={(e) => setStep(step.key, e.target.checked)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium" style={{ color: T.text }}>
                              {step.label}
                            </div>
                            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                              {step.optional
                                ? "Etapa opcional. Só entra no fluxo quando houver necessidade de NF."
                                : "Etapa padrão do fluxo do paciente."}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="p-4 border rounded-lg h-full" style={{ borderColor: T.border, background: T.cardSoft }}>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4" style={{ color: T.accent }} />
                      <div className="text-sm font-semibold" style={{ color: T.text }}>
                        Resumo do cadastro
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          Nome completo
                        </div>
                        <div className="text-sm mt-1" style={{ color: T.text2 }}>
                          {form.nome_completo || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          Celular
                        </div>
                        <div className="text-sm mt-1" style={{ color: T.text2 }}>
                          {form.celular || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          CPF (opcional)
                        </div>
                        <div className="text-sm mt-1" style={{ color: T.text2 }}>
                          {form.cpf || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          Etapa atual
                        </div>
                        <div className="text-sm mt-1 font-medium" style={{ color: T.accent }}>
                          {currentStepLabel}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          Progresso do fluxo
                        </div>
                        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: T.accent2 }}
                          />
                        </div>
                        <div className="text-xs mt-2" style={{ color: T.text2 }}>
                          {progress}% concluído
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-12">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Observações
                  </label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => setField("observacoes", e.target.value)}
                    className={cx(UI.textarea, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    placeholder="Observações do atendimento, informações complementares, pendências ou orientações..."
                  />
                </div>

                <div className="lg:col-span-12 flex items-center justify-end gap-3 flex-wrap mt-2">
                  <Btn tone="secondary" onClick={resetForm} disabled={loading}>
                    Limpar
                  </Btn>
                  <Btn tone="primary" onClick={submit} disabled={loading} loading={loading}>
                    Salvar paciente
                  </Btn>
                </div>

                <div className="lg:col-span-12">
                  <MsgBox m={msg} />
                </div>
              </div>

            </div>
            {/* <div className="bg-[#baa391] p-10 flex items-center justify-center rounded-b-lg">
              <Image
                src="/logo2.png"
                alt="BD Odontologia"
                width={140}
                height={140}
                priority
              />
            </div> */}
          </main>
        </div>
      </div>
      <div className="bg-[#baa391] p-3 gap-4 flex items-center justify-center rounded-b-lg">
        <Image
          src="/logo2.png"
          alt="BD Odontologia"
          width={50}
          height={50}
          priority
        />
      </div>

      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }
      `}</style>
    </section>
  );
}
