"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Edit3,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const T = {
  bg: "#F3F6F8",
  surface: "#FFFFFF",
  surface2: "#FAFBFC",
  surface3: "#F7F9FB",
  line: "rgba(15, 23, 42, 0.10)",
  lineStrong: "rgba(15, 23, 42, 0.16)",
  text: "#0F172A",
  text2: "rgba(15, 23, 42, 0.76)",
  text3: "rgba(15, 23, 42, 0.54)",
  accent: "#14532D",
  accent2: "#166534",
  accentSoft: "rgba(20, 83, 45, 0.08)",
  accentSoft2: "rgba(20, 83, 45, 0.14)",
  accentSoft3: "rgba(20, 83, 45, 0.22)",
  okBg: "rgba(22, 163, 74, 0.10)",
  okBd: "rgba(22, 163, 74, 0.18)",
  okTx: "#166534",
  warnBg: "rgba(245, 158, 11, 0.10)",
  warnBd: "rgba(245, 158, 11, 0.20)",
  warnTx: "#92400E",
  errBg: "rgba(220, 38, 38, 0.10)",
  errBd: "rgba(220, 38, 38, 0.18)",
  errTx: "#991B1B",
  shadow: "0 18px 38px rgba(15, 23, 42, 0.08)",
} as const;

const UI = {
  page: "min-h-screen w-full",
  shell: "mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 sm:py-6",
  panel: "rounded-[26px] border bg-white",
  input:
    "h-11 w-full rounded-2xl border bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-[rgba(20,83,45,0.14)]",
  select:
    "h-11 w-full rounded-2xl border bg-white px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(20,83,45,0.14)]",
  textarea:
    "min-h-[120px] w-full rounded-2xl border bg-white px-3.5 py-3 text-sm outline-none transition resize-y focus:ring-2 focus:ring-[rgba(20,83,45,0.14)]",
  label: "text-[11px] font-semibold uppercase tracking-[0.12em]",
};

const PATIENT_STEPS = [
  { key: "agendamento", label: "Agendamento" },
  { key: "solicitacao_exames", label: "Solicitação de exames" },
  { key: "exames_realizados", label: "Exames realizados" },
  { key: "planejamento_apresentado", label: "Planejamento apresentado" },
  { key: "planejamento_aprovado", label: "Planejamento aprovado" },
  { key: "execucao_agendada", label: "Agendamento de execução" },
  { key: "contrato_formalizado", label: "Contrato formalizado" },
  { key: "termo_conclusao", label: "Termo de conclusão" },
  { key: "entrega_nf", label: "Entrega de NF", optional: true },
  { key: "retornos_programados", label: "Retornos programados" },
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

type ApiItemResponse = {
  ok: boolean;
  item?: Partial<PatientRow>;
  error?: string;
};

type EditorState = PatientRow;
type TabKey = "resumo" | "etapas" | "edicao";

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

function totalRelevantSteps(exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF).length;
}

function countCompletedSteps(steps: PatientSteps, exigeNF: boolean) {
  return PATIENT_STEPS.filter((step) => !step.optional || exigeNF).filter((step) => steps[step.key]).length;
}

