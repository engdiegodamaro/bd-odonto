"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Filter,
  IdCard,
  LayoutGrid,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

const T = {
  bg: "#F4F6F8",
  bgGlow: "radial-gradient(circle at top left, rgba(186, 163, 145, 0.12), transparent 34%)",
  bgGlow2: "radial-gradient(circle at bottom right, rgba(141, 115, 95, 0.08), transparent 28%)",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  cardSoft2: "#F7F8FA",
  cardSoft3: "#F2F4F7",
  border: "rgba(17, 24, 39, 0.12)",
  borderStrong: "rgba(17, 24, 39, 0.18)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.72)",
  text3: "rgba(11, 18, 32, 0.55)",
  accent: "#8D735F",
  accent2: "#BAA391",
  accent3: "#D6C4B6",
  accentSoft: "rgba(186, 163, 145, 0.14)",
  accentStrong: "rgba(186, 163, 145, 0.34)",
  accentRing: "rgba(141, 115, 95, 0.18)",
  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.28)",
  okTx: "#2B6B57",
  warnBg: "rgba(245, 158, 11, 0.12)",
  warnBd: "rgba(245, 158, 11, 0.26)",
  warnTx: "#8A5A0A",
  dangerBg: "rgba(239, 68, 68, 0.10)",
  dangerBd: "rgba(239, 68, 68, 0.22)",
  dangerTx: "#A33636",
  shadow: "0 14px 38px rgba(11,18,32,0.06)",
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

type QuickFilter = "todos" | "concluidos" | "andamento" | "com_nf" | "sem_nf" | "risco" | "parados";
type ViewMode = "cards" | "table";
type SortMode = "recentes" | "nome" | "progresso" | "parados";
type ProgressBandKey = "todos" | "0_25" | "26_50" | "51_75" | "76_99" | "100";

type ProgressBand = {
  key: Exclude<ProgressBandKey, "todos">;
  label: string;
  min: number;
  max: number;
};

