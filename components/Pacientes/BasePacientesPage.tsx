"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  FileText,
  IdCard,
  Loader2,
  Phone,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  borderStrong: "rgba(17, 24, 39, 0.18)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  mutedBg: "rgba(17, 24, 39, 0.035)",

  accent: "#baa391",
  accent2: "#baa391",
  accentSoft: "rgba(186, 163, 145, 0.17)",
  accentRing: "rgba(186, 163, 145, 0.28)",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#8D7461",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#7F1D1D",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-3 sm:px-6 py-4 sm:py-6",
  header: "border bg-white",
  section: "border bg-white",
  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs leading-5",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs leading-5",
  label: "text-[11px] font-medium",
  input:
    "w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-xl",
  textarea:
    "w-full min-h-[120px] px-3 py-3 border bg-white text-sm outline-none transition rounded-xl",
  select:
    "w-full h-11 px-3 border bg-white text-sm outline-none transition rounded-xl",
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function Btn({
  tone = "primary",
  loading,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger" | "subtleDanger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold border rounded-xl " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  return (
    <button
      className={cx(base, className)}
      disabled={disabled || loading}
      style={
        tone === "primary"
          ? { background: T.accent, borderColor: "rgba(186, 163, 145, 0.7)", color: "white" }
          : tone === "danger"
            ? { background: "#DC2626", borderColor: "rgba(220, 38, 38, 0.55)", color: "white" }
            : tone === "subtleDanger"
              ? {
                  background: "rgba(127, 29, 29, 0.03)",
                  borderColor: "rgba(127, 29, 29, 0.16)",
                  color: "rgba(127, 29, 29, 0.88)",
                }
              : { background: T.card, borderColor: T.border, color: T.text }
      }
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Processando…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center min-h-7 px-2.5 py-1 text-[11px] font-medium border rounded-full leading-tight"
      style={{
        borderColor: active ? "rgba(186, 163, 145, 0.35)" : T.border,
        background: active ? T.accentSoft : T.cardSoft,
        color: active ? "#8D7461" : T.text2,
      }}
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
    <div className="text-sm px-3 py-2.5 border rounded-xl" style={s}>
      {m.text}
    </div>
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
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    agendamento: Boolean(source.agendamento),
    solicitacao_exames: Boolean(source.solicitacao_exames),
    exames_realizados: Boolean(source.exames_realizados),
    planejamento_apresentado: Boolean(source.planejamento_apresentado),
    planejamento_aprovado: Boolean(source.planejamento_aprovado),
    execucao_agendada: Boolean(source.execucao_agendada),
    contrato_formalizado: Boolean(source.contrato_formalizado),
    termo_conclusao: Boolean(source.termo_conclusao),
    entrega_nf: Boolean(source.entrega_nf),
    retornos_programados: Boolean(source.retornos_programados),
  };
}

function toPatient(row: unknown): Patient {
  const source = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const etapaAtual = source.etapa_atual;
  const validStep = PATIENT_STEPS.some((step) => step.key === etapaAtual);

  return {
    id: String(source.id ?? ""),
    nome_completo: String(source.nome_completo ?? ""),
    celular: String(source.celular ?? ""),
    cpf: String(source.cpf ?? ""),
    exige_nf: Boolean(source.exige_nf),
    observacoes: source.observacoes == null ? null : String(source.observacoes),
    etapa_atual: validStep ? (etapaAtual as StepKey) : null,
    etapas: normalizeSteps(source.etapas),
    created_at: typeof source.created_at === "string" ? source.created_at : undefined,
    updated_at: typeof source.updated_at === "string" ? source.updated_at : undefined,
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
  const relevant = PATIENT_STEPS.filter((step) => !step.optional || exigeNF);
  const done = relevant.filter((step) => steps[step.key]).length;
  return relevant.length ? Math.round((done / relevant.length) * 100) : 0;
}

function isComplete(patient: Pick<Patient, "etapas" | "exige_nf">) {
  const relevant = PATIENT_STEPS.filter((step) => !step.optional || patient.exige_nf);
  return relevant.every((step) => patient.etapas[step.key]);
}

function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function emptyPatient(): Patient {
  return {
    id: "",
    nome_completo: "",
    celular: "",
    cpf: "",
    exige_nf: false,
    observacoes: "",
    etapa_atual: null,
    etapas: normalizeSteps({ agendamento: true }),
  };
}

function FieldInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-1 text-sm break-words" style={{ color: T.text }}>
        {value}
      </div>
    </div>
  );
}

