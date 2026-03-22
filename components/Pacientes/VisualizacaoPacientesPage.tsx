"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  ClipboardList,
  Clock3,
  Copy,
  Eraser,
  FileText,
  Filter,
  LayoutDashboard,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const T = {
  bg: "#F4F7FB",
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  cardMuted: "#F1F5F9",
  line: "rgba(15, 23, 42, 0.08)",
  lineStrong: "rgba(15, 23, 42, 0.14)",
  text: "#0F172A",
  text2: "rgba(15, 23, 42, 0.72)",
  text3: "rgba(15, 23, 42, 0.52)",
  green: "#166534",
  greenSoft: "rgba(34, 197, 94, 0.10)",
  blue: "#1D4ED8",
  blueSoft: "rgba(37, 99, 235, 0.10)",
  amber: "#B45309",
  amberSoft: "rgba(245, 158, 11, 0.14)",
  red: "#B91C1C",
  redSoft: "rgba(239, 68, 68, 0.10)",
  ok: "#047857",
  okSoft: "rgba(16, 185, 129, 0.12)",
  shadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
  shadowSoft: "0 8px 24px rgba(15, 23, 42, 0.05)",
} as const;

const PATIENT_STEPS = [
  { key: "agendamento", label: "Agendamento", optional: false },
  { key: "solicitacao_exames", label: "Solicitação de exames", optional: false },
  { key: "exames_realizados", label: "Exames realizados", optional: false },
  { key: "planejamento_apresentado", label: "Planejamento apresentado", optional: false },
  { key: "planejamento_aprovado", label: "Planejamento aprovado", optional: false },
  { key: "execucao_agendada", label: "Agendamento de execução", optional: false },
  { key: "contrato_formalizado", label: "Contrato formalizado", optional: false },
  { key: "termo_conclusao", label: "Termo de conclusão", optional: false },
  { key: "entrega_nf", label: "Entrega de NF", optional: true },
  { key: "retornos_programados", label: "Retornos programados", optional: false },
] as const;

type StepKey = (typeof PATIENT_STEPS)[number]["key"];
type PatientSteps = Record<StepKey, boolean>;

type PatientRow = {
  id: string;
  nome_completo: string;
  celular: string;
  cpf: string;
  exige_nf: boolean;
  etapas: PatientSteps;
  etapa_atual: StepKey | null;
  observacoes?: string | null;
  created_at?: string | null;
};

type ApiListResponse = {
  ok: boolean;
  items?: Array<Partial<PatientRow>>;
  error?: string;
};

const STEP_LABEL_BY_KEY = Object.fromEntries(PATIENT_STEPS.map((s) => [s.key, s.label])) as Record<StepKey, string>;

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function formatCPF(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCellphone(v: string) {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function brDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function brDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emptySteps(): PatientSteps {
  return PATIENT_STEPS.reduce((acc, step) => {
    acc[step.key] = false;
    return acc;
  }, {} as PatientSteps);
}

function deriveCurrentStep(steps: PatientSteps, exigeNF: boolean): StepKey | null {
  let current: StepKey | null = null;
  for (const step of PATIENT_STEPS) {
    if (step.optional && !exigeNF) continue;
    if (steps[step.key]) current = step.key;
  }
  return current;
}

function countCompletedSteps(steps: PatientSteps, exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF).filter((step) => steps[step.key]).length;
}

function totalRelevantSteps(exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF).length;
}

function progressPct(steps: PatientSteps, exigeNF: boolean) {
  const total = totalRelevantSteps(exigeNF);
  if (!total) return 0;
  return Math.round((countCompletedSteps(steps, exigeNF) / total) * 100);
}

function nextPendingStep(steps: PatientSteps, exigeNF: boolean) {
  return PATIENT_STEPS.find((step) => (!step.optional || exigeNF) && !steps[step.key]) ?? null;
}

function parseStepOrder(key: StepKey | null) {
  if (!key) return -1;
  return PATIENT_STEPS.findIndex((step) => step.key === key);
}

function patientMatches(row: PatientRow, q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const digits = digitsOnly(term);

  return (
    row.nome_completo.toLowerCase().includes(term) ||
    digitsOnly(row.celular).includes(digits) ||
    digitsOnly(row.cpf).includes(digits)
  );
}