const PROGRESS_BANDS: ProgressBand[] = [
  { key: "0_25", label: "0–25%", min: 0, max: 25 },
  { key: "26_50", label: "26–50%", min: 26, max: 50 },
  { key: "51_75", label: "51–75%", min: 51, max: 75 },
  { key: "76_99", label: "76–99%", min: 76, max: 99 },
  { key: "100", label: "100%", min: 100, max: 100 },
];

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function maskCPF(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  if (!d) return "—";
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  if (!d) return "—";
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function normalizeSteps(input: Partial<PatientSteps> | undefined | null): PatientSteps {
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

function getCompletedStepsCount(steps: PatientSteps, exigeNF: boolean) {
  return getRelevantSteps(exigeNF).filter((step) => steps[step.key]).length;
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

function getNextStep(patient: Pick<Patient, "etapas" | "exige_nf">) {
  return PATIENT_STEPS.find((step) => {
    if (step.optional && !patient.exige_nf) return false;
    return !patient.etapas[step.key];
  });
}

function getNextStepLabel(patient: Pick<Patient, "etapas" | "exige_nf">) {
  return getNextStep(patient)?.label || "Fluxo concluído";
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

function getInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "--";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getDaysSince(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getLastTouchDays(patient: Pick<Patient, "created_at" | "updated_at">) {
  return getDaysSince(patient.updated_at || patient.created_at);
}

function getPatientAgeDays(patient: Pick<Patient, "created_at">) {
  return getDaysSince(patient.created_at);
}

function getProgressBand(value: number): ProgressBand["key"] {
  if (value >= 100) return "100";
  if (value >= 76) return "76_99";
  if (value >= 51) return "51_75";
  if (value >= 26) return "26_50";
  return "0_25";
}

function getRiskLevel(patient: Pick<Patient, "etapas" | "exige_nf" | "created_at" | "updated_at">) {
  const progress = progressPercent(patient.etapas, patient.exige_nf);
  const staleDays = getLastTouchDays(patient) ?? 0;

  if (!isCompleted(patient) && (staleDays >= 15 || progress <= 25)) {
    return {
      label: "Risco alto",
      score: 3,
      bg: T.dangerBg,
      border: T.dangerBd,
      text: T.dangerTx,
    };
  }

  if (!isCompleted(patient) && (staleDays >= 7 || progress <= 50)) {
    return {
      label: "Risco moderado",
      score: 2,
      bg: T.warnBg,
      border: T.warnBd,
      text: T.warnTx,
    };
  }

  return {
    label: isCompleted(patient) ? "Concluído" : "Estável",
    score: isCompleted(patient) ? 0 : 1,
    bg: isCompleted(patient) ? T.okBg : T.accentSoft,
    border: isCompleted(patient) ? T.okBd : T.accentStrong,
    text: isCompleted(patient) ? T.okTx : T.accent,
  };
}

function getPatientStatusTone(patient: Pick<Patient, "etapas" | "exige_nf">) {
  if (isCompleted(patient)) {
    return {
      label: "Concluído",
      bg: T.okBg,
      border: T.okBd,
      text: T.okTx,
    };
  }

  const progress = progressPercent(patient.etapas, patient.exige_nf);

  if (progress >= 60) {
    return {
      label: "Avançado",
      bg: T.accentSoft,
      border: T.accentStrong,
      text: T.accent,
    };
  }

  return {
    label: "Em andamento",
    bg: T.warnBg,
    border: T.warnBd,
    text: T.warnTx,
  };
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

function StatusBadge({ patient }: { patient: Pick<Patient, "etapas" | "exige_nf"> }) {
  const tone = getPatientStatusTone(patient);

  return (
    <span
      className="inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold border"
      style={{
        background: tone.bg,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      {tone.label}
    </span>
  );
}

function RiskBadge({ patient }: { patient: Pick<Patient, "etapas" | "exige_nf" | "created_at" | "updated_at"> }) {
  const tone = getRiskLevel(patient);

  return (
    <span
      className="inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold border"
      style={{
        background: tone.bg,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      {tone.label}
    </span>
  );
}

function LinearProgress({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={compact ? "min-w-[92px]" : "min-w-[120px]"}>
      <div
        className={compact ? "h-2 rounded-full overflow-hidden" : "h-2.5 rounded-full overflow-hidden"}
        style={{ background: "rgba(17,24,39,0.08)" }}
      >
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: T.accent2 }} />
      </div>
      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
        {value}%
      </div>
    </div>
  );
}

function ProgressRing({ value, size = 64, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(17,24,39,0.08)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={T.accent2}
          strokeWidth={stroke}
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
      className="border rounded-2xl p-4 text-left transition-all hover:-translate-y-[2px]"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.11), rgba(255,255,255,1))" : T.card,
        boxShadow: active ? T.shadow : "none",
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

function MiniMetric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
      <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold" style={{ color: T.text }}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function InsightCard({ title, description, tone = "accent" }: { title: string; description: string; tone?: "accent" | "warn" | "danger" | "ok" }) {
  const palette = {
    accent: { bg: T.accentSoft, border: T.accentStrong, text: T.accent },
    warn: { bg: T.warnBg, border: T.warnBd, text: T.warnTx },
    danger: { bg: T.dangerBg, border: T.dangerBd, text: T.dangerTx },
    ok: { bg: T.okBg, border: T.okBd, text: T.okTx },
  }[tone];

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.bg }}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: palette.border, color: palette.text, background: T.card }}>
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: T.text }}>
            {title}
          </div>
          <div className="mt-1 text-sm leading-6" style={{ color: T.text2 }}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border p-8 text-center" style={{ borderColor: T.border, background: T.cardSoft }}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: T.border, background: T.card }}>
        <UserRound className="h-5 w-5" style={{ color: T.accent }} />
      </div>
      <div className="mt-4 text-sm font-semibold" style={{ color: T.text }}>
        {title}
      </div>
      <div className="mt-1 text-sm" style={{ color: T.text3 }}>
        {description}
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border p-4 animate-pulse" style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl" style={{ background: T.cardSoft3 }} />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded" style={{ background: T.cardSoft3 }} />
                <div className="mt-2 h-3 w-28 rounded" style={{ background: T.cardSoft3 }} />
              </div>
            </div>
            <div className="h-4 w-4 rounded" style={{ background: T.cardSoft3 }} />
          </div>
          <div className="mt-4 h-3 w-full rounded" style={{ background: T.cardSoft3 }} />
          <div className="mt-3 h-3 w-24 rounded" style={{ background: T.cardSoft3 }} />
        </div>
      ))}
    </div>
  );
}