export function BasePacientesPage() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Patient>(emptyPatient());
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pacientes", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar pacientes.");

      const items: Patient[] = Array.isArray(data?.items) ? data.items.map(toPatient) : [];

      setRows(items);
      if (items.length) {
        setSelectedId((currentId) => currentId ?? items[0].id);
      }
    } catch (error: unknown) {
      setMsg({ type: "err", text: getErrorMessage(error, "Erro ao carregar pacientes.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery = !query
        ? true
        : [row.nome_completo, row.cpf, row.celular]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));

      const rowCurrentStep = getCurrentStep(row.etapas, row.exige_nf);
      const matchesStage = stageFilter === "todos" ? true : rowCurrentStep === stageFilter;

      return matchesQuery && matchesStage;
    });
  }, [rows, query, stageFilter]);

  const selectedPatient = useMemo(() => {
    return rows.find((row) => row.id === selectedId) || null;
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selectedPatient) return;
    setEditing({
      ...selectedPatient,
      celular: maskPhone(selectedPatient.celular),
      cpf: maskCPF(selectedPatient.cpf),
      observacoes: selectedPatient.observacoes || "",
      etapas: normalizeSteps(selectedPatient.etapas),
    });
    setConfirmDelete(false);
  }, [selectedPatient]);

  const currentStepLabel = useMemo(() => getCurrentStepLabel(editing), [editing]);
  const nextStepLabel = useMemo(() => getNextStepLabel(editing), [editing]);
  const progress = useMemo(() => progressPercent(editing.etapas, editing.exige_nf), [editing]);

  const total = rows.length;
  const withNF = rows.filter((r) => r.exige_nf).length;
  const completed = rows.filter((r) => isComplete(r)).length;

  function openRow(row: Patient) {
    setSelectedId(row.id);
    setDrawerOpen(true);
    setMsg(null);
    setConfirmDelete(false);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setMsg(null);
    setConfirmDelete(false);
  }

  function setField<K extends keyof Patient>(key: K, value: Patient[K]) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  function setStep(key: StepKey, checked: boolean) {
    setEditing((prev) => ({
      ...prev,
      etapas: {
        ...prev.etapas,
        [key]: checked,
      },
    }));
  }

  function validate() {
    if (!String(editing.nome_completo || "").trim()) return "Informe o nome completo.";
    if (digitsOnly(editing.cpf).length !== 11) return "CPF inválido. Informe 11 dígitos.";
    if (digitsOnly(editing.celular).length < 10) return "Celular inválido.";
    return null;
  }

  async function savePatient() {
    const err = validate();
    if (err) return setMsg({ type: "err", text: err });
    if (!editing.id) return setMsg({ type: "err", text: "Paciente não encontrado." });

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pacientes/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: String(editing.nome_completo || "").trim(),
          celular: digitsOnly(editing.celular),
          cpf: digitsOnly(editing.cpf),
          exige_nf: editing.exige_nf,
          observacoes: String(editing.observacoes || "").trim() || null,
          etapas: editing.etapas,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao atualizar paciente.");

      const updated = {
        ...data.item,
        etapas: normalizeSteps(data.item?.etapas),
      } as Patient;

      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedId(updated.id);
      setEditing({
        ...updated,
        celular: maskPhone(updated.celular),
        cpf: maskCPF(updated.cpf),
        observacoes: updated.observacoes || "",
      });
      setMsg({ type: "ok", text: "Paciente atualizado com sucesso." });
    } catch (error: unknown) {
      setMsg({ type: "err", text: getErrorMessage(error, "Erro ao atualizar paciente.") });
    } finally {
      setSaving(false);
    }
  }

  async function deletePatient() {
    if (!selectedPatient?.id) {
      setMsg({ type: "err", text: "Paciente não encontrado para exclusão." });
      return;
    }

    setDeleting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pacientes/${selectedPatient.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir paciente.");

      setRows((prev) => {
        const nextRows = prev.filter((row) => row.id !== selectedPatient.id);
        setSelectedId(nextRows[0]?.id ?? null);
        if (!nextRows.length) {
          setEditing(emptyPatient());
        }
        return nextRows;
      });

      setConfirmDelete(false);
      setDrawerOpen(false);
      setMsg(null);
    } catch (error: unknown) {
      setMsg({ type: "err", text: getErrorMessage(error, "Erro ao excluir paciente.") });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        <div
          className={cx(UI.header, "p-4 sm:p-5 rounded-2xl")}
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Base de pacientes
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Consulte a base operacional de pacientes, filtre a lista e abra o painel lateral para atualizar
                dados cadastrais, observações e andamento do fluxo.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill active>Total: {total}</Pill>
                <Pill>Concluídos: {completed}</Pill>
                <Pill>Com NF: {withNF}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Pill>{loading ? "Atualizando base…" : `${filteredRows.length} registro(s)`}</Pill>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div
            className={cx(UI.section, "p-3 sm:p-4 rounded-2xl")}
            style={{ borderColor: T.border, background: T.card }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className={UI.sectionTitle} style={{ color: T.text }}>
                  Lista de pacientes
                </div>
                <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                  No celular, os registros aparecem em cartões para facilitar toque, leitura e edição.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8">
                <label className={UI.label} style={{ color: T.text2 }}>
                  Buscar por nome, CPF ou celular
                </label>
                <div className="relative mt-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={cx(UI.input, "pl-10")}
                    style={{ borderColor: T.border }}
                    placeholder="Pesquisar paciente"
                  />
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: T.text3 }}
                  />
                </div>
              </div>

              <div className="lg:col-span-4">
                <label className={UI.label} style={{ color: T.text2 }}>
                  Etapa atual
                </label>
                <div className="mt-1">
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className={UI.select}
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
              </div>
            </div>

            <div className="mt-4 sm:hidden space-y-3">
              {loading ? (
                <div
                  className="px-4 py-10 text-center text-sm rounded-2xl border"
                  style={{ color: T.text3, borderColor: T.border, background: T.cardSoft }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando pacientes…
                  </span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div
                  className="px-4 py-10 text-center text-sm rounded-2xl border"
                  style={{ color: T.text3, borderColor: T.border, background: T.cardSoft }}
                >
                  Nenhum paciente encontrado para os filtros aplicados.
                </div>
              ) : (
                filteredRows.map((row) => {
                  const selected = row.id === selectedId;
                  const stepLabel = getCurrentStepLabel(row);
                  const nextLabel = getNextStepLabel(row);
                  const rowProgress = progressPercent(row.etapas, row.exige_nf);

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => openRow(row)}
                      className="w-full text-left rounded-2xl border p-4 transition active:scale-[0.995]"
                      style={{
                        borderColor: selected ? "rgba(186, 163, 145, 0.45)" : T.border,
                        background: selected ? T.accentSoft : T.card,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                          style={{ borderColor: T.border, background: T.cardSoft }}
                        >
                          <UserRound className="w-4 h-4" style={{ color: selected ? T.accent : T.text3 }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                {row.nome_completo}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Pill active={selected}>{stepLabel}</Pill>
                                <Pill>{row.exige_nf ? "NF aplicável" : "Sem NF"}</Pill>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: T.text3 }} />
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <FieldInfo label="Celular" value={maskPhone(row.celular)} />
                            <FieldInfo label="CPF" value={maskCPF(row.cpf)} />
                            <FieldInfo label="Próxima etapa" value={nextLabel} />
                            <FieldInfo label="Cadastro" value={formatDate(row.created_at)} />
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                                Progresso
                              </div>
                              <div className="text-[11px] font-medium" style={{ color: T.text2 }}>
                                {rowProgress}%
                              </div>
                            </div>
                            <div
                              className="mt-2 h-2 rounded-full overflow-hidden"
                              style={{ background: "rgba(17,24,39,0.08)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${rowProgress}%`, background: T.accent2 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div
              className="mt-4 hidden sm:block overflow-hidden rounded-2xl border"
              style={{ borderColor: T.border }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-separate border-spacing-0">
                  <thead>
                    <tr style={{ background: T.cardSoft }}>
                      {[
                        "Paciente",
                        "Celular",
                        "CPF",
                        "Etapa atual",
                        "Próxima etapa",
                        "Progresso",
                        "Cadastro",
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
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: T.text3 }}>
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Carregando pacientes…
                          </span>
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: T.text3 }}>
                          Nenhum paciente encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const selected = row.id === selectedId;
                        const stepLabel = getCurrentStepLabel(row);
                        const nextLabel = getNextStepLabel(row);
                        const rowProgress = progressPercent(row.etapas, row.exige_nf);
                        return (
                          <tr
                            key={row.id}
                            onClick={() => openRow(row)}
                            className="cursor-pointer transition-colors"
                            style={{ background: selected ? T.accentSoft : T.card }}
                          >
                            <td className="px-4 py-3 border-b align-middle" style={{ borderColor: T.border }}>
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                                  style={{
                                    borderColor: selected ? "rgba(186, 163, 145, 0.45)" : T.border,
                                    background: T.cardSoft,
                                  }}
                                >
                                  <UserRound
                                    className="w-4 h-4"
                                    style={{ color: selected ? T.accent : T.text3 }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate" style={{ color: T.text }}>
                                    {row.nome_completo}
                                  </div>
                                  <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                    {row.exige_nf ? "NF aplicável" : "Sem NF"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              className="px-4 py-3 border-b text-sm"
                              style={{ borderColor: T.border, color: T.text2 }}
                            >
                              {maskPhone(row.celular)}
                            </td>
                            <td
                              className="px-4 py-3 border-b text-sm"
                              style={{ borderColor: T.border, color: T.text2 }}
                            >
                              {maskCPF(row.cpf)}
                            </td>
                            <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                              <Pill active={selected}>{stepLabel}</Pill>
                            </td>
                            <td
                              className="px-4 py-3 border-b text-sm"
                              style={{ borderColor: T.border, color: T.text2 }}
                            >
                              {nextLabel}
                            </td>
                            <td className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                              <div className="min-w-[140px]">
                                <div
                                  className="h-2 rounded-full overflow-hidden"
                                  style={{ background: "rgba(17,24,39,0.08)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${rowProgress}%`, background: T.accent2 }}
                                  />
                                </div>
                                <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                                  {rowProgress}%
                                </div>
                              </div>
                            </td>
                            <td
                              className="px-4 py-3 border-b text-sm"
                              style={{ borderColor: T.border, color: T.text2 }}
                            >
                              {formatDate(row.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl flex items-center justify-center p-5 sm:p-6"
          style={{ background: T.accent }}
        >
          <Image src="/logo2.png" alt="BD Odontologia" width={70} height={70} priority />
        </div>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-40 transition-opacity duration-200",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(11,18,32,0.32)" }}
        onClick={closeDrawer}
      />

      <aside
        className={cx(
          "fixed inset-y-0 right-0 z-50 w-full sm:max-w-[640px] border-l shadow-2xl transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ background: T.bg, borderColor: T.borderStrong, height: "100dvh" }}
      >
        <div className="h-full flex flex-col">
          <div
            className="border-b px-4 sm:px-5 bg-white sticky "
            style={{ borderColor: T.border, paddingTop: "calc(env(safe-area-inset-top) + 16px)", paddingBottom: 16 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight" style={{ color: T.text }}>
                  Ficha do paciente
                </div>
                <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
                  Atualize dados cadastrais, observações e andamento do fluxo de atendimento.
                </div>
                {/* <div className="mt-3 flex flex-wrap gap-2">
                  <Pill active>{currentStepLabel}</Pill>
                  <Pill>Próxima etapa: {nextStepLabel}</Pill>
                  <Pill>Progresso: {progress}%</Pill>
                </div> */}
              </div>

              <button
                onClick={closeDrawer}
                className="inline-flex items-center justify-center w-11 h-11 border rounded-xl transition shrink-0"
                style={{ borderColor: T.border, background: T.card }}
                aria-label="Fechar painel"
                type="button"
              >
                <X className="w-4 h-4" style={{ color: T.text2 }} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 pb-32 sm:pb-6">
            {!selectedPatient ? (
              <div className="space-y-4">
                <div className="h-full flex items-center justify-center text-sm" style={{ color: T.text3 }}>
                  Selecione um paciente na lista.
                </div>
                <MsgBox m={msg} />
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={cx(UI.section, "p-4 rounded-2xl")}
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={UI.sectionTitle} style={{ color: T.text }}>
                        Resumo do registro
                      </div>
                      <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                        Consulte rapidamente o paciente selecionado.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: T.text3 }} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className="p-3 border rounded-xl"
                      style={{ borderColor: T.border, background: T.cardSoft }}
                    >
                      <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                        Etapa atual
                      </div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: T.accent }}>
                        {currentStepLabel}
                      </div>
                    </div>
                    <div
                      className="p-3 border rounded-xl"
                      style={{ borderColor: T.border, background: T.cardSoft }}
                    >
                      <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                        Próxima etapa
                      </div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: T.text }}>
                        {nextStepLabel}
                      </div>
                    </div>
                    <div
                      className="p-3 border rounded-xl sm:col-span-2"
                      style={{ borderColor: T.border, background: T.cardSoft }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                          Progresso do fluxo
                        </div>
                        <div className="text-xs font-medium" style={{ color: T.text2 }}>
                          {progress}%
                        </div>
                      </div>
                      <div
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ background: "rgba(17,24,39,0.08)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: T.accent2 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cx(UI.section, "p-4 rounded-2xl")}
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={UI.sectionTitle} style={{ color: T.text }}>
                        Dados do paciente
                      </div>
                      <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                        Campos editáveis para atualização cadastral.
                      </div>
                    </div>
                    <FileText className="w-4 h-4" style={{ color: T.text3 }} />
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Nome completo
                      </label>
                      <div className="relative mt-1">
                        <input
                          value={editing.nome_completo}
                          onChange={(e) => setField("nome_completo", e.target.value)}
                          className={cx(UI.input, "pl-10")}
                          style={{ borderColor: T.border }}
                          placeholder="Digite o nome completo"
                        />
                        <UserRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: T.text3 }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={UI.label} style={{ color: T.text2 }}>
                          Número de celular
                        </label>
                        <div className="relative mt-1">
                          <input
                            value={editing.celular}
                            onChange={(e) => setField("celular", maskPhone(e.target.value))}
                            className={cx(UI.input, "pl-10")}
                            style={{ borderColor: T.border }}
                            placeholder="(11) 99999-9999"
                            inputMode="tel"
                          />
                          <Phone
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: T.text3 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={UI.label} style={{ color: T.text2 }}>
                          CPF
                        </label>
                        <div className="relative mt-1">
                          <input
                            value={editing.cpf}
                            onChange={(e) => setField("cpf", maskCPF(e.target.value))}
                            className={cx(UI.input, "pl-10")}
                            style={{ borderColor: T.border }}
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                          <IdCard
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: T.text3 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-xl" style={{ borderColor: T.border, background: T.mutedBg }}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editing.exige_nf}
                          onChange={(e) => setField("exige_nf", e.target.checked)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-[11px] font-medium" style={{ color: T.text2 }}>
                            Exigir entrega de NF
                          </div>
                          <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
                            Ative esta opção quando a etapa de nota fiscal for aplicável ao paciente.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div
                  className={cx(UI.section, "p-4 rounded-2xl")}
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={UI.sectionTitle} style={{ color: T.text }}>
                        Etapas do fluxo
                      </div>
                      <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                        Atualize manualmente as etapas concluídas do atendimento.
                      </div>
                    </div>
                    <ClipboardList className="w-4 h-4" style={{ color: T.text3 }} />
                  </div>

                  <div className="mt-4 grid gap-3">
                    {PATIENT_STEPS.map((step) => {
                      const disabled = step.optional && !editing.exige_nf;
                      return (
                        <label
                          key={step.key}
                          className="flex items-start gap-3 p-3 border rounded-xl"
                          style={{
                            borderColor: T.border,
                            background: disabled
                              ? "rgba(17,24,39,0.03)"
                              : editing.etapas[step.key]
                                ? T.accentSoft
                                : T.cardSoft,
                            opacity: disabled ? 0.6 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={disabled ? false : editing.etapas[step.key]}
                            disabled={disabled}
                            onChange={(e) => setStep(step.key, e.target.checked)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium" style={{ color: T.text }}>
                              {step.label}
                            </div>
                            <div className="mt-1 text-xs leading-5" style={{ color: T.text3 }}>
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

                <div
                  className={cx(UI.section, "p-4 rounded-2xl")}
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Observações
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Registre informações complementares sobre o paciente.
                  </div>

                  <textarea
                    value={editing.observacoes || ""}
                    onChange={(e) => setField("observacoes", e.target.value)}
                    className={cx(UI.textarea, "mt-4")}
                    style={{ borderColor: T.border }}
                    placeholder="Pendências, orientações, detalhes do atendimento ou observações gerais..."
                  />
                </div>

                {confirmDelete && (
                  <div
                    className={cx(UI.section, "p-4 rounded-2xl")}
                    style={{
                      borderColor: "rgba(127, 29, 29, 0.12)",
                      background: "rgba(127, 29, 29, 0.025)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: "rgba(127, 29, 29, 0.12)",
                          background: "rgba(127, 29, 29, 0.04)",
                        }}
                      >
                        <AlertTriangle className="w-4 h-4" style={{ color: "rgba(127, 29, 29, 0.78)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold" style={{ color: T.text }}>
                          Excluir registro
                        </div>
                        <div className="mt-1 text-xs leading-5" style={{ color: T.text2 }}>
                          O paciente <strong>{selectedPatient.nome_completo}</strong> será removido da base de forma
                          permanente.
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Btn tone="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting || saving}>
                            Cancelar
                          </Btn>
                          <Btn tone="subtleDanger" onClick={deletePatient} loading={deleting} disabled={saving}>
                            <Trash2 className="w-4 h-4" />
                            Excluir agora
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <MsgBox m={msg} />
              </div>
            )}
          </div>

          <div
            className="border-t bg-white px-4 sm:px-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0"
            style={{
              borderColor: T.border,
              paddingTop: 16,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <div className="w-full sm:w-auto">
              {selectedPatient && !confirmDelete && (
                <Btn
                  tone="subtleDanger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving || deleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir registro
                </Btn>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
              <Btn tone="secondary" onClick={closeDrawer} disabled={saving || deleting} className="w-full sm:w-auto">
                Fechar
              </Btn>
              <Btn
                tone="primary"
                onClick={savePatient}
                disabled={!selectedPatient || saving || deleting}
                loading={saving}
                className="w-full sm:w-auto"
              >
                Salvar alterações
              </Btn>
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 3px ${T.accentRing} !important;
        }
      `}</style>
    </section>
  );
}
