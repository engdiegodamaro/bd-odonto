"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Filter,
  IdCard,
  LayoutGrid,
  Phone,
  Search,
  SlidersHorizontal,
  Table2,
  UserRound,
  X,
} from "lucide-react";

const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  accent: "#8D735F",
  accent2: "#BAA391",
  accentSoft: "rgba(186, 163, 145, 0.16)",
  accentStrong: "rgba(186, 163, 145, 0.34)",
  accentRing: "rgba(141, 115, 95, 0.18)",
  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#2B6B57",
} as const;

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

type Patient = {
  id: string;
  nome_completo: string;
  celular: string;
  cpf: string;
  exige_nf: boolean;
  observacoes: string | null;
  etapa_atual: StepKey | null;
  etapas: PatientSteps;
  created_at?: string;
  updated_at?: string;
};

type QuickFilter = "todos" | "concluidos" | "andamento" | "com_nf" | "sem_nf";
type ViewMode = "cards" | "table";
type SortMode = "recentes" | "nome" | "progresso";

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function maskCPF(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$$1.$$2")
    .replace(/(\d{3})(\d)/, "$$1.$$2")
    .replace(/(\d{3})(\d{1,2})$/, "$$1-$$2");
}

function maskPhone(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($$1) $$2").replace(/(\d{4})(\d)/, "$$1-$$2");
  }
  return d.replace(/(\d{2})(\d)/, "($$1) $$2").replace(/(\d{5})(\d)/, "$$1-$$2");
}

function normalizeSteps(input: any): PatientSteps {
  return {
    agendamento: Boolean(input?.agendamento),
    solicitacao_exames: Boolean(input?.solicitacao_exames),
    exames_realizados: Boolean(input?.exames_realizados),
    planejamento_apresentado: Boolean(input?.planejamento_apresentado),
    planejamento_aprovado: Boolean(input?.planejamento_aprovado),
    execucao_agendada: Boolean(input?.execucao_agendada),
    contrato_formalizado: Boolean(input?.contrato_formalizado),
    termo_conclusao: Boolean(input?.termo_conclusao),
    entrega_nf: Boolean(input?.entrega_nf),
    retornos_programados: Boolean(input?.retornos_programados),
  };
}

function getRelevantSteps(exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF);
}

function getCurrentStep(steps: PatientSteps, exigeNF: boolean) {
  let current: StepKey | null = null;
  for (const step of PATIENT_STEPS) {
    if (step.optional && !exigeNF) continue;
    if (steps[step.key]) current = step.key;
  }
  return current;
}

function getCurrentStepLabel(patient: Pick<Patient, "etapas" | "exige_nf" | "etapa_atual">) {
  const stepKey = patient.etapa_atual || getCurrentStep(patient.etapas, patient.exige_nf);
  return PATIENT_STEPS.find((step) => step.key === stepKey)?.label || "Cadastro inicial";
}

function getNextStepLabel(patient: Pick<Patient, "etapas" | "exige_nf">) {
  const next = PATIENT_STEPS.find((step) => {
    if (step.optional && !patient.exige_nf) return false;
    return !patient.etapas[step.key];
  });
  return next?.label || "Fluxo concluído";
}

function progressPercent(steps: PatientSteps, exigeNF: boolean) {
  const relevant = getRelevantSteps(exigeNF);
  const done = relevant.filter((step) => steps[step.key]).length;
  return relevant.length ? Math.round((done / relevant.length) * 100) : 0;
}

function isCompleted(patient: Pick<Patient, "etapas" | "exige_nf">) {
  return getRelevantSteps(patient.exige_nf).every((step) => patient.etapas[step.key]);
}

function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function formatDateTime(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function Pill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center h-8 px-3 text-[11px] font-medium border rounded-xl transition-all hover:-translate-y-[1px]"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? T.accentSoft : T.cardSoft,
        color: active ? T.accent : T.text2,
      }}
    >
      {children}
    </button>
  );
}

function StageChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-[11px] font-medium border"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? T.accentSoft : T.cardSoft,
        color: active ? T.accent : T.text2,
      }}
    >
      {label}
    </span>
  );
}

