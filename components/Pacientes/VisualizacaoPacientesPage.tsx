"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Funnel,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

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

const STEP_LABEL_BY_KEY = Object.fromEntries(
  PATIENT_STEPS.map((s) => [s.key, s.label])
) as Record<StepKey, string>;

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

function brMonthShort(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
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
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF).filter(
    (step) => steps[step.key]
  ).length;
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
  return (
    PATIENT_STEPS.find((step) => (!step.optional || exigeNF) && !steps[step.key]) ?? null
  );
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

function makePatient(
  data: Partial<PatientRow> & Pick<PatientRow, "id" | "nome_completo" | "celular" | "cpf">
): PatientRow {
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
      tone: "green" as const,
      icon: CheckCircle2,
    };
  }

  if (pct >= 60) {
    return {
      key: "avancado" as const,
      label: "Avançado",
      tone: "blue" as const,
      icon: TrendingUp,
    };
  }

  return {
    key: "andamento" as const,
    label: "Em andamento",
    tone: "amber" as const,
    icon: Clock3,
  };
}

function daysSince(iso?: string | null) {
  if (!iso) return null;
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return null;
  const diffMs = Date.now() - created.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function monthSeries(rows: PatientRow[], months = 6) {
  const now = new Date();
  const series = Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: brMonthShort(date),
      total: 0,
      concluidos: 0,
    };
  });

  rows.forEach((row) => {
    if (!row.created_at) return;
    const date = new Date(row.created_at);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = series.find((item) => item.key === key);
    if (!bucket) return;
    bucket.total += 1;
    if (progressPct(row.etapas, row.exige_nf) === 100) bucket.concluidos += 1;
  });

  return series;
}

function avg<T>(items: T[], fn: (item: T) => number) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + fn(item), 0) / items.length);
}