function PatientCard({ patient, active, onClick }: { patient: Patient; active?: boolean; onClick?: () => void }) {
  const progress = progressPercent(patient.etapas, patient.exige_nf);
  const completed = getCompletedStepsCount(patient.etapas, patient.exige_nf);
  const total = getRelevantSteps(patient.exige_nf).length;
  const staleDays = getLastTouchDays(patient);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border transition-all hover:-translate-y-[2px]"
      style={{
        borderColor: active ? T.accentStrong : T.border,
        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.09), rgba(255,255,255,1))" : T.card,
        boxShadow: active ? T.shadow : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 text-sm font-semibold"
            style={{ borderColor: active ? T.accentStrong : T.border, background: active ? T.accentSoft : T.cardSoft, color: T.accent }}
          >
            {getInitials(patient.nome_completo)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
              {patient.nome_completo}
            </div>
            <div className="mt-1 text-xs truncate" style={{ color: T.text3 }}>
              {getCurrentStepLabel(patient)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge patient={patient} />
              <RiskBadge patient={patient} />
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: active ? T.accent : T.text3 }} />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs" style={{ color: T.text3 }}>
            <span>Próxima etapa</span>
            <span>
              {completed}/{total}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium truncate" style={{ color: T.text2 }}>
            {getNextStepLabel(patient)}
          </div>
          <div className="mt-3">
            <LinearProgress value={progress} compact />
          </div>
        </div>
        <ProgressRing value={progress} size={58} stroke={5} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: T.border }}>
        <div className="text-xs" style={{ color: T.text3 }}>
          {patient.exige_nf ? "Com exigência de NF" : "Sem exigência de NF"}
        </div>
        <div className="text-xs font-medium" style={{ color: (staleDays ?? 0) >= 7 ? T.warnTx : T.text3 }}>
          {staleDays == null ? "Sem atualização" : `${staleDays} dia(s) sem atualização`}
        </div>
      </div>
    </button>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
      <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium" style={{ color: T.text2 }}>
        {icon}
        <span className="min-w-0 break-words">{value}</span>
      </div>
    </div>
  );
}