function nextPendingStep(row: PatientRow) {
  return PATIENT_STEPS.find((step) => (!step.optional || row.exige_nf) && !row.etapas[step.key]) ?? null;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function makePatient(data: Partial<PatientRow>): PatientRow {
  const exige_nf = Boolean(data.exige_nf);
  const etapas = { ...emptySteps(), ...(data.etapas ?? {}) } as PatientSteps;
  return {
    id: String(data.id || crypto.randomUUID()),
    nome_completo: String(data.nome_completo || ""),
    celular: formatCellphone(String(data.celular || "")),
    cpf: formatCPF(String(data.cpf || "")),
    exige_nf,
    etapas,
    etapa_atual: (data.etapa_atual as StepKey | null) ?? deriveCurrentStep(etapas, exige_nf),
    observacoes: data.observacoes ?? "",
    created_at: data.created_at ?? null,
  };
}

function makeEmptyPatient(): PatientRow {
  const etapas = emptySteps();
  return {
    id: "",
    nome_completo: "",
    celular: "",
    cpf: "",
    exige_nf: false,
    etapas,
    etapa_atual: deriveCurrentStep(etapas, false),
    observacoes: "",
    created_at: null,
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

function Message({ type, text }: { type: "ok" | "err"; text: string }) {
  const style =
    type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : { background: T.errBg, borderColor: T.errBd, color: T.errTx };

  return (
    <div className="rounded-2xl border px-3.5 py-2.5 text-sm font-medium" style={style}>
      {text}
    </div>
  );
}

function Button({
  children,
  tone = "secondary",
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const style =
    tone === "primary"
      ? { background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, borderColor: T.accent2, color: "#fff" }
      : tone === "ghost"
      ? { background: "transparent", borderColor: "transparent", color: T.text2 }
      : { background: T.surface, borderColor: T.lineStrong, color: T.text };

  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      style={style}
      disabled={props.disabled || loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "ok" | "warn";
}) {
  const style =
    tone === "accent"
      ? { background: T.accentSoft, borderColor: T.accentSoft2, color: T.accent }
      : tone === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : tone === "warn"
      ? { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx }
      : { background: T.surface3, borderColor: T.line, color: T.text2 };

  return (
    <span className="inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-semibold" style={style}>
      {children}
    </span>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: T.line, background: T.surface2 }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: T.text }}>
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
        {hint}
      </div>
    </div>
  );
}

function DataField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: T.line, background: T.surface2 }}>
      <div className={UI.label} style={{ color: T.text3 }}>
        {label}
      </div>
      <div className={cx("mt-2 text-sm font-medium", mono && "font-mono text-[13px]")} style={{ color: T.text }}>
        {value}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(15,23,42,0.08)" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`,
        }}
      />
    </div>
  );
}

function StepPill({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-3 py-3"
      style={{
        borderColor: done ? T.accentSoft3 : T.line,
        background: done ? T.accentSoft : T.surface2,
      }}
    >
      <div
        className="grid h-8 w-8 place-items-center rounded-xl border"
        style={{
          borderColor: done ? T.accentSoft3 : T.line,
          background: done ? `linear-gradient(135deg, ${T.accent}, ${T.accent2})` : T.surface,
          color: done ? "#fff" : T.text3,
        }}
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium" style={{ color: T.text }}>
          {label}
        </div>
      </div>
      <Badge tone={done ? "ok" : "default"}>{done ? "Concluída" : "Pendente"}</Badge>
    </div>
  );
}

function DetailTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition"
      style={{
        borderColor: active ? T.accentSoft3 : T.line,
        background: active ? T.accentSoft : T.surface,
        color: active ? T.accent : T.text2,
      }}
    >
      {children}
    </button>
  );
}

function EditorSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border p-5" style={{ borderColor: T.line, background: T.surface2 }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: T.text }}>
            {title}
          </div>
          {hint ? (
            <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PacientesWorkspacePage() {
  return <PacientesWorkspace />;
}

export function BasePacientesPage() {
  return <PacientesWorkspace />;
}

function PacientesWorkspace() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [nfFilter, setNfFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("resumo");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("edit");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadRows = useCallback(async (silent?: boolean) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/pacientes", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(await parseError(res));
      const data = (await res.json()) as ApiListResponse;
      const items = (data.items ?? []).map(makePatient);
      setRows(items);
      setSelectedId((prev) => prev && items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Não foi possível carregar os pacientes." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        row.nome_completo.toLowerCase().includes(q) ||
        digitsOnly(row.cpf).includes(digitsOnly(q)) ||
        digitsOnly(row.celular).includes(digitsOnly(q));

      const matchesStage = !stageFilter || row.etapa_atual === stageFilter;
      const matchesNF = !nfFilter || (nfFilter === "com_nf" ? row.exige_nf : !row.exige_nf);

      return matchesQuery && matchesStage && matchesNF;
    });
  }, [rows, query, stageFilter, nfFilter]);

  const selectedRow = useMemo(() => filteredRows.find((row) => row.id === selectedId) ?? rows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? rows[0] ?? null, [filteredRows, rows, selectedId]);

  useEffect(() => {
    if (!selectedRow) {
      setEditor(null);
      return;
    }
    if (editorMode === "edit" && (!editor || editor.id !== selectedRow.id)) {
      setEditor({ ...selectedRow, etapas: { ...selectedRow.etapas } });
    }
  }, [selectedRow, editor, editorMode]);

  const total = rows.length;
  const comNF = rows.filter((row) => row.exige_nf).length;
  const concluidos = rows.filter((row) => countCompletedSteps(row.etapas, row.exige_nf) === totalRelevantSteps(row.exige_nf)).length;
  const andamento = total - concluidos;

  const selectedProgress = editor
    ? Math.round((countCompletedSteps(editor.etapas, editor.exige_nf) / Math.max(1, totalRelevantSteps(editor.exige_nf))) * 100)
    : 0;

  const startCreate = () => {
    setEditorMode("create");
    setSelectedId(null);
    setTab("edicao");
    setEditor(makeEmptyPatient());
    setMsg(null);
  };

  const openForEdit = (row: PatientRow) => {
    setEditorMode("edit");
    setSelectedId(row.id);
    setTab("resumo");
    setEditor({ ...row, etapas: { ...row.etapas } });
    setMsg(null);
  };

  const updateEditor = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value } as EditorState;
      next.etapa_atual = deriveCurrentStep(next.etapas, next.exige_nf);
      return next;
    });
  };

  const toggleStep = (key: StepKey) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const etapas = { ...prev.etapas, [key]: !prev.etapas[key] };
      return {
        ...prev,
        etapas,
        etapa_atual: deriveCurrentStep(etapas, prev.exige_nf),
      };
    });
  };

  const saveEditor = async () => {
    if (!editor) return;

    const nome = editor.nome_completo.trim();
    const cpf = digitsOnly(editor.cpf);
    const celular = digitsOnly(editor.celular);

    if (!nome) return setMsg({ type: "err", text: "Informe o nome completo do paciente." });
    if (cpf.length !== 11) return setMsg({ type: "err", text: "CPF inválido. Informe 11 dígitos." });
    if (celular.length < 10) return setMsg({ type: "err", text: "Celular inválido." });

    setSaving(true);
    setMsg(null);

    const payload = {
      nome_completo: nome,
      cpf,
      celular,
      exige_nf: editor.exige_nf,
      etapas: editor.etapas,
      observacoes: editor.observacoes?.trim() || null,
    };

    try {
      if (editorMode === "create") {
        const res = await fetch("/api/pacientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(await parseError(res));

        const data = (await res.json()) as ApiItemResponse;
        const item = makePatient(data.item ?? {});
        setRows((prev) => [item, ...prev]);
        setSelectedId(item.id);
        setEditorMode("edit");
        setEditor({ ...item, etapas: { ...item.etapas } });
        setTab("resumo");
        setMsg({ type: "ok", text: "Paciente cadastrado com sucesso." });
        return;
      }

      const res = await fetch(`/api/pacientes/${editor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await parseError(res));

      const data = (await res.json()) as ApiItemResponse;
      const item = makePatient(data.item ?? {});
      setRows((prev) => prev.map((row) => (row.id === item.id ? item : row)));
      setSelectedId(item.id);
      setEditor({ ...item, etapas: { ...item.etapas } });
      setMsg({ type: "ok", text: "Paciente atualizado com sucesso." });
      setTab("resumo");
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Não foi possível salvar." });
    } finally {
      setSaving(false);
    }
  };

  const visibleEditor = editorMode === "edit" ? editor ?? selectedRow : editor;

  return (
    <main className={UI.page} style={{ background: T.bg }}>
      <div className={UI.shell}>
        <section className={cx(UI.panel, "overflow-hidden")} style={{ borderColor: T.line, boxShadow: T.shadow, background: T.surface }}>
          <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: T.line, background: T.surface }}>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border" style={{ borderColor: T.accentSoft3, background: T.accentSoft, color: T.accent }}>
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: T.text }}>
                      Base de pacientes
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: T.text3 }}>
                      Lista operacional com ficha lateral do paciente e edição completa do cadastro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[560px]">
                <Metric label="Pacientes" value={String(total)} hint="Base cadastrada" />
                <Metric label="Em andamento" value={String(andamento)} hint="Fluxo ativo" />
                <Metric label="Concluídos" value={String(concluidos)} hint="Fluxo finalizado" />
                <Metric label="Com NF" value={String(comNF)} hint="Exigência fiscal" />
              </div>
            </div>
          </div>

          <div className="grid min-h-[780px] grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside className="border-r" style={{ borderColor: T.line, background: T.surface2 }}>
              <div className="border-b p-5" style={{ borderColor: T.line }}>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.text3 }} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={cx(UI.input, "pl-10")}
                      style={{ borderColor: T.lineStrong, color: T.text }}
                      placeholder="Buscar por nome, CPF ou celular"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      className={UI.select}
                      style={{ borderColor: T.lineStrong, color: T.text }}
                    >
                      <option value="">Todas as etapas</option>
                      {PATIENT_STEPS.map((step) => (
                        <option key={step.key} value={step.key}>
                          {step.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={nfFilter}
                      onChange={(e) => setNfFilter(e.target.value)}
                      className={UI.select}
                      style={{ borderColor: T.lineStrong, color: T.text }}
                    >
                      <option value="">NF: todos</option>
                      <option value="com_nf">Com NF</option>
                      <option value="sem_nf">Sem NF</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button tone="primary" className="flex-1" onClick={startCreate}>
                      <Plus className="h-4 w-4" />
                      Novo paciente
                    </Button>
                    <Button tone="secondary" onClick={() => loadRows(true)} loading={refreshing}>
                      <RefreshCw className="h-4 w-4" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: T.line }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>
                    Lista de pacientes
                  </div>
                  <div className="text-xs" style={{ color: T.text3 }}>
                    {filteredRows.length} registros visíveis
                  </div>
                </div>
                <Badge>{loading ? "Carregando" : `${rows.length} total`}</Badge>
              </div>

              <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <div className="grid place-items-center rounded-[24px] border p-10 text-sm" style={{ borderColor: T.line, background: T.surface }}>
                    <div className="flex items-center gap-2" style={{ color: T.text3 }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando pacientes…
                    </div>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="rounded-[24px] border p-8" style={{ borderColor: T.line, background: T.surface }}>
                    <div className="text-sm font-semibold" style={{ color: T.text }}>
                      Nenhum paciente encontrado
                    </div>
                    <div className="mt-2 text-sm leading-6" style={{ color: T.text3 }}>
                      Ajuste os filtros ou cadastre um novo paciente para iniciar a base.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRows.map((row) => {
                      const done = countCompletedSteps(row.etapas, row.exige_nf);
                      const totalSteps = totalRelevantSteps(row.exige_nf);
                      const progress = Math.round((done / totalSteps) * 100);
                      const active = row.id === selectedRow?.id && editorMode !== "create";

                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => openForEdit(row)}
                          className="w-full rounded-[24px] border p-4 text-left transition"
                          style={{
                            borderColor: active ? T.accentSoft3 : T.line,
                            background: active ? T.accentSoft : T.surface,
                            boxShadow: active ? "inset 3px 0 0 #14532D" : "none",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold" style={{ color: T.text }}>
                                {row.nome_completo || "Paciente sem nome"}
                              </div>
                              <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                {row.cpf || "CPF não informado"}
                              </div>
                            </div>
                            <Badge tone={row.exige_nf ? "warn" : "default"}>{row.exige_nf ? "NF" : "Sem NF"}</Badge>
                          </div>

                          <div className="mt-4 grid gap-3">
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                                <span>Progresso</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="mt-2">
                                <ProgressBar value={progress} />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span style={{ color: T.text2 }}>
                                {row.etapa_atual ? STEP_LABEL_BY_KEY[row.etapa_atual] : "Sem andamento"}
                              </span>
                              <span style={{ color: T.text3 }}>
                                {done}/{totalSteps}
                              </span>
                            </div>

                            <div className="text-xs" style={{ color: T.text3 }}>
                              {row.celular || "Sem celular"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <section className="min-w-0" style={{ background: T.surface }}>
              <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: T.line }}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border" style={{ borderColor: T.line, background: T.surface2, color: T.accent }}>
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold tracking-tight" style={{ color: T.text }}>
                          {visibleEditor?.nome_completo || "Novo paciente"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: T.text3 }}>
                          <span>{visibleEditor?.cpf || "CPF pendente"}</span>
                          <span>•</span>
                          <span>{visibleEditor?.celular || "Celular pendente"}</span>
                          <span>•</span>
                          <span>{visibleEditor?.created_at ? formatDateTime(visibleEditor.created_at) : "Ainda não cadastrado"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DetailTabButton active={tab === "resumo"} onClick={() => setTab("resumo")}>Resumo</DetailTabButton>
                    <DetailTabButton active={tab === "etapas"} onClick={() => setTab("etapas")}>Etapas</DetailTabButton>
                    <DetailTabButton active={tab === "edicao"} onClick={() => setTab("edicao")}>Edição</DetailTabButton>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {msg ? <div className="mb-5"><Message type={msg.type} text={msg.text} /></div> : null}

                {!visibleEditor ? (
                  <div className="grid min-h-[420px] place-items-center rounded-[28px] border" style={{ borderColor: T.line, background: T.surface2 }}>
                    <div className="text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border" style={{ borderColor: T.line, background: T.surface, color: T.text3 }}>
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div className="mt-4 text-lg font-semibold" style={{ color: T.text }}>
                        Selecione um paciente
                      </div>
                      <div className="mt-2 text-sm" style={{ color: T.text3 }}>
                        Clique em um registro à esquerda para abrir a ficha lateral com resumo, etapas e edição.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.25fr_0.95fr]">
                      <section className="rounded-[28px] border p-5" style={{ borderColor: T.line, background: T.surface2 }}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: T.text }}>
                              Status do atendimento
                            </div>
                            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                              Progresso geral do fluxo, próxima etapa e situação documental.
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={visibleEditor.exige_nf ? "warn" : "default"}>
                              {visibleEditor.exige_nf ? "NF obrigatória" : "NF opcional"}
                            </Badge>
                            <Badge tone={selectedProgress === 100 ? "ok" : "accent"}>{selectedProgress}% concluído</Badge>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <DataField label="Etapa atual" value={visibleEditor.etapa_atual ? STEP_LABEL_BY_KEY[visibleEditor.etapa_atual] : "Sem andamento"} />
                          <DataField label="Próxima etapa" value={nextPendingStep(visibleEditor) ? nextPendingStep(visibleEditor)!.label : "Fluxo concluído"} />
                          <DataField label="Cadastro" value={formatDateTime(visibleEditor.created_at)} />
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                            <span>Progresso do fluxo</span>
                            <span>
                              {countCompletedSteps(visibleEditor.etapas, visibleEditor.exige_nf)}/{totalRelevantSteps(visibleEditor.exige_nf)} etapas
                            </span>
                          </div>
                          <ProgressBar value={selectedProgress} />
                        </div>
                      </section>

                      <section className="rounded-[28px] border p-5" style={{ borderColor: T.line, background: T.surface2 }}>
                        <div className="text-sm font-semibold" style={{ color: T.text }}>
                          Dados do paciente
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <DataField label="Nome completo" value={visibleEditor.nome_completo || "—"} />
                          <DataField label="CPF" value={visibleEditor.cpf || "—"} mono />
                          <DataField label="Celular" value={visibleEditor.celular || "—"} mono />
                          <DataField label="Identificador" value={visibleEditor.id || "Novo registro"} mono />
                        </div>
                      </section>
                    </div>

                    {tab === "resumo" ? (
                      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                        <EditorSection
                          title="Checklist executivo"
                          hint="Leitura rápida do andamento do paciente. Para alterar as etapas, use a aba de edição ou a aba de etapas."
                        >
                          <div className="grid gap-3">
                            {PATIENT_STEPS.map((step) => {
                              if (step.optional && !visibleEditor.exige_nf) return null;
                              return <StepPill key={step.key} done={visibleEditor.etapas[step.key]} label={step.label} />;
                            })}
                          </div>
                        </EditorSection>

                        <EditorSection title="Observações" hint="Anotações operacionais e informações relevantes do caso.">
                          <div className="rounded-2xl border p-4 text-sm leading-6" style={{ borderColor: T.line, background: T.surface }}>
                            <div style={{ color: T.text2 }}>{visibleEditor.observacoes?.trim() || "Nenhuma observação cadastrada."}</div>
                          </div>
                        </EditorSection>
                      </section>
                    ) : null}

                    {tab === "etapas" ? (
                      <EditorSection title="Linha do tempo do tratamento" hint="Visualização estruturada de todas as etapas do fluxo do paciente.">
                        <div className="grid gap-3">
                          {PATIENT_STEPS.map((step, index) => {
                            if (step.optional && !visibleEditor.exige_nf) return null;
                            const done = visibleEditor.etapas[step.key];
                            return (
                              <div key={step.key} className="relative pl-14">
                                {index < PATIENT_STEPS.length - 1 ? (
                                  <div className="absolute left-[15px] top-10 h-[calc(100%-18px)] w-px" style={{ background: T.line }} />
                                ) : null}
                                <div
                                  className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-xl border"
                                  style={{
                                    borderColor: done ? T.accentSoft3 : T.line,
                                    background: done ? `linear-gradient(135deg, ${T.accent}, ${T.accent2})` : T.surface,
                                    color: done ? "#fff" : T.text3,
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div className="rounded-2xl border p-4" style={{ borderColor: done ? T.accentSoft3 : T.line, background: done ? T.accentSoft : T.surface2 }}>
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold" style={{ color: T.text }}>
                                        {step.label}
                                      </div>
                                      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                        {done ? "Etapa concluída" : "Etapa pendente"}
                                      </div>
                                    </div>
                                    <Badge tone={done ? "ok" : "default"}>{done ? "Concluída" : "Pendente"}</Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </EditorSection>
                    ) : null}

                    {tab === "edicao" ? (
                      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-5">
                          <EditorSection title={editorMode === "create" ? "Novo cadastro" : "Editar cadastro"} hint="Atualize dados cadastrais, observações e exigência fiscal do paciente.">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="md:col-span-2">
                                <label className={UI.label} style={{ color: T.text3 }}>
                                  Nome completo
                                </label>
                                <input
                                  value={visibleEditor.nome_completo}
                                  onChange={(e) => updateEditor("nome_completo", e.target.value)}
                                  className={cx(UI.input, "mt-2")}
                                  style={{ borderColor: T.lineStrong, color: T.text }}
                                  placeholder="Digite o nome do paciente"
                                />
                              </div>

                              <div>
                                <label className={UI.label} style={{ color: T.text3 }}>
                                  Celular
                                </label>
                                <input
                                  value={visibleEditor.celular}
                                  onChange={(e) => updateEditor("celular", formatCellphone(e.target.value))}
                                  className={cx(UI.input, "mt-2")}
                                  style={{ borderColor: T.lineStrong, color: T.text }}
                                  placeholder="(11) 99999-9999"
                                />
                              </div>

                              <div>
                                <label className={UI.label} style={{ color: T.text3 }}>
                                  CPF
                                </label>
                                <input
                                  value={visibleEditor.cpf}
                                  onChange={(e) => updateEditor("cpf", formatCPF(e.target.value))}
                                  className={cx(UI.input, "mt-2")}
                                  style={{ borderColor: T.lineStrong, color: T.text }}
                                  placeholder="000.000.000-00"
                                />
                              </div>

                              <div className="md:col-span-2 rounded-2xl border px-4 py-4" style={{ borderColor: T.line, background: T.surface }}>
                                <label className="flex cursor-pointer items-start gap-3">
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-slate-300"
                                    checked={visibleEditor.exige_nf}
                                    onChange={(e) => updateEditor("exige_nf", e.target.checked)}
                                  />
                                  <div>
                                    <div className="text-sm font-semibold" style={{ color: T.text }}>
                                      Exigir entrega de NF
                                    </div>
                                    <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
                                      Ative quando a etapa de entrega de nota fiscal fizer parte do fluxo desse paciente.
                                    </div>
                                  </div>
                                </label>
                              </div>

                              <div className="md:col-span-2">
                                <label className={UI.label} style={{ color: T.text3 }}>
                                  Observações
                                </label>
                                <textarea
                                  value={visibleEditor.observacoes || ""}
                                  onChange={(e) => updateEditor("observacoes", e.target.value)}
                                  className={cx(UI.textarea, "mt-2")}
                                  style={{ borderColor: T.lineStrong, color: T.text }}
                                  placeholder="Registre observações clínicas, operacionais ou administrativas"
                                />
                              </div>
                            </div>
                          </EditorSection>
                        </div>

                        <div className="space-y-5">
                          <EditorSection title="Etapas do fluxo" hint="Marque as etapas já concluídas. A etapa atual é recalculada automaticamente.">
                            <div className="grid gap-3">
                              {PATIENT_STEPS.map((step) => {
                                if (step.optional && !visibleEditor.exige_nf) return null;
                                const done = visibleEditor.etapas[step.key];
                                return (
                                  <button
                                    key={step.key}
                                    type="button"
                                    onClick={() => toggleStep(step.key)}
                                    className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition"
                                    style={{
                                      borderColor: done ? T.accentSoft3 : T.line,
                                      background: done ? T.accentSoft : T.surface,
                                    }}
                                  >
                                    <div
                                      className="grid h-9 w-9 place-items-center rounded-xl border"
                                      style={{
                                        borderColor: done ? T.accentSoft3 : T.line,
                                        background: done ? `linear-gradient(135deg, ${T.accent}, ${T.accent2})` : T.surface2,
                                        color: done ? "#fff" : T.text3,
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium" style={{ color: T.text }}>
                                        {step.label}
                                      </div>
                                      <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                        {done ? "Clique para marcar como pendente" : "Clique para marcar como concluída"}
                                      </div>
                                    </div>
                                    <Badge tone={done ? "ok" : "default"}>{done ? "Concluída" : "Pendente"}</Badge>
                                  </button>
                                );
                              })}
                            </div>
                          </EditorSection>

                          <EditorSection title="Resumo de salvamento" hint="Conferência rápida antes de gravar as alterações.">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <DataField label="Etapa atual" value={visibleEditor.etapa_atual ? STEP_LABEL_BY_KEY[visibleEditor.etapa_atual] : "Sem andamento"} />
                                <DataField label="Próxima etapa" value={nextPendingStep(visibleEditor)?.label || "Fluxo concluído"} />
                              </div>

                              <div>
                                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.text3 }}>
                                  <span>Progresso</span>
                                  <span>{selectedProgress}%</span>
                                </div>
                                <ProgressBar value={selectedProgress} />
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <Button tone="primary" onClick={saveEditor} loading={saving}>
                                  <Save className="h-4 w-4" />
                                  {editorMode === "create" ? "Salvar cadastro" : "Salvar alterações"}
                                </Button>

                                {editorMode === "create" ? (
                                  <Button
                                    tone="secondary"
                                    onClick={() => {
                                      setEditorMode("edit");
                                      setEditor(selectedRow ? { ...selectedRow, etapas: { ...selectedRow.etapas } } : null);
                                      setSelectedId(selectedRow?.id ?? rows[0]?.id ?? null);
                                      setTab("resumo");
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                  </Button>
                                ) : (
                                  <Button
                                    tone="secondary"
                                    onClick={() => selectedRow && setEditor({ ...selectedRow, etapas: { ...selectedRow.etapas } })}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Descartar mudanças
                                  </Button>
                                )}
                              </div>
                            </div>
                          </EditorSection>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
