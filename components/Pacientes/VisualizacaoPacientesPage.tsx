"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  accentStrong: "#9F856F",
  accentSoft: "rgba(186, 163, 145, 0.17)",
  accentRing: "rgba(186, 163, 145, 0.30)",
  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#0F766E",
  warnBg: "rgba(245, 158, 11, 0.10)",
  warnBd: "rgba(245, 158, 11, 0.30)",
  warnTx: "#B45309",
  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#991B1B",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1560px] px-4 sm:px-6 py-6",
  header: "border bg-white rounded-lg",
  section: "border bg-white rounded-lg",
  headerTitle: "text-lg sm:text-xl font-semibold tracking-tight",
  headerSub: "text-xs sm:text-sm leading-6",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  input:
    "w-full h-11 px-3.5 border bg-white text-sm outline-none transition focus:ring-2 rounded-lg",
  select:
    "w-full h-11 px-3.5 border bg-white text-sm outline-none transition focus:ring-2 rounded-lg",
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

type PriorityLevel = "Crítica" | "Alta" | "Média" | "Baixa";

type EnrichedPatient = Patient & {
  progress: number;
  currentStepKey: StepKey | null;
  currentStepLabel: string;
  nextStepLabel: string;
  pendingSteps: number;
  daysWithoutUpdate: number;
  daysInPipeline: number;
  score: number;
  priority: PriorityLevel;
  reasons: string[];
};

type ApiPatientRow = Partial<Patient> & {
  etapas?: unknown;
  id?: string | number;
  nome_completo?: string;
  celular?: string;
  cpf?: string;
  exige_nf?: boolean;
  observacoes?: string | null;
  etapa_atual?: StepKey | null;
  created_at?: string;
  updated_at?: string;
};

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  Crítica: 0,
  Alta: 1,
  Média: 2,
  Baixa: 3,
};

const PIE_COLORS = ["#9F856F", "#C3AC99", "#DCCEC3", "#EDE4DD"];

function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center h-8 px-3 text-[11px] font-medium border rounded-lg"
      style={{
        borderColor: active ? "rgba(186, 163, 145, 0.28)" : T.border,
        background: active ? T.accentSoft : T.cardSoft,
        color: active ? T.accentStrong : T.text2,
      }}
    >
      {children}
    </span>
  );
}

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
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function normalizeSteps(input: unknown): PatientSteps {
  const data = (input as Record<string, unknown>) || {};
  return {
    agendamento: Boolean(data.agendamento),
    solicitacao_exames: Boolean(data.solicitacao_exames),
    exames_realizados: Boolean(data.exames_realizados),
    planejamento_apresentado: Boolean(data.planejamento_apresentado),
    planejamento_aprovado: Boolean(data.planejamento_aprovado),
    execucao_agendada: Boolean(data.execucao_agendada),
    contrato_formalizado: Boolean(data.contrato_formalizado),
    termo_conclusao: Boolean(data.termo_conclusao),
    entrega_nf: Boolean(data.entrega_nf),
    retornos_programados: Boolean(data.retornos_programados),
  };
}

function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function getRelevantSteps(exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF);
}

function getCurrentStepKey(steps: PatientSteps, exigeNF: boolean) {
  let current: StepKey | null = null;
  for (const step of PATIENT_STEPS) {
    if (step.optional && !exigeNF) continue;
    if (steps[step.key]) current = step.key;
  }
  return current;
}