function makePatient(data: Partial<PatientRow> & Pick<PatientRow, "id" | "nome_completo" | "celular" | "cpf">): PatientRow {
  const exige_nf = data.exige_nf ?? false;
  const etapas = {
    ...emptySteps(),
    ...(data.etapas ?? {}),
  } as PatientSteps;

  return {
    id: data.id,
    nome_completo: data.nome_completo,
    celular: formatCellphone(data.celular),
    cpf: formatCPF(data.cpf),
    exige_nf,
    etapas,
    etapa_atual: data.etapa_atual ?? deriveCurrentStep(etapas, exige_nf),
    observacoes: data.observacoes ?? "",
    created_at: data.created_at ?? null,
  };
}

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || "Erro inesperado.";
  } catch {
    return "Erro inesperado.";
  }
}

function getStatusMeta(row: PatientRow) {
  const pct = progressPct(row.etapas, row.exige_nf);
  const finished = pct === 100;

  if (finished) {
    return {
      key: "concluido" as const,
      label: "Concluído",
      caption: "Fluxo finalizado",
      color: T.ok,
      soft: T.okSoft,
      icon: CheckCircle2,
    };
  }

  if (pct >= 60) {
    return {
      key: "avancado" as const,
      label: "Avançado",
      caption: "Próximo do fechamento",
      color: T.blue,
      soft: T.blueSoft,
      icon: TrendingUp,
    };
  }

  return {
    key: "andamento" as const,
    label: "Em andamento",
    caption: "Requer acompanhamento",
    color: T.amber,
    soft: T.amberSoft,
    icon: Clock3,
  };
}

function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).catch(() => undefined);
  }
}

function ShellCard({ children, className, soft = false }: { children: React.ReactNode; className?: string; soft?: boolean }) {
  return (
    <div
      className={cx("rounded-[26px] border", className)}
      style={{
        borderColor: T.line,
        background: soft ? T.cardSoft : T.card,
        boxShadow: soft ? T.shadowSoft : T.shadow,
      }}
    >
      {children}
    </div>
  );
}

function Btn({
  children,
  tone = "primary",
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const palette =
    tone === "primary"
      ? { background: T.green, color: "#fff", borderColor: T.green }
      : tone === "ghost"
        ? { background: "transparent", color: T.text2, borderColor: "transparent" }
        : { background: T.card, color: T.text, borderColor: T.lineStrong };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      style={palette}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Atualizando...
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const palette =
    tone === "green"
      ? { background: T.greenSoft, color: T.green, borderColor: "rgba(34, 197, 94, 0.18)" }
      : tone === "blue"
        ? { background: T.blueSoft, color: T.blue, borderColor: "rgba(37, 99, 235, 0.18)" }
        : tone === "amber"
          ? { background: T.amberSoft, color: T.amber, borderColor: "rgba(245, 158, 11, 0.20)" }
          : tone === "red"
            ? { background: T.redSoft, color: T.red, borderColor: "rgba(239, 68, 68, 0.18)" }
            : { background: T.cardSoft, color: T.text2, borderColor: T.line };

  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={palette}>
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: T.cardMuted }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, #166534 0%, #22C55E 100%)",
        }}
      />
    </div>
  );
}

function RingProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative flex h-[138px] w-[138px] items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${T.green} 0% ${pct}%, ${T.cardMuted} ${pct}% 100%)` }}
    >
      <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full" style={{ background: T.card }}>
        <div className="text-[30px] font-semibold tracking-tight" style={{ color: T.text }}>{pct}%</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.text3 }}>
          progresso
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-[24px] border p-8 text-center" style={{ borderColor: T.line, background: T.cardSoft }}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: T.cardMuted }}>
        <UserRound className="h-6 w-6" style={{ color: T.text3 }} />
      </div>
      <div className="mt-4 text-sm font-semibold" style={{ color: T.text }}>{title}</div>
      <div className="mt-1 text-sm" style={{ color: T.text3 }}>{hint}</div>
    </div>
  );
}

function KPI({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "green" | "blue" | "amber";
}) {
  const palette =
    tone === "green"
      ? { soft: T.greenSoft, fg: T.green }
      : tone === "blue"
        ? { soft: T.blueSoft, fg: T.blue }
        : tone === "amber"
          ? { soft: T.amberSoft, fg: T.amber }
          : { soft: T.cardMuted, fg: T.text2 };

  return (
    <ShellCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>{title}</div>
          <div className="mt-3 text-[30px] font-semibold tracking-tight" style={{ color: T.text }}>{value}</div>
          <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>{hint}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: palette.soft, color: palette.fg }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </ShellCard>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none transition focus:ring-4"
      style={{ borderColor: T.lineStrong, color: T.text }}
    />
  );
}

function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none transition focus:ring-4"
      style={{ borderColor: T.lineStrong, color: T.text }}
    />
  );
}

function SegmentTabs({
  value,
  onChange,
  counts,
}: {
  value: "all" | "em_andamento" | "concluido";
  onChange: (v: "all" | "em_andamento" | "concluido") => void;
  counts: { all: number; em_andamento: number; concluido: number };
}) {
  const items: Array<{ key: "all" | "em_andamento" | "concluido"; label: string; count: number }> = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "em_andamento", label: "Em andamento", count: counts.em_andamento },
    { key: "concluido", label: "Concluídos", count: counts.concluido },
  ];

  return (
    <div className="inline-flex rounded-2xl border p-1" style={{ borderColor: T.line, background: T.cardSoft }}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
            style={{
              background: active ? T.card : "transparent",
              color: active ? T.text : T.text3,
              boxShadow: active ? "0 2px 8px rgba(15, 23, 42, 0.06)" : "none",
            }}
          >
            <span>{item.label}</span>
            <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: active ? T.cardSoft : "transparent" }}>
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StageDistribution({ rows }: { rows: PatientRow[] }) {
  const total = Math.max(rows.length, 1);

  return (
    <div className="space-y-3">
      {PATIENT_STEPS.map((step) => {
        const count = rows.filter((row) => row.etapa_atual === step.key).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={step.key}>
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium" style={{ color: T.text2 }}>{step.label}</span>
              <span className="font-semibold" style={{ color: T.text }}>{count}</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        );
      })}
    </div>
  );
}

function PatientListItem({
  row,
  active,
  onSelect,
}: {
  row: PatientRow;
  active: boolean;
  onSelect: () => void;
}) {
  const pct = progressPct(row.etapas, row.exige_nf);
  const meta = getStatusMeta(row);
  const nextStep = nextPendingStep(row.etapas, row.exige_nf);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[24px] border p-4 text-left transition"
      style={{
        borderColor: active ? "rgba(22, 101, 52, 0.22)" : T.line,
        background: active ? "linear-gradient(180deg, rgba(22, 101, 52, 0.05), #FFFFFF)" : T.card,
        boxShadow: active ? "0 14px 34px rgba(22, 101, 52, 0.08)" : T.shadowSoft,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[15px] font-semibold" style={{ color: T.text }}>{row.nome_completo}</div>
            {row.exige_nf ? <Badge tone="amber"><Receipt className="h-3.5 w-3.5" /> NF</Badge> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: T.text3 }}>
            <span>{row.cpf}</span>
            <span>{row.celular}</span>
            <span>{brDate(row.created_at)}</span>
          </div>
        </div>
        <Badge tone={meta.key === "concluido" ? "green" : meta.key === "avancado" ? "blue" : "amber"}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span style={{ color: T.text3 }}>Progresso do fluxo</span>
            <span className="font-semibold" style={{ color: T.text }}>{pct}%</span>
          </div>
          <ProgressBar value={pct} />
        </div>
        <div className="rounded-2xl px-3 py-2 text-xs font-semibold" style={{ background: T.cardSoft, color: T.text2 }}>
          {countCompletedSteps(row.etapas, row.exige_nf)}/{totalRelevantSteps(row.exige_nf)} etapas
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border px-3 py-3" style={{ borderColor: T.line, background: T.cardSoft }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Etapa atual</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
            {row.etapa_atual ? STEP_LABEL_BY_KEY[row.etapa_atual] : "Não iniciada"}
          </div>
        </div>
        <div className="rounded-2xl border px-3 py-3" style={{ borderColor: T.line, background: T.cardSoft }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Próxima ação</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
            {nextStep ? nextStep.label : "Fluxo concluído"}
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailField({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="rounded-[20px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>{label}</div>
        {onCopy ? (
          <button type="button" onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: T.text3 }}>
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </button>
        ) : null}
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>{value}</div>
    </div>
  );
}

function Timeline({ row }: { row: PatientRow }) {
  return (
    <div className="space-y-3">
      {PATIENT_STEPS.filter((step) => !step.optional || row.exige_nf).map((step, index) => {
        const done = row.etapas[step.key];
        const current = row.etapa_atual === step.key && !done;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  borderColor: done ? "rgba(34, 197, 94, 0.22)" : current ? "rgba(37, 99, 235, 0.22)" : T.line,
                  background: done ? T.greenSoft : current ? T.blueSoft : T.card,
                  color: done ? T.green : current ? T.blue : T.text3,
                }}
              >
                {done ? <CheckCheck className="h-4 w-4" /> : current ? <Activity className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
              </div>
              {index < PATIENT_STEPS.filter((s) => !s.optional || row.exige_nf).length - 1 ? (
                <div className="mt-2 h-8 w-px" style={{ background: T.lineStrong }} />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold" style={{ color: T.text }}>{step.label}</div>
                {done ? <Badge tone="green">Concluída</Badge> : current ? <Badge tone="blue">Atual</Badge> : <Badge>Pendente</Badge>}
              </div>
              <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
                {done ? "Etapa já finalizada no fluxo do paciente." : current ? "Esta é a frente operacional mais relevante no momento." : "Etapa ainda não concluída."}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityQueue({ rows, onSelect }: { rows: PatientRow[]; onSelect: (id: string) => void }) {
  if (!rows.length) {
    return <EmptyState title="Nenhuma prioridade encontrada" hint="Com os filtros atuais, não há pacientes exigindo atenção imediata." />;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const nextStep = nextPendingStep(row.etapas, row.exige_nf);
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className="w-full rounded-[22px] border p-4 text-left transition"
            style={{ borderColor: T.line, background: T.cardSoft }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                  Prioridade {index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>{row.nome_completo}</div>
                <div className="mt-1 text-xs" style={{ color: T.text3 }}>{nextStep ? nextStep.label : "Concluir revisão final"}</div>
              </div>
              <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: T.redSoft, color: T.red }}>
                {progressPct(row.etapas, row.exige_nf)}%
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailPanel({ row }: { row: PatientRow | null }) {
  if (!row) {
    return <EmptyState title="Selecione um paciente" hint="Escolha um registro da carteira para visualizar o andamento completo." />;
  }

  const pct = progressPct(row.etapas, row.exige_nf);
  const nextStep = nextPendingStep(row.etapas, row.exige_nf);
  const meta = getStatusMeta(row);
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-4 xl:sticky xl:top-6">
      <ShellCard className="overflow-hidden">
        <div className="border-b px-5 py-5" style={{ borderColor: T.line }}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.key === "concluido" ? "green" : meta.key === "avancado" ? "blue" : "amber"}>
              <StatusIcon className="h-3.5 w-3.5" />
              {meta.label}
            </Badge>
            {row.exige_nf ? <Badge tone="amber"><Receipt className="h-3.5 w-3.5" /> Exige NF</Badge> : <Badge>NF não aplicável</Badge>}
          </div>
          <div className="mt-3 text-[22px] font-semibold tracking-tight" style={{ color: T.text }}>{row.nome_completo}</div>
          <div className="mt-1 text-sm" style={{ color: T.text3 }}>
            Registro criado em {brDateTime(row.created_at)}
          </div>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <RingProgress value={pct} />
            </div>
            <div className="grid gap-3">
              <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Etapa atual</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                  {row.etapa_atual ? STEP_LABEL_BY_KEY[row.etapa_atual] : "Não iniciada"}
                </div>
              </div>
              <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Próxima ação recomendada</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                  {nextStep ? nextStep.label : "Fluxo concluído"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Celular" value={row.celular} onCopy={() => copyText(row.celular)} />
            <DetailField label="CPF" value={row.cpf} onCopy={() => copyText(row.cpf)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Etapas concluídas</div>
              <div className="mt-2 text-lg font-semibold" style={{ color: T.text }}>
                {countCompletedSteps(row.etapas, row.exige_nf)}/{totalRelevantSteps(row.exige_nf)}
              </div>
            </div>
            <div className="rounded-[20px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Status fiscal</div>
              <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                {row.exige_nf ? (row.etapas.entrega_nf ? "NF entregue" : "NF pendente") : "Não aplicável"}
              </div>
            </div>
            <div className="rounded-[20px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Fechamento</div>
              <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                {pct === 100 ? "Concluído" : "Em condução"}
              </div>
            </div>
          </div>
        </div>
      </ShellCard>

      <ShellCard className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
          <ClipboardList className="h-4 w-4" />
          Linha do atendimento
        </div>
        <div className="mt-4">
          <Timeline row={row} />
        </div>
      </ShellCard>

      <ShellCard className="p-5" soft>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
          <ShieldCheck className="h-4 w-4" />
          Observações operacionais
        </div>
        <div className="mt-3 rounded-[20px] border p-4 text-sm leading-6" style={{ borderColor: T.line, background: T.card, color: row.observacoes?.trim() ? T.text2 : T.text3 }}>
          {row.observacoes?.trim() || "Nenhuma observação registrada para este paciente."}
        </div>
      </ShellCard>
    </div>
  );
}

export function VisualizacaoPacientesPage() {
  return <VisualizacaoPacientesPageElite />;
}

export function VisualizacaoPacientesPageElite() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | StepKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "em_andamento" | "concluido">("all");
  const [nfFilter, setNfFilter] = useState<"all" | "sim" | "nao">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pageSize = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pacientes", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(await parseError(res));

      const data = (await res.json()) as ApiListResponse;
      const items = (data.items ?? []).map((item) =>
        makePatient({
          id: String(item.id || ""),
          nome_completo: String(item.nome_completo || ""),
          celular: String(item.celular || ""),
          cpf: String(item.cpf || ""),
          exige_nf: Boolean(item.exige_nf),
          etapas: (item.etapas ?? emptySteps()) as PatientSteps,
          etapa_atual: (item.etapa_atual ?? null) as StepKey | null,
          observacoes: item.observacoes ?? "",
          created_at: item.created_at ?? null,
        })
      );

      const ordered = [...items].sort((a, b) => {
        const aDone = progressPct(a.etapas, a.exige_nf) === 100 ? 1 : 0;
        const bDone = progressPct(b.etapas, b.exige_nf) === 100 ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const aOrder = parseStepOrder(a.etapa_atual);
        const bOrder = parseStepOrder(b.etapa_atual);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.nome_completo.localeCompare(b.nome_completo, "pt-BR");
      });

      setRows(ordered);
      if (ordered.length && !selectedId) setSelectedId(ordered[0].id);
    } catch (error) {
      setRows([]);
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Não foi possível carregar os pacientes." });
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const finished = progressPct(row.etapas, row.exige_nf) === 100;

      const matchesText = patientMatches(row, query);
      const matchesStage = stageFilter === "all" ? true : row.etapa_atual === stageFilter;
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "concluido" ? finished : !finished;
      const matchesNF = nfFilter === "all" ? true : nfFilter === "sim" ? row.exige_nf : !row.exige_nf;

      return matchesText && matchesStage && matchesStatus && matchesNF;
    });
  }, [rows, query, stageFilter, statusFilter, nfFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, stageFilter, statusFilter, nfFilter]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, selectedId]);

  const totalCount = rows.length;
  const finishedCount = useMemo(() => rows.filter((row) => progressPct(row.etapas, row.exige_nf) === 100).length, [rows]);
  const inProgressCount = totalCount - finishedCount;
  const nfCount = useMemo(() => rows.filter((row) => row.exige_nf).length, [rows]);
  const avgProgress = useMemo(() => {
    if (!filteredRows.length) return 0;
    return Math.round(filteredRows.reduce((acc, row) => acc + progressPct(row.etapas, row.exige_nf), 0) / filteredRows.length);
  }, [filteredRows]);

  const counts = useMemo(
    () => ({
      all: filteredRows.length,
      em_andamento: filteredRows.filter((row) => progressPct(row.etapas, row.exige_nf) < 100).length,
      concluido: filteredRows.filter((row) => progressPct(row.etapas, row.exige_nf) === 100).length,
    }),
    [filteredRows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * pageSize;
  const pagedRows = filteredRows.slice(offset, offset + pageSize);
  const selected = filteredRows.find((row) => row.id === selectedId) ?? pagedRows[0] ?? null;

  const mostLoadedStage = useMemo(() => {
    const series = PATIENT_STEPS.map((step) => ({
      ...step,
      count: filteredRows.filter((row) => row.etapa_atual === step.key).length,
    }));
    return [...series].sort((a, b) => b.count - a.count)[0] ?? null;
  }, [filteredRows]);

  const fiscalPendingCount = useMemo(
    () => filteredRows.filter((row) => row.exige_nf && !row.etapas.entrega_nf).length,
    [filteredRows]
  );

  const priorityRows = useMemo(() => {
    return [...filteredRows]
      .filter((row) => progressPct(row.etapas, row.exige_nf) < 100)
      .sort((a, b) => progressPct(a.etapas, a.exige_nf) - progressPct(b.etapas, b.exige_nf))
      .slice(0, 3);
  }, [filteredRows]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setStageFilter("all");
    setStatusFilter("all");
    setNfFilter("all");
    setMsg(null);
  }, []);

  return (
    <section
      className="min-w-0"
      style={{
        background: `radial-gradient(circle at top left, rgba(34, 197, 94, 0.08), transparent 24%), radial-gradient(circle at top right, rgba(37, 99, 235, 0.05), transparent 28%), ${T.bg}`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-6 sm:px-6 xl:px-8">
        <ShellCard className="overflow-hidden">
          <div
            className="border-b px-5 py-6 sm:px-6"
            style={{
              borderColor: T.line,
              background: "linear-gradient(135deg, rgba(22, 101, 52, 0.06) 0%, rgba(255,255,255,1) 42%, rgba(37, 99, 235, 0.04) 100%)",
            }}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h1 className="mt-4 text-[30px] font-semibold tracking-tight sm:text-[36px]" style={{ color: T.text }}>
                  Central de acompanhamento clínico
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 sm:text-[15px]" style={{ color: T.text3 }}>
                  Um painel de gestão para acompanhar carteira, progresso por etapa, documentação e prioridade operacional de cada paciente.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.card }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Concentração atual</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                    {mostLoadedStage?.label || "Sem etapa dominante"}
                  </div>
                </div>
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.card }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>Pendências fiscais</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                    {fiscalPendingCount} casos aguardando NF
                  </div>
                </div>
              </div>
            </div>
          </div>

        </ShellCard>

        {msg ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: msg.type === "err" ? "rgba(239,68,68,0.16)" : "rgba(34,197,94,0.18)",
              background: msg.type === "err" ? T.redSoft : T.greenSoft,
              color: msg.type === "err" ? T.red : T.green,
            }}
          >
            {msg.text}
          </div>
        ) : null}

        <div className="grid gap-5 2xl:grid-cols-[330px_minmax(0,1fr)_430px] xl:grid-cols-[310px_minmax(0,1fr)]">
          <div className="space-y-5">
            <ShellCard className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: T.cardMuted, color: T.text2 }}>
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>Filtros de visualização</div>
                  <div className="text-xs" style={{ color: T.text3 }}>Refine o painel por carteira, estágio e contexto fiscal.</div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <FilterField label="Busca por nome, CPF ou celular">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.text3 }} />
                    <FieldInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite um paciente" className="pl-10" />
                  </div>
                </FilterField>

                <FilterField label="Etapa atual">
                  <FieldSelect value={stageFilter} onChange={(e) => setStageFilter(e.target.value as "all" | StepKey)}>
                    <option value="all">Todas as etapas</option>
                    {PATIENT_STEPS.map((step) => (
                      <option key={step.key} value={step.key}>{step.label}</option>
                    ))}
                  </FieldSelect>
                </FilterField>

                <FilterField label="Status do fluxo">
                  <FieldSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "em_andamento" | "concluido")}>
                    <option value="all">Todos</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluídos</option>
                  </FieldSelect>
                </FilterField>

                <FilterField label="Entrega de NF">
                  <FieldSelect value={nfFilter} onChange={(e) => setNfFilter(e.target.value as "all" | "sim" | "nao")}>
                    <option value="all">Todos</option>
                    <option value="sim">Exigem NF</option>
                    <option value="nao">Sem NF</option>
                  </FieldSelect>
                </FilterField>
              </div>
            </ShellCard>

            <ShellCard className="p-5 sm:p-6" soft>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
                <Activity className="h-4 w-4" />
                Distribuição por etapa
              </div>
              <div className="mt-4">
                <StageDistribution rows={filteredRows} />
              </div>
            </ShellCard>

            <ShellCard className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
                <CircleAlert className="h-4 w-4" />
                Prioridades da carteira
              </div>
              <div className="mt-4">
                <PriorityQueue rows={priorityRows} onSelect={setSelectedId} />
              </div>
            </ShellCard>
          </div>

          <div className="space-y-5">
            <ShellCard className="overflow-hidden">
              <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: T.line }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: T.text }}>Carteira de pacientes</div>
                    <div className="mt-1 text-sm" style={{ color: T.text3 }}>
                      {filteredRows.length} registros em visualização com progresso médio de {avgProgress}%.
                    </div>
                  </div>
                  <SegmentTabs value={statusFilter} onChange={setStatusFilter} counts={counts} />
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:p-6">
                {pagedRows.length ? (
                  pagedRows.map((row) => (
                    <PatientListItem key={row.id} row={row} active={selected?.id === row.id} onSelect={() => setSelectedId(row.id)} />
                  ))
                ) : (
                  <EmptyState title="Nenhum paciente encontrado" hint="Ajuste os filtros para ampliar a visualização da carteira." />
                )}
              </div>

              <div className="border-t px-5 py-4 sm:px-6" style={{ borderColor: T.line }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs" style={{ color: T.text3 }}>
                    Página <span style={{ color: T.text, fontWeight: 700 }}>{pageSafe}</span> de <span style={{ color: T.text, fontWeight: 700 }}>{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Btn tone="secondary" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Btn>
                    <Btn tone="secondary" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Btn>
                  </div>
                </div>
              </div>
            </ShellCard>

            <div className="grid gap-4 lg:grid-cols-3">
              <ShellCard className="p-5" soft>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
                  <CalendarClock className="h-4 w-4" />
                  Leitura rápida
                </div>
                <div className="mt-3 text-sm leading-6" style={{ color: T.text3 }}>
                  {mostLoadedStage?.count ? `${mostLoadedStage.count} pacientes estão concentrados em ${mostLoadedStage.label.toLowerCase()}.` : "Sem concentração relevante nas etapas atuais."}
                </div>
              </ShellCard>
              <ShellCard className="p-5" soft>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
                  <Receipt className="h-4 w-4" />
                  Fiscal
                </div>
                <div className="mt-3 text-sm leading-6" style={{ color: T.text3 }}>
                  {fiscalPendingCount} pacientes ainda exigem conclusão da etapa fiscal de nota fiscal.
                </div>
              </ShellCard>
              <ShellCard className="p-5" soft>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.text }}>
                  <FileText className="h-4 w-4" />
                  Maturidade da carteira
                </div>
                <div className="mt-3 text-sm leading-6" style={{ color: T.text3 }}>
                  O conjunto filtrado opera com avanço médio de {avgProgress}% no pipeline clínico.
                </div>
              </ShellCard>
            </div>
          </div>

          <div className="2xl:block xl:col-span-2 2xl:col-span-1">
            <DetailPanel row={selected} />
          </div>
        </div>

        <div className="2xl:hidden">
          <DetailPanel row={selected} />
        </div>
      </div>
    </section>
  );
}