function LinearProgress({ value }: { value: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: T.accent2 }} />
      </div>
      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
        {value}%
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(17,24,39,0.08)" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={T.accent2}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: T.text }}>
        {value}%
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
  active = false,
  onClick,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border rounded-[20px] p-4 text-left transition-all hover:-translate-y-[2px]"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.11), rgba(255,255,255,1))" : T.card,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: T.text3 }}>
            {title}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: T.text }}>
            {value}
          </div>
          <div className="mt-1 text-xs" style={{ color: T.text3 }}>
            {hint}
          </div>
        </div>
        <div
          className="w-11 h-11 rounded-2xl border flex items-center justify-center"
          style={{ borderColor: active ? T.accentStrong : T.border, background: active ? T.accentSoft : T.cardSoft, color: T.accent }}
        >
          {icon}
        </div>
      </div>
    </button>
  );
}

function PatientCard({ patient, active, onClick }: { patient: Patient; active?: boolean; onClick?: () => void }) {
  const progress = progressPercent(patient.etapas, patient.exige_nf);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-[18px] border transition-all hover:-translate-y-[2px]"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.09), rgba(255,255,255,1))" : T.card,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0" style={{ borderColor: T.border, background: T.cardSoft }}>
            <UserRound className="w-5 h-5" style={{ color: T.accent }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
              {patient.nome_completo}
            </div>
            <div className="mt-1 text-xs truncate" style={{ color: T.text3 }}>
              {getCurrentStepLabel(patient)}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: T.text3 }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <StageChip label={patient.exige_nf ? "Com NF" : "Sem NF"} />
          <StageChip label={getNextStepLabel(patient)} active />
        </div>
        <ProgressRing value={progress} />
      </div>
    </button>
  );
}