function PatientDrawer({
  patient,
  open,
  onClose,
  baseAvgProgress,
}: {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  baseAvgProgress: number;
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

  const progress = patient ? progressPercent(patient.etapas, patient.exige_nf) : 0;
  const completed = patient ? getCompletedStepsCount(patient.etapas, patient.exige_nf) : 0;
  const total = patient ? getRelevantSteps(patient.exige_nf).length : 0;
  const staleDays = patient ? getLastTouchDays(patient) : null;
  const ageDays = patient ? getPatientAgeDays(patient) : null;
  const aboveBase = patient ? progress - baseAvgProgress : 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(11,18,32,0.32)] backdrop-blur-[3px]" onClick={onClose} />

      <aside
        className="fixed right-0 top-0 z-50 h-screen w-full max-w-[640px] border-l shadow-[-24px_0_60px_rgba(11,18,32,0.16)] flex flex-col"
        style={{ borderColor: T.border, background: T.bg }}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="relative overflow-hidden border-b px-5 py-5"
          style={{
            borderColor: T.border,
            background: "linear-gradient(180deg, rgba(186,163,145,0.16), rgba(255,255,255,0.94))",
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: T.bgGlow2 }} />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl" style={{ background: "rgba(186,163,145,0.22)" }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-base font-semibold"
                style={{ borderColor: T.accentStrong, background: T.card, color: T.accent }}
              >
                {patient ? getInitials(patient.nome_completo) : <UserRound className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: T.text }}>
                  Detalhes do paciente
                </div>
                <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                  Leitura operacional, risco e andamento do fluxo.
                </div>
                {patient ? (
                  <>
                    <div className="mt-3 truncate text-lg font-semibold" style={{ color: T.text }}>
                      {patient.nome_completo}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge patient={patient} />
                      <RiskBadge patient={patient} />
                      <StageChip label={getCurrentStepLabel(patient)} active />
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all hover:-translate-y-[1px]"
              style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
              aria-label="Fechar drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {patient ? (
            <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniMetric label="Progresso" value={`${progress}%`} />
              <MiniMetric label="Etapas" value={`${completed}/${total}`} />
              <MiniMetric label="Sem atualização" value={staleDays == null ? "—" : `${staleDays}d`} />
              <MiniMetric label="Idade do caso" value={ageDays == null ? "—" : `${ageDays}d`} />
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!patient ? (
            <EmptyState title="Nenhum paciente selecionado" description="Selecione um paciente na lista para visualizar os detalhes." />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBlock label="Telefone" value={maskPhone(patient.celular)} icon={<Phone className="w-4 h-4" />} />
                <InfoBlock label="CPF" value={maskCPF(patient.cpf)} icon={<IdCard className="w-4 h-4" />} />
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                      Resumo analítico do caso
                    </div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                      Posicionamento do paciente na carteira
                    </div>
                  </div>
                  <ProgressRing value={progress} size={72} stroke={6} />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
                    <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
                      Próxima etapa
                    </div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                      {getNextStepLabel(patient)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
                    <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
                      Benchmark da carteira
                    </div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                      {aboveBase >= 0 ? `+${aboveBase}% acima da média` : `${aboveBase}% abaixo da média`}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
                    <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
                      NF
                    </div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                      {patient.exige_nf ? "Exige nota fiscal" : "Sem exigência de NF"}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
                    <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
                      Atualização
                    </div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                      {formatDateTime(patient.updated_at || patient.created_at)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft2 }}>
                  <div className="text-[11px] uppercase tracking-[0.04em] font-medium" style={{ color: T.text3 }}>
                    Leitura rápida
                  </div>
                  <div className="mt-2 text-sm leading-6" style={{ color: T.text2 }}>
                    {isCompleted(patient)
                      ? "Este paciente já concluiu o fluxo completo e está pronto para acompanhamento pós-entrega."
                      : staleDays != null && staleDays >= 15
                        ? `O caso pede atenção imediata: está há ${staleDays} dias sem atualização e ainda possui pendências em aberto.`
                        : staleDays != null && staleDays >= 7
                          ? `O fluxo segue ativo, mas já acumula ${staleDays} dias sem atualização. Vale priorizar a próxima atuação.`
                          : "O caso está com andamento relativamente saudável dentro da carteira filtrada."}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.card }}>
                <div className="text-[11px] uppercase font-medium tracking-[0.04em]" style={{ color: T.text3 }}>
                  Linha do tempo do fluxo
                </div>
                <div className="mt-4 space-y-3">
                  {getRelevantSteps(patient.exige_nf).map((step, idx) => {
                    const done = patient.etapas[step.key];
                    const isCurrent = !done && getNextStepLabel(patient) === step.label;

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-semibold"
                            style={{
                              borderColor: done ? T.okBd : isCurrent ? T.accentStrong : T.border,
                              background: done ? T.okBg : isCurrent ? T.accentSoft : T.card,
                              color: done ? T.okTx : isCurrent ? T.accent : T.text3,
                            }}
                          >
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                          </div>
                          {idx < getRelevantSteps(patient.exige_nf).length - 1 ? (
                            <div className="mt-1 h-8 w-px" style={{ background: done ? T.okBd : T.border }} />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-2 pt-0.5">
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
                <div className="mt-3 text-sm leading-6 whitespace-pre-wrap" style={{ color: T.text2 }}>
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
  const [progressFilter, setProgressFilter] = useState<ProgressBandKey>("todos");
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
        ? data.items.map((row: Partial<Patient> & { etapas?: Partial<PatientSteps> }) => ({
            ...row,
            id: String(row.id || ""),
            nome_completo: String(row.nome_completo || "Sem nome"),
            celular: String(row.celular || ""),
            cpf: String(row.cpf || ""),
            exige_nf: Boolean(row.exige_nf),
            observacoes: row.observacoes ?? null,
            etapa_atual: (row.etapa_atual as StepKey | null | undefined) ?? null,
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
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const matchesQuery = !normalizedQuery
        ? true
        : [row.nome_completo, row.cpf, row.celular]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const current = getCurrentStep(row.etapas, row.exige_nf);
      const matchesStage = stageFilter === "todos" ? true : current === stageFilter;
      const progress = progressPercent(row.etapas, row.exige_nf);
      const risk = getRiskLevel(row);
      const staleDays = getLastTouchDays(row) ?? 0;

      const matchesQuick =
        quickFilter === "todos"
          ? true
          : quickFilter === "concluidos"
            ? isCompleted(row)
            : quickFilter === "andamento"
              ? !isCompleted(row)
              : quickFilter === "com_nf"
                ? row.exige_nf
                : quickFilter === "sem_nf"
                  ? !row.exige_nf
                  : quickFilter === "risco"
                    ? risk.score >= 2
                    : staleDays >= 7;

      const matchesProgress =
        progressFilter === "todos"
          ? true
          : getProgressBand(progress) === progressFilter;

      return matchesQuery && matchesStage && matchesQuick && matchesProgress;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "nome") return a.nome_completo.localeCompare(b.nome_completo);
      if (sortMode === "progresso") return progressPercent(b.etapas, b.exige_nf) - progressPercent(a.etapas, a.exige_nf);
      if (sortMode === "parados") return (getLastTouchDays(b) ?? -1) - (getLastTouchDays(a) ?? -1);
      const da = new Date(a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [rows, query, stageFilter, quickFilter, progressFilter, sortMode]);

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
    const stale7 = filteredRows.filter((row) => (getLastTouchDays(row) ?? 0) >= 7 && !isCompleted(row)).length;
    const stale15 = filteredRows.filter((row) => (getLastTouchDays(row) ?? 0) >= 15 && !isCompleted(row)).length;
    const new30 = filteredRows.filter((row) => (getPatientAgeDays(row) ?? 99999) <= 30).length;
    const riskHigh = filteredRows.filter((row) => getRiskLevel(row).score >= 3).length;
    const riskModerate = filteredRows.filter((row) => getRiskLevel(row).score === 2).length;
    const avgAgeDays = total
      ? Math.round(
          filteredRows.reduce((acc, row) => acc + (getPatientAgeDays(row) ?? 0), 0) / total
        )
      : 0;

    return {
      total,
      completed,
      withNF,
      withoutNF: total - withNF,
      inProgress: total - completed,
      avgProgress,
      stale7,
      stale15,
      new30,
      riskHigh,
      riskModerate,
      avgAgeDays,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [filteredRows]);

  const stageDistribution = useMemo(() => {
    return PATIENT_STEPS.map((step) => ({
      key: step.key,
      label: step.label,
      total: filteredRows.filter((row) => getCurrentStep(row.etapas, row.exige_nf) === step.key).length,
    })).sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const boardByStage = useMemo(() => {
    return PATIENT_STEPS.map((step) => {
      const items = filteredRows.filter((row) => getCurrentStep(row.etapas, row.exige_nf) === step.key);
      return {
        ...step,
        total: items.length,
        items: items.slice(0, 4),
        remaining: Math.max(items.length - 4, 0),
      };
    });
  }, [filteredRows]);

  const progressDistribution = useMemo(() => {
    return PROGRESS_BANDS.map((band) => ({
      ...band,
      total: filteredRows.filter((row) => getProgressBand(progressPercent(row.etapas, row.exige_nf)) === band.key).length,
    }));
  }, [filteredRows]);

  const nextStepDemand = useMemo(() => {
    return PATIENT_STEPS.map((step) => ({
      key: step.key,
      label: step.label,
      total: filteredRows.filter((row) => !isCompleted(row) && getNextStep(row)?.key === step.key).length,
    }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredRows]);

  const patientsNeedingAttention = useMemo(() => {
    return [...filteredRows]
      .filter((row) => !isCompleted(row))
      .sort((a, b) => {
        const riskDelta = getRiskLevel(b).score - getRiskLevel(a).score;
        if (riskDelta !== 0) return riskDelta;
        return (getLastTouchDays(b) ?? -1) - (getLastTouchDays(a) ?? -1);
      })
      .slice(0, 5);
  }, [filteredRows]);

  const insights = useMemo(() => {
    const busiestStage = stageDistribution[0];
    const topNextStep = nextStepDemand[0];
    const highRiskPct = totals.total ? Math.round(((totals.riskHigh + totals.riskModerate) / totals.total) * 100) : 0;

    return [
      {
        title: "Leitura da carteira",
        description:
          totals.total === 0
            ? "Não há pacientes para analisar com os filtros atuais."
            : `${totals.completionRate}% da base filtrada já concluiu o fluxo. A média geral de avanço está em ${totals.avgProgress}%.`,
        tone: totals.completionRate >= 45 ? "ok" : "accent",
      },
      {
        title: "Maior gargalo",
        description:
          topNextStep && topNextStep.total > 0
            ? `${topNextStep.total} paciente(s) têm como próxima atuação “${topNextStep.label}”, indicando o principal ponto de pressão operacional agora.`
            : "Não há gargalo relevante identificado na próxima etapa com os filtros atuais.",
        tone: topNextStep && topNextStep.total > 0 ? "warn" : "ok",
      },
      {
        title: "Sinal de atenção",
        description:
          totals.stale7 > 0
            ? `${totals.stale7} paciente(s) estão há 7+ dias sem atualização. ${highRiskPct}% da carteira filtrada exige monitoramento mais próximo.`
            : "A carteira filtrada não apresenta pacientes parados por mais de 7 dias neste momento.",
        tone: totals.stale7 > 0 ? (totals.stale15 > 0 ? "danger" : "warn") : "ok",
      },
      {
        title: "Concentração no funil",
        description:
          busiestStage && busiestStage.total > 0
            ? `A etapa com maior concentração é “${busiestStage.label}”, reunindo ${busiestStage.total} paciente(s) da base atual.`
            : "Sem concentração relevante por etapa com os filtros ativos.",
        tone: busiestStage && busiestStage.total > 0 ? "accent" : "ok",
      },
    ] as const;
  }, [nextStepDemand, stageDistribution, totals]);

  const busiestStage = stageDistribution[0];
  const hasFilters = Boolean(query) || stageFilter !== "todos" || quickFilter !== "todos" || progressFilter !== "todos" || sortMode !== "recentes";

  const handleOpenPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDrawerOpen(true);
  };

  return (
    <>
      <section className="w-full min-w-0" style={{ background: T.bg, color: T.text }}>
        <div className="mx-auto w-full max-w-[1580px] px-4 sm:px-6 py-6">
          <div className="relative overflow-hidden border bg-white rounded-[28px] p-4 sm:p-5 shadow-[0_18px_50px_rgba(11,18,32,0.05)]" style={{ borderColor: T.border }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: T.bgGlow }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: T.bgGlow2 }} />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold tracking-tight">Dashboard de pacientes</div>
                <div className="mt-1 text-xs max-w-3xl" style={{ color: T.text3 }}>
                  Versão analítica com mais interação, leitura de gargalos, distribuição por progresso, lista de atenção e drawer com contexto operacional do paciente.
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill active>Visão analítica</Pill>
                  <Pill>{loading ? "Atualizando dados…" : `${filteredRows.length} registro(s)`}</Pill>
                  <Pill>Média: {totals.avgProgress}%</Pill>
                  {busiestStage ? <Pill>Maior etapa: {busiestStage.label}</Pill> : null}
                  {totals.stale7 > 0 ? <Pill>{totals.stale7} sem atualização 7d+</Pill> : null}
                  {hasFilters ? (
                    <Pill
                      onClick={() => {
                        setQuery("");
                        setStageFilter("todos");
                        setQuickFilter("todos");
                        setProgressFilter("todos");
                        setSortMode("recentes");
                      }}
                    >
                      Limpar filtros
                    </Pill>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-medium transition-all border"
                  onClick={loadPatients}
                  style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                >
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-medium transition-all border"
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
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-medium transition-all border"
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

            <div className="relative mt-5 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-3">
              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Buscar por nome, CPF ou celular
                </label>
                <div className="relative mt-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-11 border bg-white text-sm outline-none transition rounded-2xl"
                    style={{ borderColor: T.border }}
                    placeholder="Pesquisar paciente"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ color: T.text3 }}
                      aria-label="Limpar busca"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Etapa atual
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as StepKey | "todos")}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-2xl"
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
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-2xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="todos">Todos</option>
                  <option value="concluidos">Concluídos</option>
                  <option value="andamento">Em andamento</option>
                  <option value="com_nf">Com NF</option>
                  <option value="sem_nf">Sem NF</option>
                  <option value="risco">Em risco</option>
                  <option value="parados">Sem atualização 7d+</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Faixa de progresso
                </label>
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value as ProgressBandKey)}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-2xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="todos">Todas as faixas</option>
                  {PROGRESS_BANDS.map((band) => (
                    <option key={band.key} value={band.key}>
                      {band.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium" style={{ color: T.text2 }}>
                  Ordenação
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="mt-1 w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-2xl"
                  style={{ borderColor: T.border }}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="nome">Nome</option>
                  <option value="progresso">Maior progresso</option>
                  <option value="parados">Mais tempo sem atualização</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <StatCard
              title="Pacientes"
              value={loading ? "—" : totals.total}
              hint="Total da base filtrada"
              icon={<UserRound className="w-5 h-5" />}
              active={quickFilter === "todos"}
              onClick={() => setQuickFilter("todos")}
            />
            <StatCard
              title="Conclusão"
              value={loading ? "—" : `${totals.completionRate}%`}
              hint={`${totals.completed} concluído(s)`}
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
              title="Em risco"
              value={loading ? "—" : totals.riskHigh + totals.riskModerate}
              hint={`${totals.riskHigh} alto / ${totals.riskModerate} moderado`}
              icon={<AlertCircle className="w-5 h-5" />}
              active={quickFilter === "risco"}
              onClick={() => setQuickFilter("risco")}
            />
            <StatCard
              title="Parados 7d+"
              value={loading ? "—" : totals.stale7}
              hint={`${totals.stale15} com 15d+`}
              icon={<Clock3 className="w-5 h-5" />}
              active={quickFilter === "parados"}
              onClick={() => setQuickFilter("parados")}
            />
            <StatCard
              title="Com NF"
              value={loading ? "—" : totals.withNF}
              hint={`Sem NF: ${totals.withoutNF}`}
              icon={<FileCheck2 className="w-5 h-5" />}
              active={quickFilter === "com_nf"}
              onClick={() => setQuickFilter("com_nf")}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.15fr_0.9fr_0.95fr] gap-4">
            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Leituras e insights</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Resumo gerencial da base filtrada com foco em decisão rápida.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <Sparkles className="w-4 h-4" /> análise automática
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((item) => (
                  <InsightCard title={item.title} description={item.description} tone={item.tone} key={item.title} />
                ))}
              </div>
            </div>

            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Distribuição por progresso</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Clique em uma faixa para filtrar a lista.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <TrendingUp className="w-4 h-4" /> visão de maturidade
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {progressDistribution.map((band) => {
                  const pct = totals.total ? Math.round((band.total / totals.total) * 100) : 0;
                  const active = progressFilter === band.key;
                  return (
                    <button
                      key={band.key}
                      type="button"
                      onClick={() => setProgressFilter(active ? "todos" : band.key)}
                      className="w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-[1px]"
                      style={{
                        borderColor: active ? T.accentStrong : T.border,
                        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.10), rgba(255,255,255,1))" : T.cardSoft,
                        boxShadow: active ? T.shadow : "none",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{band.label}</div>
                          <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                            {band.total} paciente(s)
                          </div>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: T.accent }}>
                          {pct}%
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: T.accent2 }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Próximas etapas mais demandadas</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Onde a operação deve atuar primeiro.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <BarChart3 className="w-4 h-4" /> priorização
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {nextStepDemand.length === 0 ? (
                  <EmptyState title="Sem demandas pendentes" description="Não há próxima etapa em aberto com os filtros aplicados." />
                ) : (
                  nextStepDemand.map((item) => {
                    const pct = totals.inProgress ? Math.round((item.total / Math.max(totals.inProgress, 1)) * 100) : 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setStageFilter(item.key)}
                        className="w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-[1px]"
                        style={{ borderColor: T.border, background: T.cardSoft }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{item.label}</div>
                            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                              {item.total} paciente(s)
                            </div>
                          </div>
                          <div className="text-sm font-semibold" style={{ color: T.accent }}>
                            {pct}%
                          </div>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: T.accent2 }} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.3fr_0.85fr] gap-4">
            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
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
                      className="p-4 rounded-2xl border text-left transition-all hover:-translate-y-[2px]"
                      style={{
                        borderColor: active ? T.accentStrong : T.border,
                        background: active ? "linear-gradient(180deg, rgba(186,163,145,0.10), rgba(255,255,255,1))" : T.cardSoft,
                        boxShadow: active ? T.shadow : "none",
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
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: T.accent2 }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Resumo operacional</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Indicadores complementares da carteira filtrada.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <CalendarClock className="w-4 h-4" /> leitura executiva
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MiniMetric label="Casos novos 30d" value={totals.new30} hint="Criados nos últimos 30 dias" />
                <MiniMetric label="Idade média" value={`${totals.avgAgeDays}d`} hint="Tempo médio desde o cadastro" />
                <MiniMetric label="Média de avanço" value={`${totals.avgProgress}%`} hint="Progresso médio da carteira" />
                <MiniMetric label="Pressão de backlog" value={`${totals.stale7}`} hint="Casos sem atualização por 7+ dias" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
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
                  <Pill active={quickFilter === "risco"} onClick={() => setQuickFilter("risco")}>
                    Em risco
                  </Pill>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="flex gap-3 min-w-max pb-1">
                  {boardByStage.map((column) => (
                    <div key={column.key} className="w-[290px] shrink-0 rounded-2xl border p-3" style={{ borderColor: T.border, background: T.cardSoft }}>
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
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{patient.nome_completo}</div>
                                    <div className="mt-1 text-xs truncate" style={{ color: T.text3 }}>
                                      Próxima: {getNextStepLabel(patient)}
                                    </div>
                                  </div>
                                  <RiskBadge patient={patient} />
                                </div>
                                <div className="mt-2">
                                  <LinearProgress value={progress} compact />
                                </div>
                              </button>
                            );
                          })
                        )}
                        {column.remaining > 0 ? (
                          <div className="text-xs px-1" style={{ color: T.text3 }}>
                            +{column.remaining} paciente(s) nesta etapa
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold">Pacientes que exigem atenção</div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Casos priorizados por risco e tempo sem atualização.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                  <AlertCircle className="w-4 h-4" /> priorização
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {patientsNeedingAttention.length === 0 ? (
                  <EmptyState title="Nenhum caso crítico" description="Com os filtros atuais, não há pacientes pendentes para priorização imediata." />
                ) : (
                  patientsNeedingAttention.map((patient) => {
                    const progress = progressPercent(patient.etapas, patient.exige_nf);
                    const staleDays = getLastTouchDays(patient);
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleOpenPatient(patient.id)}
                        className="w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-[1px]"
                        style={{ borderColor: T.border, background: T.cardSoft }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{patient.nome_completo}</div>
                            <div className="mt-1 text-xs truncate" style={{ color: T.text3 }}>
                              {getCurrentStepLabel(patient)}
                            </div>
                          </div>
                          <RiskBadge patient={patient} />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <LinearProgress value={progress} compact />
                          <div className="text-xs text-right" style={{ color: (staleDays ?? 0) >= 7 ? T.warnTx : T.text3 }}>
                            {staleDays == null ? "—" : `${staleDays} dia(s)`}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(11,18,32,0.04)]" style={{ borderColor: T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Base filtrada</div>
                <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                  Clique em um paciente para abrir o drawer lateral com os detalhes, comparativos e leitura analítica do caso.
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: T.text3 }}>
                <SlidersHorizontal className="w-4 h-4" /> {viewMode === "cards" ? "Visualização em cards" : "Visualização em tabela"}
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <LoadingGrid />
              ) : filteredRows.length === 0 ? (
                <EmptyState title="Nenhum paciente encontrado" description="Ajuste os filtros para visualizar registros na base." />
              ) : viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredRows.map((patient) => (
                    <PatientCard
                      patient={patient}
                      active={selectedPatientId === patient.id && drawerOpen}
                      onClick={() => handleOpenPatient(patient.id)}
                      key={patient.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] border-separate border-spacing-0">
                      <thead>
                        <tr style={{ background: T.cardSoft }}>
                          {[
                            "Paciente",
                            "Contato",
                            "Etapa atual",
                            "Próxima etapa",
                            "Risco",
                            "Progresso",
                            "Sem atualização",
                            "Atualização",
                          ].map((h) => (
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
                          const staleDays = getLastTouchDays(row);

                          return (
                            <tr
                              key={row.id}
                              onClick={() => handleOpenPatient(row.id)}
                              className="cursor-pointer transition-colors"
                              style={{ background: selectedPatientId === row.id && drawerOpen ? "rgba(186,163,145,0.08)" : T.card }}
                            >
                              <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 text-xs font-semibold" style={{ borderColor: T.border, background: T.cardSoft, color: T.accent }}>
                                    {getInitials(row.nome_completo)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{row.nome_completo}</div>
                                    <div className="mt-1 text-xs flex flex-wrap gap-2" style={{ color: T.text3 }}>
                                      <span>{row.exige_nf ? "NF aplicável" : "Sem NF"}</span>
                                      <span>•</span>
                                      <span>{getCompletedStepsCount(row.etapas, row.exige_nf)}/{getRelevantSteps(row.exige_nf).length} etapas</span>
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
                                <RiskBadge patient={row} />
                              </td>
                              <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                                <LinearProgress value={progress} />
                              </td>
                              <td className="px-4 py-3 border-b text-sm" style={{ borderColor: T.border, color: (staleDays ?? 0) >= 7 ? T.warnTx : T.text2 }}>
                                {staleDays == null ? "—" : `${staleDays} dia(s)`}
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

        <style jsx global>{`
          input:focus,
          textarea:focus,
          select:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px ${T.accentRing} !important;
          }
        `}</style>
      </section>

      <PatientDrawer patient={selectedPatient} open={drawerOpen} onClose={() => setDrawerOpen(false)} baseAvgProgress={totals.avgProgress} />
    </>
  );
}

export default VisualizacaoPacientesPage;
