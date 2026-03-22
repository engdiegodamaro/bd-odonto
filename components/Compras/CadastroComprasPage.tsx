"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

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
  mutedBg: "rgba(17, 24, 39, 0.035)",

  accent: "#115923",
  accent2: "#2E7B41",
  accentSoft: "rgba(17, 89, 35, 0.08)",
  accentRing: "rgba(17, 89, 35, 0.18)",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#065F46",

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
    "w-full min-h-[92px] px-3 py-2 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
  select:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
} as const;

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
          <span>Processando…</span>
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

function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function todayISO() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** converte "R$ 1.234,56" -> 1234.56 */
function brlStringToNumber(s: string) {
  const raw = String(s || "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** formata número para "R$ 1.234,56" */
function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** mantém o input “bonitinho” (aceita só dígitos e vírgula/ponto) e formata em BRL */
function normalizeBRLInput(raw: string) {
  const s = String(raw || "");
  // deixa só números
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return "";
  const cents = Number(digits);
  const value = cents / 100;
  return formatBRL(value);
}

/* =========================================================
   AUTOCOMPLETE USINA (igual seu padrão)
========================================================= */

function UsinaAutocomplete({
  value,
  onChange,
  options,
  loading,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v) return options;
    return options.filter((u) => u.toLowerCase().includes(v));
  }, [value, options]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [open, filtered.length]);

  return (
    <div ref={ref} className={cx("relative", className)}>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const sel = filtered[highlight];
              if (sel) {
                onChange(sel);
                setOpen(false);
              }
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className={cx(UI.input, "pr-9 rounded-md")}
          placeholder={placeholder}
          autoComplete="off"
          style={{ borderColor: T.border, color: T.text, boxShadow: "none" }}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
          <Search className="w-4 h-4" />
        </div>
      </div>

      {open && (
        <div
          className="absolute z-40 mt-1 w-full max-h-64 overflow-auto border bg-white shadow-sm rounded-md"
          style={{ borderColor: T.border }}
        >
          {loading && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Carregando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Nenhuma usina
            </div>
          )}

          {!loading &&
            filtered.map((u, i) => (
              <button
                key={u}
                type="button"
                onMouseDown={() => {
                  onChange(u);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                style={{
                  borderColor: "rgba(17,24,39,0.06)",
                  background: i === highlight ? T.accentSoft : "transparent",
                  color: i === highlight ? T.accent : T.text2,
                  fontWeight: i === highlight ? 600 : 400,
                }}
              >
                {u}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ComprasCadastroPage() {
  return <ComprasCadastro />;
}

function ComprasCadastro() {
  const CLIENTES = ["INEER", "KAMAI", "ÉLIS", "INTERNO"] as const;
  const FORMAS = ["NOTA FISCAL", "PIX", "NOTA DE DÉBITO", "CAJU"] as const;

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);

  const [form, setForm] = useState(() => ({
    data: todayISO(),
    cliente: "",
    usina: "",
    servico: "",
    impacto: "NÃO" as "SIM" | "NÃO",
    forma_de_pag: "",
    valor_brl: "", // exibido "R$ 0,00"
    bdi: "", // opcional
  }));

  useEffect(() => {
    let alive = true;
    (async () => {
      setUsinasLoading(true);
      try {
        // se você já tem endpoint de usinas, reaproveita:
        const res = await fetch("/api/acionamentos/usinas", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;

        const raw = Array.isArray(data?.usinas) ? data.usinas : [];
        const list = raw
          .map((x: any) => clampUpper(String(x || "")))
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b));

        if (alive) setUsinasList(list);
      } finally {
        if (alive) setUsinasLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setField = (k: keyof typeof form, v: string) => {
    setForm((p) => {
      if (k === "usina") return { ...p, usina: clampUpper(v) };
      return { ...p, [k]: v };
    });
  };

  const validate = () => {
    if (!isIsoDate(form.data)) return "Data inválida.";
    if (!form.cliente) return "centro de custo é obrigatório.";
    if (!clampUpper(form.usina)) return "Usina é obrigatória.";
    if (!String(form.servico || "").trim()) return "Serviço é obrigatório.";
    if (!form.forma_de_pag) return "Forma de pagamento é obrigatória.";

    const valor = brlStringToNumber(form.valor_brl);
    if (valor === null || valor <= 0) return "Valor inválido (informe um valor maior que zero).";

    // bdi opcional, mas se preencher tem que ser número
    if (String(form.bdi || "").trim()) {
      const n = Number(String(form.bdi).replace(",", "."));
      if (!Number.isFinite(n)) return "BDI inválido.";
    }

    return null;
  };

  const submit = async () => {
    setMsg(null);
    const err = validate();
    if (err) return setMsg({ type: "err", text: err });

    setLoading(true);
    try {
      const valor = brlStringToNumber(form.valor_brl)!;
      const bdi = String(form.bdi || "").trim()
        ? Number(String(form.bdi).replace(",", "."))
        : null;

      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: form.data,
          cliente: form.cliente,
          usina: clampUpper(form.usina),
          servico: String(form.servico || "").trim(),
          impacto: form.impacto, // "SIM" | "NÃO"
          forma_de_pag: form.forma_de_pag, // NOTA FISCAL / PIX / NOTA DE DÉBITO / CAJU
          valor, // numeric
          bdi, // numeric | null
          // 🔒 automáticos (não cadastra no form)
          status_cliente: "Pendente Aprovação",
          status_aya: "Pendente Aprovação",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ type: "err", text: data?.error || "Erro ao salvar compra" });

      setMsg({ type: "ok", text: "Compra cadastrada com sucesso ✅" });

      setForm((p) => ({
        ...p,
        usina: "",
        servico: "",
        impacto: "NÃO",
        forma_de_pag: "",
        valor_brl: "",
        bdi: "",
      }));
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Cadastro
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Cadastre compras por usina com <span style={{ color: T.text2, fontWeight: 600 }}>cliente</span>,{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>valor</span> e{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>forma de pagamento</span>. Status entram automaticamente como{" "}
                <span style={{ color: T.accent, fontWeight: 700 }}>Pendente Aprovação</span>.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Data: {brDate(form.data)}</Pill>
                <Pill>Usina: {form.usina ? clampUpper(form.usina) : "Não selecionada"}</Pill>
                <Pill>Centro de Custos: {form.cliente || "—"}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Pill>{loading ? "Processando…" : "Pronto"}</Pill>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* BASE */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Dados base
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Obrigatórios para salvar.
                  </div>
                </div>
                <Pill>{usinasLoading ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setField("data", e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  />
                </div>

                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Centro de Custo
                  </label>
                  <select
                    value={form.cliente}
                    onChange={(e) => setField("cliente", e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Selecione…</option>
                    {CLIENTES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative z-40">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Usina
                  </label>
                  <div className="mt-1">
                    <UsinaAutocomplete
                      value={form.usina}
                      onChange={(v) => setField("usina", v)}
                      options={usinasList}
                      loading={usinasLoading}
                      placeholder="Buscar usina…"
                    />
                  </div>
                </div>

                <div className="p-3 border rounded-md" style={{ borderColor: T.border, background: T.mutedBg }}>
                  <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                    Status (automático)
                  </div>
                  <div className="mt-2 grid gap-1 text-xs" style={{ color: T.text2 }}>
                    <div>
                      • Cliente: <span style={{ color: T.accent, fontWeight: 700 }}>Pendente Aprovação</span>
                    </div>
                    <div>
                      • AYA: <span style={{ color: T.accent, fontWeight: 700 }}>Pendente Aprovação</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <main className="lg:col-span-8 xl:col-span-9">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Dados da compra
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Valor em moeda (R$), impacto SIM/NÃO e forma de pagamento.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Serviço
                  </label>
                  <input
                    value={form.servico}
                    onChange={(e) => setField("servico", e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    placeholder="Ex: Cabo CC 6mm, roçagem, inversor, mão de obra…"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Impacto
                  </label>
                  <select
                    value={form.impacto}
                    onChange={(e) => setField("impacto", e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    BDI (opcional)
                  </label>
                  <input
                    value={form.bdi}
                    onChange={(e) => setField("bdi", e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    placeholder="Ex: 22,5"
                    inputMode="decimal"
                  />
                  <div className={cx(UI.help, "mt-1")} style={{ color: T.text3 }}>
                    Pode usar vírgula ou ponto.
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Forma de pagamento
                  </label>
                  <select
                    value={form.forma_de_pag}
                    onChange={(e) => setField("forma_de_pag", e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Selecione…</option>
                    {FORMAS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-6">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Valor (R$)
                  </label>
                  <input
                    value={form.valor_brl}
                    onChange={(e) => {
                      const formatted = normalizeBRLInput(e.target.value);
                      setField("valor_brl", formatted);
                    }}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    placeholder="R$ 0,00"
                    inputMode="numeric"
                  />
                  <div className={cx(UI.help, "mt-1")} style={{ color: T.text3 }}>
                    Digite números (ex.: 123456 → R$ 1.234,56).
                  </div>
                </div>

                <div className="lg:col-span-12 flex items-center justify-end gap-3 flex-wrap mt-2">
                  <Btn tone="primary" onClick={submit} disabled={loading} loading={loading}>
                    Salvar compra
                  </Btn>
                </div>

                <div className="lg:col-span-12">
                  <MsgBox m={msg} />
                </div>
              </div>
            </div>
          </main>
        </div>
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