function getCurrentStepLabel(patient: Pick<Patient, "etapas" | "exige_nf" | "etapa_atual">) {
  const stepKey = patient.etapa_atual || getCurrentStepKey(patient.etapas, patient.exige_nf);
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

function diffInDays(value?: string) {
  if (!value) return 0;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function priorityBadge(level: PriorityLevel) {
  if (level === "Crítica") return { bg: T.errBg, bd: T.errBd, tx: T.errTx };
  if (level === "Alta") return { bg: T.warnBg, bd: T.warnBd, tx: T.warnTx };
  if (level === "Média") {
    return { bg: T.accentSoft, bd: "rgba(186, 163, 145, 0.28)", tx: T.accentStrong };
  }
  return { bg: T.okBg, bd: T.okBd, tx: T.okTx };
}

function enrichPatient(row: Patient): EnrichedPatient {
  const progress = progressPercent(row.etapas, row.exige_nf);
  const currentStepKey = row.etapa_atual || getCurrentStepKey(row.etapas, row.exige_nf);
  const currentStepLabel = getCurrentStepLabel(row);
  const nextStepLabel = getNextStepLabel(row);
  const relevant = getRelevantSteps(row.exige_nf);
  const pendingSteps = relevant.filter((step) => !row.etapas[step.key]).length;
  const daysWithoutUpdate = diffInDays(row.updated_at || row.created_at);
  const daysInPipeline = diffInDays(row.created_at || row.updated_at);

  let score = 0;
  const reasons: string[] = [];

  if (daysWithoutUpdate >= 15) {
    score += 40;
    reasons.push(`${daysWithoutUpdate} dias sem atualização`);
  } else if (daysWithoutUpdate >= 8) {
    score += 24;
    reasons.push(`${daysWithoutUpdate} dias sem atualização`);
  } else if (daysWithoutUpdate >= 4) {
    score += 12;
    reasons.push(`${daysWithoutUpdate} dias sem atualização`);
  }

  if (daysInPipeline >= 30 && progress < 80) {
    score += 22;
    reasons.push("Tempo elevado no funil");
  } else if (daysInPipeline >= 14 && progress < 60) {
    score += 14;
    reasons.push("Atenção ao tempo de jornada");
  }

  if (progress >= 55 && progress < 100) {
    score += 18;
    reasons.push("Paciente próximo de conversão/fechamento");
  }

  if (progress <= 25 && daysInPipeline >= 7) {
    score += 16;
    reasons.push("Paciente travado no início do fluxo");
  }

  if (row.exige_nf && !row.etapas.entrega_nf) {
    score += 8;
    reasons.push("NF pendente no fluxo");
  }

  if (currentStepKey === "planejamento_aprovado" || currentStepKey === "execucao_agendada") {
    score += 14;
    reasons.push("Etapa sensível para avanço operacional");
  }

  if (pendingSteps <= 2 && progress < 100) {
    score += 10;
    reasons.push("Poucas etapas restantes");
  }

  let priority: PriorityLevel = "Baixa";
  if (score >= 65) priority = "Crítica";
  else if (score >= 45) priority = "Alta";
  else if (score >= 25) priority = "Média";

  return {
    ...row,
    progress,
    currentStepKey,
    currentStepLabel,
    nextStepLabel,
    pendingSteps,
    daysWithoutUpdate,
    daysInPipeline,
    score,
    priority,
    reasons,
  };
}

function ChartCard({
  title,
  hint,
  children,
  icon,
  height = 320,
}: {
  title: string;
  hint: string;
  children: ReactNode;
  icon?: ReactNode;
  height?: number;
}) {
  return (
    <div className={cx(UI.section, "p-4 sm:p-5")} style={{ borderColor: T.border, background: T.card }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={UI.sectionTitle} style={{ color: T.text }}>
            {title}
          </div>
          <div className={cx(UI.sectionHint, "mt-1 leading-5")} style={{ color: T.text3 }}>
            {hint}
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
          style={{ borderColor: T.border, background: T.cardSoft, color: T.accentStrong }}
        >
          {icon || <BarChart3 className="w-4 h-4" />}
        </div>
      </div>
      <div className="mt-4" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

function PriorityChip({ level }: { level: PriorityLevel }) {
  const s = priorityBadge(level);
  return (
    <span
      className="inline-flex items-center h-8 px-3 text-[11px] font-semibold border rounded-lg"
      style={{ background: s.bg, borderColor: s.bd, color: s.tx }}
    >
      {level}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: T.border, background: T.cardSoft }}>
      <div className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-1 text-base font-semibold" style={{ color: T.text }}>
        {value}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      className="h-full border rounded-lg flex items-center justify-center text-sm"
      style={{ borderColor: T.border, color: T.text3, background: T.cardSoft }}
    >
      Sem dados suficientes para exibir este gráfico.
    </div>
  );
}

function QueueSpotlight({
  item,
  index,
  onClick,
}: {
  item: EnrichedPatient;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition hover:-translate-y-0.5"
      style={{
        borderColor: index === 0 ? T.accentRing : T.border,
        background: index === 0 ? T.accentSoft : T.card,
        boxShadow: index === 0 ? "0 12px 40px rgba(159,133,111,0.10)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: T.text3 }}>
            Prioridade #{index + 1}
          </div>
          <div className="mt-1 text-sm font-semibold truncate" style={{ color: T.text }}>
            {item.nome_completo}
          </div>
          <div className="mt-1 text-[11px] leading-5" style={{ color: T.text3 }}>
            {item.currentStepLabel} <ArrowRight className="inline w-3 h-3" /> {item.nextStepLabel}
          </div>
        </div>
        <PriorityChip level={item.priority} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Sem atualizar" value={`${item.daysWithoutUpdate} d`} />
        <MiniMetric label="Progresso" value={`${item.progress}%`} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: T.text3 }}>
          <span>Avanço do fluxo</span>
          <span>{item.progress}%</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: T.accentStrong }} />
        </div>
      </div>
    </button>
  );
}

export function VisualizacaoPacientesPage() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [stageFilter, setStageFilter] = useState("todos");

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoading(true);
      try {
        const res = await fetch("/api/pacientes", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { error?: string; items?: ApiPatientRow[] };

        if (!res.ok) {
          throw new Error(data.error || "Erro ao carregar pacientes.");
        }

        const items: Patient[] = Array.isArray(data.items)
          ? data.items.map((row) => ({
              id: String(row.id ?? ""),
              nome_completo: String(row.nome_completo ?? ""),
              celular: String(row.celular ?? ""),
              cpf: String(row.cpf ?? ""),
              exige_nf: Boolean(row.exige_nf),
              observacoes: row.observacoes ? String(row.observacoes) : null,
              etapa_atual: row.etapa_atual ?? null,
              etapas: normalizeSteps(row.etapas),
              created_at: row.created_at ? String(row.created_at) : undefined,
              updated_at: row.updated_at ? String(row.updated_at) : undefined,
            }))
          : [];

        if (!active) return;
        setRows(items);
        if (items.length > 0) {
          setSelectedId((prev) => prev ?? items[0]?.id ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPatients();

    return () => {
      active = false;
    };
  }, []);

  const enrichedRows = useMemo(() => rows.map(enrichPatient), [rows]);

  const filteredRows = useMemo(() => {
    return enrichedRows
      .filter((row) => {
        const matchesQuery = !query
          ? true
          : [row.nome_completo, row.cpf, row.celular]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));

        const matchesPriority = priorityFilter === "todos" ? true : row.priority === priorityFilter;
        const matchesStage = stageFilter === "todos" ? true : row.currentStepKey === stageFilter;

        return matchesQuery && matchesPriority && matchesStage;
      })
      .sort((a, b) => {
        if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        }
        if (b.score !== a.score) return b.score - a.score;
        return b.daysWithoutUpdate - a.daysWithoutUpdate;
      });
  }, [enrichedRows, query, priorityFilter, stageFilter]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => (prev && filteredRows.some((row) => row.id === prev) ? prev : filteredRows[0]?.id ?? null));
  }, [filteredRows]);

  const selectedPatient = useMemo(
    () => filteredRows.find((row) => row.id === selectedId) || enrichedRows.find((row) => row.id === selectedId) || null,
    [filteredRows, enrichedRows, selectedId]
  );

  const stageChartData = useMemo(() => {
    const totalRows = filteredRows.length || 1;

    return PATIENT_STEPS.map((step) => {
      const total = filteredRows.filter((row) => row.currentStepKey === step.key).length;
      return {
        etapa: step.label,
        etapaShort: step.label.length > 24 ? `${step.label.slice(0, 24)}…` : step.label,
        total,
        perc: Math.round((total / totalRows) * 100),
      };
    })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const priorityChartData = useMemo(() => {
    const levels: PriorityLevel[] = ["Crítica", "Alta", "Média", "Baixa"];
    return levels.map((level) => ({
      name: level,
      value: filteredRows.filter((row) => row.priority === level).length,
    }));
  }, [filteredRows]);

  const recentAdmissions = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
      const label = ref.toLocaleDateString("pt-BR", { month: "short" });
      months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), total: 0 });
    }

    for (const row of filteredRows) {
      if (!row.created_at) continue;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((item) => item.key === key);
      if (bucket) bucket.total += 1;
    }

    return months;
  }, [filteredRows]);

  const funnelChartData = useMemo(() => {
    return PATIENT_STEPS.filter((step) => !step.optional || filteredRows.some((row) => row.exige_nf)).map((step) => ({
      etapa: step.label.length > 22 ? `${step.label.slice(0, 22)}…` : step.label,
      total: filteredRows.filter((row) => row.etapas[step.key]).length,
    }));
  }, [filteredRows]);

  const spotlightQueue = useMemo(() => filteredRows.slice(0, 8), [filteredRows]);

  const chartTooltipStyle = {
    borderRadius: 16,
    border: `1px solid ${T.border}`,
    background: T.card,
    color: T.text,
  } as const;

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        <div
          className={cx(UI.header, "p-5 sm:p-6")}
          style={{
            borderColor: T.border,
            background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(251,252,253,1) 100%)",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 max-w-[920px]">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Visualização analítica de prioridade
              </div>
              <div className={cx(UI.headerSub, "mt-2")} style={{ color: T.text3 }}>
                Dashboard com foco em análise de prioridade
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, CPF ou celular"
                className={cx(UI.input, "pl-10")}
                style={{ borderColor: T.border, color: T.text, background: T.card }}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={cx(UI.select, "pl-10")}
                style={{ borderColor: T.border, color: T.text, background: T.card }}
              >
                <option value="todos">Todas as prioridades</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.text3 }} />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className={cx(UI.select, "pl-10")}
                style={{ borderColor: T.border, color: T.text, background: T.card }}
              >
                <option value="todos">Todas as etapas</option>
                {PATIENT_STEPS.map((step) => (
                  <option key={step.key} value={step.key}>
                    {step.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <div className={cx(UI.section, "p-4 sm:p-5")} style={{ borderColor: T.border, background: T.card }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={UI.sectionTitle} style={{ color: T.text }}>
                  Prioridade de atendimento
                </div>
                <div className={cx(UI.sectionHint, "mt-1 leading-5")} style={{ color: T.text3 }}>
                  Cards compactos para leitura rápida dos pacientes mais sensíveis, sem tabela e sem score visível.
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                style={{ borderColor: T.border, background: T.cardSoft, color: T.accentStrong }}
              >
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {loading ? (
                <div
                  className="col-span-full h-[220px] rounded-lg border flex items-center justify-center gap-2 text-sm"
                  style={{ borderColor: T.border, background: T.cardSoft, color: T.text3 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando pacientes...
                </div>
              ) : spotlightQueue.length === 0 ? (
                <div
                  className="col-span-full h-[220px] rounded-lg border flex items-center justify-center text-sm"
                  style={{ borderColor: T.border, background: T.cardSoft, color: T.text3 }}
                >
                  Nenhum paciente encontrado para esta combinação de filtros.
                </div>
              ) : (
                spotlightQueue.map((item, index) => (
                  <QueueSpotlight
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={() => {
                      setSelectedId(item.id);
                      setDrawerOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4">
            <ChartCard
              title="Prioridade"
              hint="Distribuição entre urgência crítica, alta, média e baixa."
              icon={<AlertTriangle className="w-4 h-4" />}
              height={340}
            >
              {priorityChartData.some((item) => item.value > 0) ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityChartData.filter((item) => item.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={74}
                          outerRadius={108}
                          paddingAngle={3}
                        >
                          {priorityChartData
                            .filter((item) => item.value > 0)
                            .map((entry, index) => (
                              <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {priorityChartData
                      .filter((item) => item.value > 0)
                      .map((item, index) => (
                        <div
                          key={item.name}
                          className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3"
                          style={{ borderColor: T.border, background: T.cardSoft }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-xs font-medium truncate" style={{ color: T.text2 }}>
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: T.text }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="xl:col-span-8">
            <ChartCard
              title="Etapa atual"
              hint="Leitura do volume concentrado por etapa."
              icon={<BarChart3 className="w-4 h-4" />}
              height={340}
            >
              {stageChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 28, left: 26, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }} />
                    <YAxis
                      type="category"
                      dataKey="etapaShort"
                      width={168}
                      tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "rgba(186, 163, 145, 0.10)" }}
                      formatter={(value, _name, item) => {
                        const payload = item?.payload as { perc?: number; etapa?: string } | undefined;
                        return [`${value} paciente(s) • ${payload?.perc || 0}% da carteira`, payload?.etapa || "Etapa"];
                      }}
                    />
                    <Bar dataKey="total" radius={[0, 10, 10, 0]}>
                      {stageChartData.slice(0, 8).map((entry, index) => (
                        <Cell
                          key={`${entry.etapa}-${index}`}
                          fill={index === 0 ? T.accentStrong : index === 1 ? "#B89D88" : "#D8C9BD"}
                        />
                      ))}
                      <LabelList dataKey="total" position="right" style={{ fill: T.text, fontSize: 11, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="xl:col-span-4">
            <ChartCard
              title="Entradas por mês"
              hint="Volume de pacientes cadastrados."
              icon={<TrendingUp className="w-4 h-4" />}
            >
              {recentAdmissions.some((item) => item.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentAdmissions} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="fillEntries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9F856F" stopOpacity={0.34} />
                        <stop offset="95%" stopColor="#9F856F" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="total" stroke="#9F856F" fill="url(#fillEntries)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="xl:col-span-8">
            <ChartCard
              title="Conclusão por etapa"
              hint="Quantidade de pacientes que já concluíram cada marco do processo."
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {funnelChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelChartData} layout="vertical" margin={{ top: 8, right: 18, left: 20, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }} />
                    <YAxis
                      type="category"
                      dataKey="etapa"
                      width={150}
                      tick={{ fontSize: 11, fill: "rgba(11, 18, 32, 0.55)" }}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(186, 163, 145, 0.10)" }} />
                    <Bar dataKey="total" radius={[0, 10, 10, 0]} fill="#CBB2A0" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>
        </div>
      </div>

      {drawerOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(11,18,32,0.38)" }}
            onClick={() => setDrawerOpen(false)}
          />

          <aside
            className="relative h-full w-full max-w-[560px] border-l p-5 sm:p-6 overflow-y-auto"
            style={{ borderColor: T.border, background: T.card }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate" style={{ color: T.text }}>
                  {selectedPatient.nome_completo}
                </div>
                <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
                  Cadastro em {formatDate(selectedPatient.created_at)} • Última atualização em {formatDate(selectedPatient.updated_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 rounded-lg border flex items-center justify-center"
                style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <PriorityChip level={selectedPatient.priority} />
              <Pill active>{selectedPatient.currentStepLabel}</Pill>
              <Pill>{selectedPatient.nextStepLabel}</Pill>
              <Pill>{selectedPatient.exige_nf ? "Fluxo com NF" : "Fluxo sem NF"}</Pill>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric label="CPF" value={maskCPF(selectedPatient.cpf)} />
              <MiniMetric label="Celular" value={maskPhone(selectedPatient.celular)} />
              <MiniMetric label="Progresso" value={`${selectedPatient.progress}%`} />
              <MiniMetric label="Sem atualizar" value={`${selectedPatient.daysWithoutUpdate} dias`} />
              <MiniMetric label="No pipeline" value={`${selectedPatient.daysInPipeline} dias`} />
              <MiniMetric label="Etapas pendentes" value={String(selectedPatient.pendingSteps)} />
            </div>

            <div className="mt-5 rounded-lg border p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: T.text3 }}>
                Motivos de atenção
              </div>
              <div className="mt-3 space-y-2">
                {(selectedPatient.reasons.length ? selectedPatient.reasons : ["Paciente em monitoramento de rotina"]).map((reason) => (
                  <div
                    key={reason}
                    className="rounded-lg border px-3 py-2.5 text-sm"
                    style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-lg border p-4" style={{ borderColor: T.border, background: T.card }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: T.text3 }}>
                Mapa completo de etapas
              </div>
              <div className="mt-3 space-y-2">
                {getRelevantSteps(selectedPatient.exige_nf).map((step) => {
                  const done = selectedPatient.etapas[step.key];
                  return (
                    <div
                      key={step.key}
                      className="rounded-lg border px-3 py-3 flex items-center justify-between gap-3"
                      style={{
                        borderColor: done ? "rgba(16,185,129,0.30)" : T.border,
                        background: done ? T.okBg : T.cardSoft,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium" style={{ color: T.text }}>
                          {step.label}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                          {done ? "Etapa concluída no fluxo." : "Etapa ainda pendente no fluxo."}
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center h-8 px-3 rounded-lg text-[11px] font-semibold border"
                        style={{
                          borderColor: done ? T.okBd : T.border,
                          background: done ? T.okBg : T.card,
                          color: done ? T.okTx : T.text3,
                        }}
                      >
                        {done ? "Concluída" : "Pendente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-lg border p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: T.text3 }}>
                Observações
              </div>
              <div className="mt-2 text-sm leading-6 whitespace-pre-wrap" style={{ color: T.text2 }}>
                {selectedPatient.observacoes?.trim() || "Nenhuma observação registrada para este paciente."}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default VisualizacaoPacientesPage;