function PatientDrawer({
  patient,
  open,
  onClose,
}: {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(11,18,32,0.28)] backdrop-blur-[2px]" onClick={onClose} />

      <aside
        className="fixed right-0 top-0 z-50 h-screen w-full max-w-[560px] border-l shadow-[-24px_0_60px_rgba(11,18,32,0.16)] flex flex-col"
        style={{ borderColor: T.border, background: T.bg }}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: T.border, background: T.card }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: T.text }}>
              Detalhes do paciente
            </div>
            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
              Visualização completa do fluxo e dados cadastrais.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-[1px]"
            style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
            aria-label="Fechar drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!patient ? (
            <div className="rounded-2xl border p-6 text-sm text-center" style={{ borderColor: T.border, background: T.cardSoft, color: T.text3 }}>
              Selecione um paciente para visualizar o detalhe.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0" style={{ borderColor: T.border, background: T.cardSoft }}>
                    <UserRound className="w-5 h-5" style={{ color: T.accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold truncate" style={{ color: T.text }}>
                      {patient.nome_completo}
                    </div>
                    <div className="mt-1 text-sm" style={{ color: T.text3 }}>
                      {getCurrentStepLabel(patient)}
                    </div>
                  </div>
                  <ProgressRing value={progressPercent(patient.etapas, patient.exige_nf)} />
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                  Contato
                </div>
                <div className="mt-3 space-y-2 text-sm" style={{ color: T.text2 }}>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {maskPhone(patient.celular)}
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4" /> {maskCPF(patient.cpf)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                  Status operacional
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StageChip label={patient.exige_nf ? "Com NF" : "Sem NF"} />
                  <StageChip label={getNextStepLabel(patient)} active />
                </div>
                <div className="mt-3 text-sm leading-6" style={{ color: T.text2 }}>
                  Cadastro em <strong>{formatDate(patient.created_at)}</strong>
                  <br />
                  Atualização em <strong>{formatDateTime(patient.updated_at || patient.created_at)}</strong>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                  Linha do tempo do fluxo
                </div>
                <div className="mt-4 space-y-2">
                  {getRelevantSteps(patient.exige_nf).map((step, idx) => {
                    const done = patient.etapas[step.key];
                    const isCurrent = !done && getNextStepLabel(patient) === step.label;

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            borderColor: done ? T.okBd : isCurrent ? T.accentStrong : T.border,
                            background: done ? T.okBg : isCurrent ? T.accentSoft : T.card,
                            color: done ? T.okTx : isCurrent ? T.accent : T.text3,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1 pb-2">
                          <div className="text-sm font-medium" style={{ color: T.text }}>
                            {step.label}
                          </div>
                          <div className="mt-0.5 text-xs" style={{ color: done ? T.okTx : isCurrent ? T.accent : T.text3 }}>
                            {done ? "Concluída" : isCurrent ? "Próxima etapa" : "Pendente"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                  Observações
                </div>
                <div className="mt-3 text-sm leading-6" style={{ color: T.text2 }}>
                  {patient.observacoes?.trim() || "Nenhuma observação cadastrada para este paciente."}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function VisualizacaoPacientesPage() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StepKey | "todos">("todos");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortMode, setSortMode] = useState<SortMode>("recentes");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function loadPatients() {
    setLoading(true);
    try {
      const res = await fetch("/api/pacientes", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar pacientes.");

      const items = Array.isArray(data?.items)
        ? data.items.map((row: any) => ({
            ...row,
            etapas: normalizeSteps(row.etapas),
          }))
        : [];

      setRows(items);
      if (items[0]?.id) setSelectedPatientId((prev) => prev ?? items[0].id);
    } catch {
      setRows([]);
      setSelectedPatientId(null);
      setDrawerOpen(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const matchesQuery = !query
        ? true
        : [row.nome_completo, row.cpf, row.celular]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));

      const current = getCurrentStep(row.etapas, row.exige_nf);
      const matchesStage = stageFilter === "todos" ? true : current === stageFilter;

      const matchesQuick =
        quickFilter === "todos"
          ? true
          : quickFilter === "concluidos"
            ? isCompleted(row)
            : quickFilter === "andamento"
              ? !isCompleted(row)
              : quickFilter === "com_nf"
                ? row.exige_nf
                : !row.exige_nf;

      return matchesQuery && matchesStage && matchesQuick;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "nome") return a.nome_completo.localeCompare(b.nome_completo);
      if (sortMode === "progresso") return progressPercent(b.etapas, b.exige_nf) - progressPercent(a.etapas, a.exige_nf);
      const da = new Date(a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [rows, query, stageFilter, quickFilter, sortMode]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedPatientId(null);
      setDrawerOpen(false);
      return;
    }

    if (!selectedPatientId || !filteredRows.some((row) => row.id === selectedPatientId)) {
      setSelectedPatientId(filteredRows[0].id);
    }
  }, [filteredRows, selectedPatientId]);

  const selectedPatient = useMemo(
    () => filteredRows.find((row) => row.id === selectedPatientId) || null,
    [filteredRows, selectedPatientId]
  );

  const totals = useMemo(() => {
    const total = filteredRows.length;
    const completed = filteredRows.filter((r) => isCompleted(r)).length;
    const withNF = filteredRows.filter((r) => r.exige_nf).length;
    const avgProgress = total
      ? Math.round(filteredRows.reduce((acc, row) => acc + progressPercent(row.etapas, row.exige_nf), 0) / total)
      : 0;
    return { total, completed, withNF, inProgress: total - completed, avgProgress };
  }, [filteredRows]);

  const stageDistribution = useMemo(() => {
    return PATIENT_STEPS.map((step) => ({
      key: step.key,
      label: step.label,
      total: filteredRows.filter((row) => getCurrentStep(row.etapas, row.exige_nf) === step.key).length,
    })).sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const boardByStage = useMemo(() => {
    return PATIENT_STEPS.map((step) => ({
      ...step,
      total: filteredRows.filter((row) => getCurrentStep(row.etapas, row.exige_nf) === step.key).length,
      items: filteredRows.filter((row) => getCurrentStep(row.etapas, row.exige_nf) === step.key).slice(0, 4),
    }));
  }, [filteredRows]);

  const hasFilters = query || stageFilter !== "todos" || quickFilter !== "todos" || sortMode !== "recentes";

  const handleOpenPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDrawerOpen(true);
  };

  return (
    <>
      <section className="w-full min-w-0" style={{ background: T.bg, color: T.text }}>
        <div className="mx-auto w-full max-w-[1540px] px-4 sm:px-6 py-6">
          <div className="border bg-white rounded-[20px] p-4 sm:p-5 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold tracking-tight">Dashboard de pacientes</div>
                <div className="mt-1 text-xs max-w-3xl" style={{ color: T.text3 }}>
                  Versão mais interativa com filtros rápidos, cards clicáveis, pipeline visual e drawer lateral para detalhes do paciente.
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill active>Visão interativa</Pill>
                  <Pill>{loading ? "Atualizando dados…" : `${filteredRows.length} registro(s)`}</Pill>
                  <Pill>Média: {totals.avgProgress}%</Pill>
                  {hasFilters ? (
                    <Pill
                      onClick={() => {
                        setQuery("");
                        setStageFilter("todos");
                        setQuickFilter("todos");
                        setSortMode("recentes");
                      }}
                    >
                      Limpar filtros
                    </Pill>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all border"
                  onClick={() => setViewMode("cards")}
                  style={{
                    borderColor: viewMode === "cards" ? T.accentStrong : T.border,
                    background: viewMode === "cards" ? T.accentSoft : T.card,
                    color: viewMode === "cards" ? T.accent : T.text2,
                  }}
                >
                  <LayoutGrid className="w-4 h-4" /> Cards
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all border"
                  onClick={() => setViewMode("table")}
                  style={{
                    borderColor: viewMode === "table" ? T.accentStrong : T.border,
                    background: viewMode === "table" ? T.accentSoft : T.card,
                    color: viewMode === "table" ? T.accent : T.text2,
                  }}
                >
                  <Table2 className="w-4 h-4" /> Tabela
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_220px_220px] gap-3">
              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Buscar por nome, CPF ou celular
                </label>
                <div className="relative mt-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-3 border bg-white text-sm outline-none transition rounded-xl"
                    style={{ borderColor: T.border }}
                    placeholder="Pesquisar paciente"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Filtrar por etapa atual
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as StepKey | "todos")}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="todos">Todas as etapas</option>
                  {PATIENT_STEPS.map((step) => (
                    <option key={step.key} value={step.key}>
                      {step.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Visão rápida
                </label>
                <select
                  value={quickFilter}
                  onChange={(e) => setQuickFilter(e.target.value as QuickFilter)}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="todos">Todos</option>
                  <option value="concluidos">Concluídos</option>
                  <option value="andamento">Em andamento</option>
                  <option value="com_nf">Com NF</option>
                  <option value="sem_nf">Sem NF</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Ordenação
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="nome">Nome</option>
                  <option value="progresso">Maior progresso</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Pacientes"
              value={loading ? "—" : totals.total}
              hint="Total da base filtrada"
              icon={<UserRound className="w-5 h-5" />}
              active={quickFilter === "todos"}
              onClick={() => setQuickFilter("todos")}
            />
            <StatCard
              title="Concluídos"
              value={loading ? "—" : totals.completed}
              hint="Clique para filtrar"
              icon={<CheckCircle2 className="w-5 h-5" />}
              active={quickFilter === "concluidos"}
              onClick={() => setQuickFilter("concluidos")}
            />
            <StatCard
              title="Em andamento"
              value={loading ? "—" : totals.inProgress}
              hint="Clique para filtrar"
              icon={<Activity className="w-5 h-5" />}
              active={quickFilter === "andamento"}
              onClick={() => setQuickFilter("andamento")}
            />
            <StatCard
              title="Com NF"
              value={loading ? "—" : totals.withNF}
              hint="Clique para filtrar"
              icon={<FileCheck2 className="w-5 h-5" />}
              active={quickFilter === "com_nf"}
              onClick={() => setQuickFilter("com_nf")}
            />
          </div>

          <div className="mt-4 space-y-4">
            <div className="border bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Mapa do funil por etapa</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Clique em qualquer etapa para filtrar automaticamente a lista.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <Filter className="w-4 h-4" /> filtro por clique
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {stageDistribution.map((item) => {
                  const pct = totals.total > 0 ? Math.round((item.total / totals.total) * 100) : 0;
                  const active = stageFilter === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setStageFilter(active ? "todos" : item.key)}
                      className="p-4 rounded-[18px] border text-left transition-all hover:-translate-y-[2px]"
                      style={{
                        borderColor: active ? T.accentStrong : T.border,
                        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.10), rgba(255,255,255,1))" : T.cardSoft,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                            {item.total} paciente(s)
                          </div>
                        </div>
                        <div className="text-xl font-semibold" style={{ color: T.accent }}>
                          {pct}%
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: T.accent2 }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Pipeline visual</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Estrutura estilo kanban para leitura mais viva do fluxo.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill active={quickFilter === "todos"} onClick={() => setQuickFilter("todos")}>
                    Todos
                  </Pill>
                  <Pill active={quickFilter === "andamento"} onClick={() => setQuickFilter("andamento")}>
                    Em andamento
                  </Pill>
                  <Pill active={quickFilter === "concluidos"} onClick={() => setQuickFilter("concluidos")}>
                    Concluídos
                  </Pill>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="flex gap-3 min-w-max pb-1">
                  {boardByStage.map((column) => (
                    <div key={column.key} className="w-[280px] shrink-0 rounded-[18px] border p-3" style={{ borderColor: T.border, background: T.cardSoft }}>
                      <button type="button" onClick={() => setStageFilter(stageFilter === column.key ? "todos" : column.key)} className="w-full text-left">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{column.label}</div>
                          <div
                            className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl border text-xs font-semibold"
                            style={{ borderColor: T.border, background: T.card, color: T.accent }}
                          >
                            {column.total}
                          </div>
                        </div>
                      </button>
                      <div className="mt-3 space-y-2">
                        {column.items.length === 0 ? (
                          <div className="rounded-2xl border p-3 text-xs" style={{ borderColor: T.border, background: T.card, color: T.text3 }}>
                            Sem pacientes nesta etapa.
                          </div>
                        ) : (
                          column.items.map((patient) => {
                            const progress = progressPercent(patient.etapas, patient.exige_nf);

                            return (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => handleOpenPatient(patient.id)}
                                className="w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-[1px]"
                                style={{
                                  borderColor: selectedPatientId === patient.id && drawerOpen ? T.accentStrong : T.border,
                                  background: T.card,
                                }}
                              >
                                <div className="text-sm font-medium truncate">{patient.nome_completo}</div>
                                <div className="mt-1 text-xs truncate" style={{ color: T.text3 }}>
                                  Próxima: {getNextStepLabel(patient)}
                                </div>
                                <div className="mt-2">
                                  <LinearProgress value={progress} />
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Base filtrada</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Clique em um paciente para abrir o drawer lateral com os detalhes.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <SlidersHorizontal className="w-4 h-4" /> {viewMode === "cards" ? "Visualização em cards" : "Visualização em tabela"}
                </div>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="text-sm" style={{ color: T.text3 }}>
                    Carregando pacientes…
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="rounded-[18px] border p-8 text-center text-sm" style={{ borderColor: T.border, color: T.text3, background: T.cardSoft }}>
                    Nenhum paciente encontrado para os filtros aplicados.
                  </div>
                ) : viewMode === "cards" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredRows.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        active={selectedPatientId === patient.id && drawerOpen}
                        onClick={() => handleOpenPatient(patient.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: T.border }}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px] border-separate border-spacing-0">
                        <thead>
                          <tr style={{ background: T.cardSoft }}>
                            {["Paciente", "Contato", "Etapa atual", "Próxima etapa", "Progresso", "Atualização"].map((h) => (
                              <th
                                key={h}
                                className="text-left text-[11px] font-semibold uppercase tracking-[0.04em] px-4 py-3 border-b"
                                style={{ color: T.text3, borderColor: T.border }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((row) => {
                            const progress = progressPercent(row.etapas, row.exige_nf);

                            return (
                              <tr
                                key={row.id}
                                onClick={() => handleOpenPatient(row.id)}
                                className="cursor-pointer transition-colors"
                                style={{ background: selectedPatientId === row.id && drawerOpen ? "rgba(186,163,145,0.08)" : T.card }}
                              >
                                <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: T.border, background: T.cardSoft }}>
                                      <UserRound className="w-4 h-4" style={{ color: T.accent }} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium truncate">{row.nome_completo}</div>
                                      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                        {row.exige_nf ? "NF aplicável" : "Sem NF"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                  <div className="space-y-1">
                                    <div className="text-sm flex items-center gap-2" style={{ color: T.text2 }}>
                                      <Phone className="w-3.5 h-3.5" /> {maskPhone(row.celular)}
                                    </div>
                                    <div className="text-sm flex items-center gap-2" style={{ color: T.text2 }}>
                                      <IdCard className="w-3.5 h-3.5" /> {maskCPF(row.cpf)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                  <StageChip label={getCurrentStepLabel(row)} />
                                </td>
                                <td className="px-4 py-3 border-b text-sm" style={{ borderColor: T.border, color: T.text2 }}>
                                  {getNextStepLabel(row)}
                                </td>
                                <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                  <LinearProgress value={progress} />
                                </td>
                                <td className="px-4 py-3 border-b text-sm" style={{ borderColor: T.border, color: T.text2 }}>
                                  {formatDateTime(row.updated_at || row.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          input:focus,
          textarea:focus,
          select:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px ${T.accentRing} !important;
          }
        `}</style>
      </section>

      <PatientDrawer patient={selectedPatient} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