function ShellCard({
  children,
  className,
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
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
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
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
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      style={palette}
    >
      {children}
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
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={palette}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, color = "green" }: { value: number; color?: "green" | "blue" | "amber" }) {
  const fill = color === "blue" ? T.blue : color === "amber" ? T.amber : T.green;
  const soft = color === "blue" ? T.blueSoft : color === "amber" ? T.amberSoft : T.greenSoft;
  return (
    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: T.cardMuted }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${fill} 0%, ${soft.includes("rgba") ? fill : fill} 100%)`,
        }}
      />
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div
      className="rounded-[24px] border p-8 text-center"
      style={{ borderColor: T.line, background: T.cardSoft }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: T.cardMuted }}
      >
        <UserRound className="h-6 w-6" style={{ color: T.text3 }} />
      </div>
      <div className="mt-4 text-sm font-semibold" style={{ color: T.text }}>
        {title}
      </div>
      <div className="mt-1 text-sm" style={{ color: T.text3 }}>
        {hint}
      </div>
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
          <div
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: T.text3 }}
          >
            {title}
          </div>
          <div className="mt-3 text-[30px] font-semibold tracking-tight" style={{ color: T.text }}>
            {value}
          </div>
          <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
            {hint}
          </div>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: palette.soft, color: palette.fg }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </ShellCard>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FieldInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none transition focus:ring-4",
        className
      )}
      style={{ borderColor: T.lineStrong, color: T.text }}
    />
  );
}

function FieldSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none transition focus:ring-4",
        className
      )}
      style={{ borderColor: T.lineStrong, color: T.text }}
    />
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: T.cardMuted, color: T.text2 }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: T.text }}>
            {title}
          </div>
          {hint ? (
            <div className="text-xs" style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : null}
        </div>
      </div>
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
              <span className="truncate font-medium" style={{ color: T.text2 }}>
                {step.label}
              </span>
              <span className="font-semibold" style={{ color: T.text }}>
                {count}
              </span>
            </div>
            <ProgressBar value={pct} color="green" />
          </div>
        );
      })}
    </div>
  );
}

function MonthlyMovement({ rows }: { rows: PatientRow[] }) {
  const series = useMemo(() => monthSeries(rows), [rows]);
  const maxValue = Math.max(1, ...series.map((item) => item.total));

  return (
    <div className="grid gap-4 md:grid-cols-6">
      {series.map((item) => {
        const totalHeight = Math.max(10, Math.round((item.total / maxValue) * 132));
        const concluidoHeight =
          item.total > 0 ? Math.max(8, Math.round((item.concluidos / maxValue) * 132)) : 0;

        return (
          <div key={item.key} className="flex flex-col items-center gap-3">
            <div className="flex h-[154px] items-end gap-2">
              <div
                className="w-5 rounded-t-full"
                style={{ height: totalHeight, background: T.blueSoft, border: `1px solid ${T.line}` }}
              />
              <div
                className="w-5 rounded-t-full"
                style={{ height: concluidoHeight, background: T.green, opacity: item.concluidos ? 1 : 0.25 }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold uppercase" style={{ color: T.text3 }}>
                {item.label}
              </div>
              <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                {item.total}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FunnelBoard({ rows }: { rows: PatientRow[] }) {
  const items = PATIENT_STEPS.map((step) => {
    const count = rows.filter((row) => row.etapa_atual === step.key).length;
    return { ...step, count };
  });
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.max(14, Math.round((item.count / maxCount) * 100));
        return (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="font-medium" style={{ color: T.text2 }}>
                {item.label}
              </div>
              <div className="font-semibold" style={{ color: T.text }}>
                {item.count}
              </div>
            </div>
            <div className="rounded-full" style={{ background: T.cardMuted, padding: 4 }}>
              <div
                className="flex h-10 items-center rounded-full px-4 text-sm font-semibold"
                style={{ width: `${width}%`, background: T.greenSoft, color: T.green }}
              >
                {item.count} pacientes
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgingBreakdown({ rows }: { rows: PatientRow[] }) {
  const bands = [
    { key: "ate7", label: "Até 7 dias", count: 0, tone: "green" as const },
    { key: "ate15", label: "8 a 15 dias", count: 0, tone: "blue" as const },
    { key: "ate30", label: "16 a 30 dias", count: 0, tone: "amber" as const },
    { key: "mais30", label: "> 30 dias", count: 0, tone: "red" as const },
  ];

  rows.forEach((row) => {
    const days = daysSince(row.created_at);
    if (days == null) return;
    if (days <= 7) bands[0].count += 1;
    else if (days <= 15) bands[1].count += 1;
    else if (days <= 30) bands[2].count += 1;
    else bands[3].count += 1;
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {bands.map((band) => (
        <div
          key={band.key}
          className="rounded-[22px] border p-4"
          style={{ borderColor: T.line, background: T.cardSoft }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                {band.label}
              </div>
              <div className="mt-2 text-2xl font-semibold" style={{ color: T.text }}>
                {band.count}
              </div>
            </div>
            <Badge tone={band.tone}>{band.label}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityTable({ rows }: { rows: PatientRow[] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="Sem pacientes prioritários"
        hint="Não há registros em andamento para compor a fila prioritária com os filtros atuais."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead>
          <tr>
            {[
              "Paciente",
              "Etapa atual",
              "Próxima ação",
              "Progresso",
              "Cadastro",
            ].map((label) => (
              <th
                key={label}
                className="border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ borderColor: T.line, color: T.text3 }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = progressPct(row.etapas, row.exige_nf);
            const next = nextPendingStep(row.etapas, row.exige_nf);
            const meta = getStatusMeta(row);
            const Icon = meta.icon;
            return (
              <tr key={row.id}>
                <td className="border-b px-4 py-4 align-top" style={{ borderColor: T.line }}>
                  <div className="font-semibold" style={{ color: T.text }}>
                    {row.nome_completo}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    {row.cpf} • {row.celular}
                  </div>
                </td>
                <td className="border-b px-4 py-4 align-top" style={{ borderColor: T.line }}>
                  <Badge tone={meta.tone}>
                    <Icon className="h-3.5 w-3.5" />
                    {row.etapa_atual ? STEP_LABEL_BY_KEY[row.etapa_atual] : "Não iniciada"}
                  </Badge>
                </td>
                <td className="border-b px-4 py-4 align-top text-sm" style={{ borderColor: T.line, color: T.text2 }}>
                  {next ? next.label : "Fluxo concluído"}
                </td>
                <td className="border-b px-4 py-4 align-top" style={{ borderColor: T.line }}>
                  <div className="flex items-center gap-3">
                    <div className="w-28">
                      <ProgressBar value={pct} color={meta.tone === "blue" ? "blue" : meta.tone === "amber" ? "amber" : "green"} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: T.text }}>
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="border-b px-4 py-4 align-top text-sm" style={{ borderColor: T.line, color: T.text2 }}>
                  {brDate(row.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopStageCard({ rows }: { rows: PatientRow[] }) {
  const ranked = PATIENT_STEPS.map((step) => ({
    ...step,
    count: rows.filter((row) => row.etapa_atual === step.key).length,
  })).sort((a, b) => b.count - a.count);

  const first = ranked[0];
  const second = ranked[1];

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
          Etapa com maior volume
        </div>
        <div className="mt-2 text-lg font-semibold" style={{ color: T.text }}>
          {first?.label || "Sem dados"}
        </div>
        <div className="mt-1 text-sm" style={{ color: T.text3 }}>
          {first?.count || 0} pacientes atualmente concentrados.
        </div>
      </div>
      <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
          Segunda concentração
        </div>
        <div className="mt-2 text-lg font-semibold" style={{ color: T.text }}>
          {second?.label || "Sem dados"}
        </div>
        <div className="mt-1 text-sm" style={{ color: T.text3 }}>
          {second?.count || 0} pacientes nesta camada do fluxo.
        </div>
      </div>
    </div>
  );
}

function NotesCard({ rows }: { rows: PatientRow[] }) {
  const withNotes = rows.filter((row) => row.observacoes?.trim());
  const lastWithNotes = [...withNotes].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  })[0];

  return (
    <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
        Última observação relevante
      </div>
      {lastWithNotes ? (
        <>
          <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
            {lastWithNotes.nome_completo}
          </div>
          <div className="mt-2 text-sm leading-6" style={{ color: T.text2 }}>
            {lastWithNotes.observacoes}
          </div>
        </>
      ) : (
        <div className="mt-2 text-sm" style={{ color: T.text3 }}>
          Nenhuma observação preenchida na carteira filtrada.
        </div>
      )}
    </div>
  );
}

export function VisualizacaoPacientesPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | StepKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "em_andamento" | "concluido">("all");
  const [nfFilter, setNfFilter] = useState<"all" | "sim" | "nao">("all");

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

      setRows(items);
    } catch (error) {
      setRows([]);
      setMsg({
        type: "err",
        text:
          error instanceof Error ? error.message : "Não foi possível carregar o dashboard de pacientes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const finished = progressPct(row.etapas, row.exige_nf) === 100;
      const matchesText = patientMatches(row, query);
      const matchesStage = stageFilter === "all" ? true : row.etapa_atual === stageFilter;
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "concluido" ? finished : !finished;
      const matchesNF = nfFilter === "all" ? true : nfFilter === "sim" ? row.exige_nf : !row.exige_nf;
      return matchesText && matchesStage && matchesStatus && matchesNF;
    });
  }, [rows, query, stageFilter, statusFilter, nfFilter]);

  const totalCount = filteredRows.length;
  const finishedCount = useMemo(
    () => filteredRows.filter((row) => progressPct(row.etapas, row.exige_nf) === 100).length,
    [filteredRows]
  );
  const inProgressCount = totalCount - finishedCount;
  const nfCount = useMemo(() => filteredRows.filter((row) => row.exige_nf).length, [filteredRows]);
  const avgProgress = useMemo(
    () => avg(filteredRows, (row) => progressPct(row.etapas, row.exige_nf)),
    [filteredRows]
  );
  const avgAge = useMemo(
    () => avg(filteredRows, (row) => daysSince(row.created_at) ?? 0),
    [filteredRows]
  );
  const mostLoadedStage = useMemo(() => {
    const ranked = PATIENT_STEPS.map((step) => ({
      ...step,
      count: filteredRows.filter((row) => row.etapa_atual === step.key).length,
    })).sort((a, b) => b.count - a.count);
    return ranked[0] ?? null;
  }, [filteredRows]);
  const fiscalPendingCount = useMemo(
    () => filteredRows.filter((row) => row.exige_nf && !row.etapas.entrega_nf).length,
    [filteredRows]
  );
  const priorityRows = useMemo(() => {
    return [...filteredRows]
      .filter((row) => progressPct(row.etapas, row.exige_nf) < 100)
      .sort((a, b) => {
        const ap = progressPct(a.etapas, a.exige_nf);
        const bp = progressPct(b.etapas, b.exige_nf);
        if (ap !== bp) return ap - bp;
        const ad = daysSince(a.created_at) ?? 0;
        const bd = daysSince(b.created_at) ?? 0;
        return bd - ad;
      })
      .slice(0, 6);
  }, [filteredRows]);
  const recentRows = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      })
      .slice(0, 5);
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
              background:
                "linear-gradient(135deg, rgba(22, 101, 52, 0.06) 0%, rgba(255,255,255,1) 42%, rgba(37, 99, 235, 0.04) 100%)",
            }}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: T.lineStrong, color: T.text2, background: T.cardSoft }}
                >
                  <Activity className="h-3.5 w-3.5" />
                  dashboard executivo da carteira
                </div>
                <h1
                  className="mt-4 text-[30px] font-semibold tracking-tight sm:text-[36px]"
                  style={{ color: T.text }}
                >
                  Dashboard de acompanhamento clínico
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 sm:text-[15px]" style={{ color: T.text3 }}>
                  Uma leitura gerencial da carteira de pacientes, com foco em volume por etapa, maturidade do pipeline, documentação fiscal e prioridades operacionais.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px]">
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.card }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Etapa dominante
                  </div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                    {mostLoadedStage?.label || "Sem etapa dominante"}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    {mostLoadedStage?.count || 0} pacientes atualmente concentrados.
                  </div>
                </div>
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.card }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Pendências fiscais
                  </div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: T.text }}>
                    {fiscalPendingCount} casos aguardando NF
                  </div>
                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Considerando apenas pacientes com exigência fiscal.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
            <KPI title="Pacientes" value={totalCount} hint="Total de registros dentro do recorte atual." icon={UserRound} tone="neutral" />
            <KPI title="Em andamento" value={inProgressCount} hint="Casos ainda em evolução no fluxo clínico." icon={Activity} tone="amber" />
            <KPI title="Concluídos" value={finishedCount} hint="Fluxos totalmente finalizados." icon={CheckCircle2} tone="green" />
            <KPI title="Com NF" value={nfCount} hint="Pacientes com obrigação fiscal ativa." icon={Receipt} tone="blue" />
            <KPI title="Progresso médio" value={`${avgProgress}%`} hint="Nível médio de maturidade da carteira filtrada." icon={TrendingUp} tone="green" />
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

        <div className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-5">
            <ShellCard className="p-5 sm:p-6">
              <SectionTitle icon={Filter} title="Filtros do dashboard" hint="Refine o recorte analisado para indicadores e quadros." />

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
                  <FieldSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "em_andamento" | "concluido") }>
                    <option value="all">Todos</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluídos</option>
                  </FieldSelect>
                </FilterField>

                <FilterField label="Entrega de NF">
                  <FieldSelect value={nfFilter} onChange={(e) => setNfFilter(e.target.value as "all" | "sim" | "nao") }>
                    <option value="all">Todos</option>
                    <option value="sim">Exigem NF</option>
                    <option value="nao">Sem NF</option>
                  </FieldSelect>
                </FilterField>
              </div>

              <div className="mt-5 flex gap-2">
                <Btn tone="secondary" onClick={load} disabled={loading} className="flex-1">
                  <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                  Atualizar
                </Btn>
                <Btn tone="ghost" onClick={clearFilters} className="flex-1">
                  Limpar
                </Btn>
              </div>
            </ShellCard>

            <ShellCard className="p-5 sm:p-6" soft>
              <SectionTitle icon={Funnel} title="Distribuição por etapa" hint="Visualização da concentração atual do pipeline." />
              <div className="mt-4">
                <StageDistribution rows={filteredRows} />
              </div>
            </ShellCard>

            <ShellCard className="p-5 sm:p-6">
              <SectionTitle icon={CalendarDays} title="Aging da carteira" hint="Tempo de permanência dos registros no pipeline." />
              <div className="mt-4">
                <AgingBreakdown rows={filteredRows} />
              </div>
            </ShellCard>
          </div>

          <div className="space-y-5">
            <ShellCard className="overflow-hidden">
              <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: T.line }}>
                <SectionTitle icon={ClipboardList} title="Pipeline do atendimento" hint="Comparativo entre entrada no fluxo e avanço consolidado por etapa." />
              </div>
              <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Funil por etapa atual
                  </div>
                  <FunnelBoard rows={filteredRows} />
                </div>
                <div>
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Highlights operacionais
                  </div>
                  <TopStageCard rows={filteredRows} />
                </div>
              </div>
            </ShellCard>

            <ShellCard className="overflow-hidden">
              <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: T.line }}>
                <SectionTitle icon={TrendingUp} title="Movimentação recente" hint="Entradas por mês versus quantidade já concluída nesse recorte." />
              </div>
              <div className="p-5 sm:p-6">
                <MonthlyMovement rows={filteredRows} />
              </div>
            </ShellCard>

            <ShellCard className="overflow-hidden">
              <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: T.line }}>
                <SectionTitle icon={CircleAlert} title="Fila prioritária" hint="Pacientes com menor progresso e maior necessidade de tração operacional." />
              </div>
              <div className="p-0">
                {loading ? (
                  <div className="grid gap-4 p-5 sm:p-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-14 animate-pulse rounded-2xl" style={{ background: T.cardSoft }} />
                    ))}
                  </div>
                ) : (
                  <PriorityTable rows={priorityRows} />
                )}
              </div>
            </ShellCard>
          </div>

          <div className="space-y-5 2xl:block xl:col-span-2 2xl:col-span-1">
            <ShellCard className="p-5 sm:p-6">
              <SectionTitle icon={FileText} title="Resumo executivo" hint="Indicadores auxiliares para leitura rápida da carteira." />
              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Progresso médio
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: T.text }}>
                    {avgProgress}%
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={avgProgress} color="green" />
                  </div>
                </div>
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Tempo médio na carteira
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: T.text }}>
                    {avgAge} dias
                  </div>
                  <div className="mt-1 text-sm" style={{ color: T.text3 }}>
                    Média estimada a partir da data de cadastro dos registros filtrados.
                  </div>
                </div>
                <div className="rounded-[22px] border p-4" style={{ borderColor: T.line, background: T.cardSoft }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                    Próximas ações em aberto
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: T.text }}>
                    {priorityRows.length}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: T.text3 }}>
                    Casos puxados para a fila prioritária do painel.
                  </div>
                </div>
              </div>
            </ShellCard>

            <ShellCard className="p-5 sm:p-6" soft>
              <SectionTitle icon={UserRound} title="Cadastros mais recentes" hint="Últimos pacientes incluídos no conjunto filtrado." />
              <div className="mt-4 space-y-3">
                {recentRows.length ? (
                  recentRows.map((row) => {
                    const pct = progressPct(row.etapas, row.exige_nf);
                    return (
                      <div
                        key={row.id}
                        className="rounded-[22px] border p-4"
                        style={{ borderColor: T.line, background: T.card }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: T.text }}>
                              {row.nome_completo}
                            </div>
                            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                              {brDate(row.created_at)} • {row.cpf}
                            </div>
                          </div>
                          <Badge tone={pct === 100 ? "green" : pct >= 60 ? "blue" : "amber"}>{pct}%</Badge>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={pct} color={pct === 100 ? "green" : pct >= 60 ? "blue" : "amber"} />
                        </div>
                        <div className="mt-2 text-xs" style={{ color: T.text3 }}>
                          {row.etapa_atual ? STEP_LABEL_BY_KEY[row.etapa_atual] : "Não iniciada"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="Sem cadastros recentes" hint="Não há registros para compor este quadro com os filtros atuais." />
                )}
              </div>
            </ShellCard>

            <NotesCard rows={filteredRows} />
          </div>
        </div>
      </div>
    </section>
  );
}