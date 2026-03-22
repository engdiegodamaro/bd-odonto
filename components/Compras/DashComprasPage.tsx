// app/financeiro/visualizacao/page.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Eraser,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS (padrão)
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
  accentBorder: "rgba(17, 89, 35, 0.30)",

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
  header: "border bg-white min-w-0",
  section: "border bg-white min-w-0",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",

  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0",

  mono: "tabular-nums",
} as const;

/* =========================================================
   HOOK: MOBILE
========================================================= */
function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [maxWidth]);
  return isMobile;
}

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
    "whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)", color: "#fff" }
      : tone === "danger"
        ? {
          background: "rgba(239, 68, 68, 0.10)",
          borderColor: "rgba(239, 68, 68, 0.35)",
          color: T.errTx,
        }
        : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button
      className={cx(base, className)}
      disabled={disabled || loading}
      style={style}
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

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md",
        UI.mono
      )}
      style={{
        borderColor: T.border,
        background: tone === "accent" ? T.accentSoft : T.cardSoft,
        color: tone === "accent" ? T.accent : T.text2,
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
    <div className="text-sm px-3 py-2 border rounded-md" style={s}>
      {m.text}
    </div>
  );
}

function SectionHeader({
  title,
  hint,
  right,
  divider = true,
}: {
  title: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
  divider?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap px-4 py-3">
        <div className="min-w-0">
          <div className={UI.sectionTitle} style={{ color: T.text }}>
            {title}
          </div>
          {hint ? (
            <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : null}
        </div>
        {right}
      </div>

      {divider && (
        <div
          style={{
            height: 1,
            background: T.border,
            opacity: 0.8,
          }}
        />
      )}
    </>
  );
}

function MobileAccordion({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: T.border, background: T.cardSoft }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 border-b flex items-center justify-between gap-3 text-left"
        style={{ borderColor: "rgba(17,24,39,0.08)" }}
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: T.text }}>
            {title}
          </div>
          <div className="text-[11px]" style={{ color: T.text3 }}>
            {count} {count === 1 ? "registro" : "registros"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill>{count}</Pill>
          {open ? (
            <ChevronUp className="w-4 h-4" style={{ color: T.text3 }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: T.text3 }} />
          )}
        </div>
      </button>

      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */
function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
/* =========================================================
   PDF — PADRÃO EMPRESARIAL (AYA)
========================================================= */
const PDF_BRAND = {
  companyName: "AYA ENERGIA",
  reportTitle: "Relatório de Compras",
  green: [17, 89, 35] as [number, number, number], // #115923
  black: [11, 18, 32] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [244, 246, 248] as [number, number, number],
  borderGray: [209, 213, 219] as [number, number, number],
  logoUrl: "/logo-aya.png",
};

function brDateTimeNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = () => reject(new Error("Falha ao ler imagem"));
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageTypeFromDataUrl(d: string): "PNG" | "JPEG" {
  const s = String(d || "").toLowerCase();
  if (s.startsWith("data:image/jpeg") || s.startsWith("data:image/jpg")) return "JPEG";
  return "PNG";
}

// Desenha imagem SEM distorcer (contain)
function drawImageContain(opts: {
  doc: any;
  dataUrl: string;
  format: "PNG" | "JPEG";
  x: number;
  y: number;
  boxW: number;
  boxH: number;
}) {
  const { doc, dataUrl, format, x, y, boxW, boxH } = opts;
  const p = doc.getImageProperties(dataUrl);
  const iw = Number(p?.width || 1);
  const ih = Number(p?.height || 1);
  const scale = Math.min(boxW / iw, boxH / ih);
  const w = iw * scale;
  const h = ih * scale;
  const dx = x + (boxW - w) / 2;
  const dy = y + (boxH - h) / 2;
  doc.addImage(dataUrl, format, dx, dy, w, h, undefined, "FAST");
}
function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const toISO = (x: Date) => {
    const yy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  return { start: toISO(start), end: toISO(end) };
}
function formatBRL(n?: number | null) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const idx = Math.max(1, Math.min(12, Number(m))) - 1;
  return `${names[idx]} ${y}`;
}
function isoMonth(iso: string) {
  return String(iso || "").slice(0, 7);
}
function inRangeISO(d: string, start: string, end: string) {
  return d >= start && d <= end;
}
function includesLoose(hay?: string | null, needle?: string) {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return true;
  const h = String(hay || "").toLowerCase();
  return h.includes(n);
}
function fmtCompraId(v?: number | string | null) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `${String(n).padStart(4, "0")}`;
}
function isHttpUrl(s?: string | null) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function safeFileName(name: string) {
  return name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =========================================================
   TYPES
========================================================= */
type Row = {
  id: string;
  id_compra?: number | string | null;
  created_at?: string | null;
  data: string;
  cliente: string | null;
  usina: string | null;
  impacto: string | null;
  servico: string | null;
  valor: number | null;
  status_cliente: string | null;
  status_aya: string | null;
  forma_de_pag: string | null;
  bdi: number | null;
  nota_fiscal?: string | null;
};

type DashResponse = {
  ok: boolean;
  total?: number;
  resumo_status_aya?: Record<string, number>;
  resumo_status_cliente?: Record<string, number>;
  fluxo_mensal?: Record<string, number>;
  lista?: Row[];
  error?: string;
};

function canShowComprovante(r: Row) {
  return String(r.status_aya || "") === "PAGAMENTO EFETUADO" && isHttpUrl(r.nota_fiscal);
}

/* =========================================================
   AUTOCOMPLETE USINA
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
    <div ref={ref} className={cx("relative min-w-0", className)}>
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
                  fontWeight: i === highlight ? 700 : 500,
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
   NEXT PAGE EXPORT
========================================================= */
export default function Page() {
  return <ComprasDashPage />;
}

/* =========================================================
   PAGE
========================================================= */
export function ComprasDashPage() {
  const isMobile = useIsMobile(640);

  const CLIENTES = ["INEER", "KAMAI", "ÉLIS"] as const;
  const STATUS_AYA = ["PENDENTE APROVAÇÃO", "APROVADO", "PAGAMENTO EFETUADO", "REPROVADO", "CANCELADO"] as const;
  const STATUS_CLIENTE = ["REEMBOLSO PENDENTE", "REEMBOLSO EFETUADO"] as const;

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // filtros
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [periodPreset, setPeriodPreset] = useState<"thisMonth" | "lastMonth" | "last30" | "last7" | "today">("thisMonth");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [cliente, setCliente] = useState("");
  const [usina, setUsina] = useState("");
  const [statusAya, setStatusAya] = useState("");
  const [statusCliente, setStatusCliente] = useState("");
  const [searchText, setSearchText] = useState("");

  // usinas
  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);

  // dados
  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState<Row[]>([]);

  // paginação
  const limit = isMobile ? 8 : 14;
  const [page, setPage] = useState(1);

  // UI
  const [openAya, setOpenAya] = useState(true);
  const [openCliente, setOpenCliente] = useState(true);

  // MOBILE accordion state
  const [ayaOpenMap, setAyaOpenMap] = useState<Record<string, boolean>>({});
  const [cliOpenMap, setCliOpenMap] = useState<Record<string, boolean>>({});

  // export
  const [exporting, setExporting] = useState<"" | "xlsx" | "pdf">("");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const applyPreset = useCallback((p: typeof periodPreset) => {
    const now = new Date();
    const toISO = (x: Date) => {
      const yy = x.getFullYear();
      const mm = String(x.getMonth() + 1).padStart(2, "0");
      const dd = String(x.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    };

    if (p === "today") {
      const d = toISO(now);
      setStart(d);
      setEnd(d);
      return;
    }
    if (p === "thisMonth") {
      const mr = monthRangeISO(now);
      setStart(mr.start);
      setEnd(mr.end);
      return;
    }
    if (p === "lastMonth") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mr = monthRangeISO(d);
      setStart(mr.start);
      setEnd(mr.end);
      return;
    }
    if (p === "last7") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      setStart(toISO(s));
      setEnd(toISO(e));
      return;
    }
    if (p === "last30") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      setStart(toISO(s));
      setEnd(toISO(e));
      return;
    }
  }, []);

  useEffect(() => {
    applyPreset("thisMonth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidRange = useMemo(() => {
    const s = start ? new Date(`${start}T00:00:00`) : null;
    const e = end ? new Date(`${end}T00:00:00`) : null;
    if (!s || !e) return false;
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  const load = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/compras/dash", { method: "GET", cache: "no-store" });
      const data: DashResponse = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        setAllRows([]);
        return setMsg({ type: "err", text: data?.error || "Erro ao carregar dashboard." });
      }

      const list = Array.isArray(data?.lista) ? (data.lista as Row[]) : [];
      setAllRows(list);

      setUsinasLoading(true);
      const u = Array.from(new Set(list.map((r) => clampUpper(r.usina || "")).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      );
      setUsinasList(u);
      setUsinasLoading(false);
    } catch {
      setAllRows([]);
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // aplica filtros no FRONT
  const filteredRows = useMemo(() => {
    let r = allRows;

    if (start && end) r = r.filter((x) => x?.data && inRangeISO(String(x.data), start, end));
    if (cliente) r = r.filter((x) => String(x.cliente || "") === String(cliente));
    if (usina) r = r.filter((x) => includesLoose(x.usina, usina));
    if (statusAya) r = r.filter((x) => String(x.status_aya || "") === String(statusAya));
    if (statusCliente) r = r.filter((x) => String(x.status_cliente || "") === String(statusCliente));

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      r = r.filter((x) => {
        const blob = `${x.id_compra ?? ""} ${x.data ?? ""} ${x.usina ?? ""} ${x.cliente ?? ""} ${x.servico ?? ""} ${x.status_aya ?? ""} ${x.status_cliente ?? ""} ${x.forma_de_pag ?? ""} ${x.impacto ?? ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    return r;
  }, [allRows, start, end, cliente, usina, statusAya, statusCliente, searchText]);

  useEffect(() => {
    setPage(1);
  }, [start, end, cliente, usina, statusAya, statusCliente, searchText, limit]);

  const count = filteredRows.length;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * limit;
  const tableRows = useMemo(() => filteredRows.slice(offset, offset + limit), [filteredRows, offset, limit]);

  // fluxo mensal (conforme filtros)
  const monthSeries = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const r of filteredRows) {
      const v = Number(r.valor) || 0;
      const m = r.data ? isoMonth(r.data) : "";
      if (m) byMonth[m] = (byMonth[m] || 0) + v;
    }
    const entries = Object.entries(byMonth);
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const vals = entries.map(([, v]) => Number(v || 0));
    const max = Math.max(1, ...vals);
    return entries.map(([k, v]) => ({
      key: k,
      label: monthLabel(k),
      value: Number(v || 0),
      pct: (Number(v || 0) / max) * 100,
    }));
  }, [filteredRows]);

  const groupedAya = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const s of STATUS_AYA) map.set(s, []);
    map.set("OUTROS", []);
    for (const r of filteredRows) {
      const s = String(r.status_aya ?? "PENDENTE APROVAÇÃO");
      if (map.has(s)) map.get(s)!.push(r);
      else map.get("OUTROS")!.push(r);
    }
    return map;
  }, [filteredRows, STATUS_AYA]);

  const groupedCliente = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const s of STATUS_CLIENTE) map.set(s, []);
    map.set("OUTROS", []);
    for (const r of filteredRows) {
      const s = String(r.status_cliente ?? "REEMBOLSO PENDENTE");
      if (map.has(s)) map.get(s)!.push(r);
      else map.get("OUTROS")!.push(r);
    }
    return map;
  }, [filteredRows, STATUS_CLIENTE]);

  const exportRows = (scope: "filtered" | "page") => (scope === "filtered" ? filteredRows : tableRows);

  const exportBaseName = () => {
    const s = start || "inicio";
    const e = end || "fim";
    return safeFileName(`Relatorio_de_Compras_${s}-${e}`);
  };

  const toExportData = (rows: Row[]) =>
    rows.map((r) => ({
      "ID Compra": fmtCompraId(r.id_compra),
      Usina: r.usina ? clampUpper(r.usina) : "—",
      Data: brDate(r.data),
      Cliente: r.cliente || "—",
      "Serviço/Produto": r.servico || "—",
      Valor: r.valor ?? null,
      "Status AYA": r.status_aya || "—",
      "Status Cliente": r.status_cliente || "—",
      Pagamento: r.forma_de_pag || "—",
      Impacto: r.impacto || "—",
      "Nota/Comprovante": r.nota_fiscal || "",
    }));

  const exportExcel = useCallback(
    async (scope: "filtered" | "page" = "filtered") => {
      const rows = exportRows(scope);
      if (!rows.length) return setMsg({ type: "err", text: "Não há dados para exportar." });

      setExporting("xlsx");
      setMsg(null);

      try {
        const XLSXMod = await import("xlsx");
        const XLSX = (XLSXMod as any).default ?? XLSXMod;

        const data = toExportData(rows);
        const ws = XLSX.utils.json_to_sheet(data);

        ws["!cols"] = [
          { wch: 10 }, // ID
          { wch: 18 }, // Usina
          { wch: 12 }, // Data
          { wch: 12 }, // Cliente
          { wch: 42 }, // Serviço
          { wch: 14 }, // Valor
          { wch: 22 }, // Status AYA
          { wch: 18 }, // Status Cliente
          { wch: 16 }, // Pagamento
          { wch: 12 }, // Impacto
          { wch: 48 }, // Nota
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Compras");

        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([out], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const name = `${exportBaseName()}.xlsx`;
        downloadBlob(blob, name);

        setMsg({ type: "ok", text: `Exportado Excel (${scope === "filtered" ? "filtrado" : "página"}) ✅` });
      } catch {
        setMsg({ type: "err", text: "Falha ao exportar Excel." });
      } finally {
        setExporting("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRows, tableRows, start, end]
  );

  const exportPDF = useCallback(
    async (scope: "filtered" | "page" = "filtered") => {
      const rows = exportRows(scope);
      if (!rows.length) return setMsg({ type: "err", text: "Não há dados para exportar." });

      setExporting("pdf");
      setMsg(null);

      try {
        const { jsPDF } = await import("jspdf");
        const autoTableMod: any = await import("jspdf-autotable");
        const autoTable = autoTableMod.default || autoTableMod.autoTable || autoTableMod;

        // Logo
        const logoDataUrl = await fetchAsDataUrl(PDF_BRAND.logoUrl);

        // Igual ao padrão dos outros: A4 LANDSCAPE
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

        // @ts-ignore
        doc.setCharSpace?.(0);

        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        const HEADER_H = 64;
        const MARGIN_X = 30;

        const issuedAt = brDateTimeNow();

        const drawHeader = () => {
          doc.setFillColor(...PDF_BRAND.green);
          doc.rect(0, 0, pageW, HEADER_H, "F");

          // Logo (contain)
          const logoBoxW = 48;
          const logoBoxH = 48;
          const logoX = MARGIN_X;
          const logoY = (HEADER_H - logoBoxH) / 2;

          if (logoDataUrl) {
            const fmt = imageTypeFromDataUrl(logoDataUrl);
            drawImageContain({
              doc,
              dataUrl: logoDataUrl,
              format: fmt,
              x: logoX,
              y: logoY,
              boxW: logoBoxW,
              boxH: logoBoxH,
            });
          } else {
            // fallback discreto
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1);
            doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 8, 8, "S");
          }

          const textX = logoX + logoBoxW + 12;

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(PDF_BRAND.companyName, textX, 30);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(PDF_BRAND.reportTitle, textX, 46);

          // Emitido em (direita)
          doc.setFontSize(9);
          const rightText = `Emitido em: ${issuedAt}`;
          const rtW = doc.getTextWidth(rightText);
          doc.text(rightText, pageW - MARGIN_X - rtW, 30);
        };

        const drawFooter = () => {
          doc.setDrawColor(...PDF_BRAND.borderGray);
          doc.setLineWidth(1);
          doc.line(MARGIN_X, pageH - 26, pageW - MARGIN_X, pageH - 26);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...PDF_BRAND.gray);

          doc.text(`Período: ${brDate(start)} - ${brDate(end)}`, MARGIN_X, pageH - 12);

          // padrão dos outros: "Página X"
          const pageNum = doc.getNumberOfPages();
          const footerRight = `Página ${pageNum}`;
          const frW = doc.getTextWidth(footerRight);
          doc.text(footerRight, pageW - MARGIN_X - frW, pageH - 12);
        };

        drawHeader();

        const head = [[
          "ID",
          "Data",
          "Usina",
          "Cliente",
          "Serviço/Produto",
          "Status AYA",
          "Status Cliente",
          "Valor",
        ]];

        const body = rows.map((r) => ([
          fmtCompraId(r.id_compra),
          brDate(r.data),
          r.usina ? clampUpper(r.usina) : "—",
          r.cliente || "—",
          String(r.servico || "—"),
          String(r.status_aya || "—"),
          String(r.status_cliente || "—"),
          r.valor != null ? formatBRL(r.valor) : "—",
        ]));

        autoTable(doc, {
          head,
          body,
          startY: HEADER_H + 18,
          margin: { left: MARGIN_X, right: MARGIN_X, top: HEADER_H + 18, bottom: 34 },

          styles: {
            font: "helvetica",
            fontSize: 7.2,
            cellPadding: 4,
            overflow: "linebreak",
            textColor: PDF_BRAND.black,
            lineColor: PDF_BRAND.borderGray,
            lineWidth: 0.6,
            valign: "top",
          },

          headStyles: {
            fillColor: PDF_BRAND.green,
            textColor: 255,
            fontStyle: "bold",
            halign: "left",
          },

          alternateRowStyles: { fillColor: PDF_BRAND.lightGray },

          // A4 landscape: soma <= ~782 (842 - 60)
          columnStyles: {
            0: { cellWidth: 44 },  // ID
            1: { cellWidth: 56 },  // Data
            2: { cellWidth: 120 }, // Usina
            3: { cellWidth: 80 },  // Cliente
            4: { cellWidth: 230 }, // Serviço/Produto
            5: { cellWidth: 100 }, // Status AYA
            6: { cellWidth: 100 }, // Status Cliente
            7: { cellWidth: 52, halign: "right" }, // Valor
          },

          didDrawPage: () => {
            // @ts-ignore
            doc.setCharSpace?.(0);
            drawHeader();
            drawFooter();
          },
        });

        const name = `${exportBaseName()}.pdf`;
        doc.save(name);

        setMsg({ type: "ok", text: `Exportado PDF (${scope === "filtered" ? "filtrado" : "página"}) ✅` });
      } catch (e: any) {
        console.error("PDF export error:", e);
        setMsg({ type: "err", text: `Falha ao exportar PDF: ${String(e?.message || e)}` });
      } finally {
        setExporting("");
      }
    },
    [start, end, exportRows, exportBaseName]
  );

  const clearFilters = useCallback(() => {
    setCliente("");
    setUsina("");
    setStatusAya("");
    setStatusCliente("");
    setSearchText("");
    setPeriodPreset("thisMonth");
    applyPreset("thisMonth");
    setMsg(null);
  }, [applyPreset]);
  const GRID_COLS = "110px 130px 160px minmax(320px, 1fr) 220px 140px";
  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Painel de Compras
              </div>

              {/* <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Status AYA • Status do cliente • Fluxo mensal • Exportação (Excel/PDF)
              </div> */}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                <Pill>Cliente: {cliente || "Todos"}</Pill>
                <Pill>Usina: {usina ? clampUpper(usina) : "Todas"}</Pill>
                {/* <Pill tone="accent">{count} registros</Pill> */}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Btn tone="secondary" onClick={load} disabled={loading} className={cx(isMobile ? "h-9 px-3 text-xs" : "")}>
                <RefreshCw className="w-4 h-4" />
              </Btn>
            </div>
          </div>
        </div>

        {/* FILTROS (padronizado com SectionHeader) */}
        <div className={cx(UI.section, "mt-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <SectionHeader
            title="Filtros"
            hint={<>Ajusta e atualiza todas as seções (kanbans, fluxo e tabela).</>}
            right={
              <div className="flex items-center gap-2">
                <Btn
                  tone="secondary"
                  onClick={() => setFiltersOpen((p) => !p)}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                  title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                >
                  {filtersOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Btn>

                <Btn
                  tone="secondary"
                  onClick={clearFilters}
                  disabled={loading}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                  title="Limpar filtros"
                >
                  <Eraser className="w-4 h-4" />
                </Btn>
              </div>
            }
          />

          {filtersOpen && (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                {/* Período preset */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Período
                  </label>
                  <select
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    value={periodPreset}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setPeriodPreset(v);
                      applyPreset(v);
                    }}
                  >
                    <option value="today">Hoje</option>
                    <option value="thisMonth">Este mês</option>
                    <option value="lastMonth">Mês passado</option>
                    <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option>
                  </select>
                </div>

                {/* Datas */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Início
                  </label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md w-full appearance-auto")}
                    style={{ borderColor: T.border, WebkitAppearance: "auto" as any }}
                  />
                </div>

                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Fim
                  </label>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md w-full appearance-auto")}
                    style={{ borderColor: T.border, WebkitAppearance: "auto" as any }}
                  />
                </div>

                {/* Busca */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Busca (geral)
                  </label>
                  <div className="mt-1 relative min-w-0">
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className={cx(UI.input, "rounded-md pr-9")}
                      style={{ borderColor: T.border }}
                      placeholder="Ex: usina, serviço, status, id…"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Cliente
                  </label>
                  <select
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todos</option>
                    {CLIENTES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Usina */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Usina
                  </label>
                  <div className="mt-1 min-w-0">
                    <UsinaAutocomplete
                      value={usina}
                      onChange={setUsina}
                      options={usinasList}
                      loading={usinasLoading}
                      placeholder="Buscar usina…"
                    />
                  </div>
                </div>

                {/* Status AYA */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Status AYA
                  </label>
                  <select
                    value={statusAya}
                    onChange={(e) => setStatusAya(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todos</option>
                    {STATUS_AYA.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Cliente */}
                <div className="lg:col-span-3 min-w-0">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Status Cliente
                  </label>
                  <select
                    value={statusCliente}
                    onChange={(e) => setStatusCliente(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todos</option>
                    {STATUS_CLIENTE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-12">
                  {invalidRange && (
                    <div className="text-[11px]" style={{ color: T.errTx }}>
                      Data inicial maior que a final.
                    </div>
                  )}
                  <div className="mt-2">
                    <MsgBox m={msg} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <main className="mt-4 grid gap-4">
          {/* FLUXO MENSAL */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <SectionHeader
              title="Fluxo mensal"
              hint={<>Soma de valores por mês (conforme filtros).</>}
              
            />

            <div className="p-4 grid gap-2">
              {!monthSeries.length && (
                <div
                  className="border rounded-lg p-4 text-sm"
                  style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                >
                  Sem dados para o período.
                </div>
              )}

              {monthSeries.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <div className="w-20 sm:w-28 text-xs" style={{ color: T.text3 }}>
                    {m.label}
                  </div>

                  <div className="flex-1 border rounded-md overflow-hidden" style={{ borderColor: T.border, background: T.mutedBg }}>
                    <div
                      className="h-8"
                      style={{
                        width: `${Math.max(2, Math.min(100, m.pct))}%`,
                        background: "rgba(17, 89, 35, 0.75)",
                      }}
                    />
                  </div>

                  <div className={cx("w-24 sm:w-28 text-xs text-right", UI.mono)} style={{ color: T.text, fontWeight: 900 }}>
                    {formatBRL(m.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STATUS AYA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <SectionHeader
              title="Status AYA"
              hint={<>Separação por status interno (cards por coluna).</>}
              right={
                <div className="flex items-center gap-2">
                  {/* <Pill tone="accent">{count} registros</Pill> */}
                  <Btn
                    tone="secondary"
                    onClick={() => setOpenAya((p) => !p)}
                    className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    title={openAya ? "Ocultar" : "Mostrar"}
                  >
                    {openAya ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Btn>
                </div>
              }
            />

            {openAya && (
              <>
                {/* MOBILE: accordion */}
                <div className="sm:hidden p-4 grid gap-2">
                  {STATUS_AYA.map((s) => {
                    const items = groupedAya.get(s) || [];
                    const isOpen = ayaOpenMap[s] ?? (items.length > 0 && s === "PENDENTE APROVAÇÃO");

                    return (
                      <MobileAccordion
                        key={s}
                        title={s}
                        count={items.length}
                        open={!!isOpen}
                        onToggle={() =>
                          setAyaOpenMap((prev) => ({
                            ...prev,
                            [s]: !(prev[s] ?? (items.length > 0 && s === "PENDENTE APROVAÇÃO")),
                          }))
                        }
                      >
                        {items.length === 0 ? (
                          <div className="text-xs" style={{ color: T.text3 }}>
                            Sem itens.
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {items.slice(0, 50).map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold min-w-0 truncate" style={{ color: T.text }}>
                                    {r.usina ? clampUpper(r.usina) : "—"}
                                  </div>
                                  <span
                                    className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md"
                                    style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
                                    title="ID da compra"
                                  >
                                    {fmtCompraId(r.id_compra)}
                                  </span>
                                </div>

                                <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
                                  {brDate(r.data)} • {r.cliente || "—"} • {r.forma_de_pag || "—"}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill>Valor: {formatBRL(r.valor)}</Pill>
                                  <Pill>Impacto: {r.impacto || "-"}</Pill>
                                </div>

                                <div className="mt-2 text-[11px]" style={{ color: T.text2 }}>
                                  {r.servico || "—"}
                                </div>

                                {canShowComprovante(r) && (
                                  <a
                                    href={r.nota_fiscal!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                    style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir comprovante
                                  </a>
                                )}
                              </div>
                            ))}

                            {items.length > 50 && (
                              <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                                Mostrando 50 (use a tabela para ver tudo).
                              </div>
                            )}
                          </div>
                        )}
                      </MobileAccordion>
                    );
                  })}
                </div>

                {/* DESKTOP/TABLET: grid */}
                <div className="hidden sm:block p-4 overflow-x-auto">
                  <div className="min-w-[900px] grid grid-cols-5 gap-3">
                    {STATUS_AYA.map((s) => (
                      <div key={s} className="border rounded-lg" style={{ borderColor: T.border, background: T.cardSoft }}>
                        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                          <div className="text-xs font-semibold" style={{ color: T.text }}>
                            {s}
                          </div>
                          <Pill>{groupedAya.get(s)?.length || 0}</Pill>
                        </div>

                        <div className="p-3 grid gap-2 max-h-[360px] overflow-auto fin-scroll">
                          {(groupedAya.get(s) || []).slice(0, 100).map((r) => (
                            <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold min-w-0 truncate" style={{ color: T.text }}>
                                  {r.usina ? clampUpper(r.usina) : "—"}
                                </div>

                                <span
                                  className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md"
                                  style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
                                  title="ID da compra"
                                >
                                  {fmtCompraId(r.id_compra)}
                                </span>
                              </div>

                              <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
                                {brDate(r.data)} • {r.cliente || "—"} • {r.forma_de_pag || "—"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill>Valor: {formatBRL(r.valor)}</Pill>
                                <Pill>Impacto: {r.impacto || "-"}</Pill>
                              </div>
                              <div className="mt-2 text-[11px]" style={{ color: T.text2 }}>
                                {r.servico || "—"}
                              </div>

                              {canShowComprovante(r) && (
                                <a
                                  href={r.nota_fiscal!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                  style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Abrir comprovante
                                </a>
                              )}
                            </div>
                          ))}

                          {(groupedAya.get(s)?.length || 0) > 100 && (
                            <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                              Mostrando 100 (use a tabela para ver tudo).
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* STATUS CLIENTE */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <SectionHeader
              title="Status Cliente"
              hint={<>Separação por status de reembolso do cliente.</>}
              right={
                <div className="flex items-center gap-2">
                  {/* <Pill tone="accent">{count} registros</Pill> */}
                  <Btn
                    tone="secondary"
                    onClick={() => setOpenCliente((p) => !p)}
                    className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    title={openCliente ? "Ocultar" : "Mostrar"}
                  >
                    {openCliente ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Btn>
                </div>
              }
            />

            {openCliente && (
              <>
                {/* MOBILE accordion */}
                <div className="sm:hidden p-4 grid gap-2">
                  {STATUS_CLIENTE.map((s) => {
                    const items = groupedCliente.get(s) || [];
                    const isOpen = cliOpenMap[s] ?? (items.length > 0 && s === "REEMBOLSO PENDENTE");

                    return (
                      <MobileAccordion
                        key={s}
                        title={s}
                        count={items.length}
                        open={!!isOpen}
                        onToggle={() =>
                          setCliOpenMap((prev) => ({
                            ...prev,
                            [s]: !(prev[s] ?? (items.length > 0 && s === "REEMBOLSO PENDENTE")),
                          }))
                        }
                      >
                        {items.length === 0 ? (
                          <div className="text-xs" style={{ color: T.text3 }}>
                            Sem itens.
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {items.slice(0, 40).map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                  {r.usina ? clampUpper(r.usina) : "—"}
                                </div>
                                <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
                                  {brDate(r.data)} • {r.cliente || "—"} • {r.status_aya || "—"}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill>Valor: {formatBRL(r.valor)}</Pill>
                                  <Pill>Pagamento: {r.forma_de_pag || "-"}</Pill>
                                </div>

                                {canShowComprovante(r) && (
                                  <a
                                    href={r.nota_fiscal!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                    style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir comprovante
                                  </a>
                                )}
                              </div>
                            ))}

                            {items.length > 40 && (
                              <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                                Mostrando 40 (use a tabela para ver tudo).
                              </div>
                            )}
                          </div>
                        )}
                      </MobileAccordion>
                    );
                  })}
                </div>

                {/* DESKTOP/TABLET */}
                <div className="hidden sm:block p-4 overflow-x-auto">
                  <div className="min-w-[700px] grid grid-cols-2 gap-3">
                    {STATUS_CLIENTE.map((s) => (
                      <div key={s} className="border rounded-lg" style={{ borderColor: T.border, background: T.cardSoft }}>
                        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                          <div className="text-xs font-semibold" style={{ color: T.text }}>
                            {s}
                          </div>
                          <Pill>{groupedCliente.get(s)?.length || 0}</Pill>
                        </div>

                        <div className="p-3 grid gap-2 max-h-[320px] overflow-auto fin-scroll">
                          {(groupedCliente.get(s) || []).slice(0, 25).map((r) => (
                            <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                              <div className="text-xs font-semibold" style={{ color: T.text }}>
                                {r.usina ? clampUpper(r.usina) : "—"}
                              </div>
                              <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                                {brDate(r.data)} • {r.cliente || "—"} • {r.status_aya || "—"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill>Valor: {formatBRL(r.valor)}</Pill>
                                <Pill>Pagamento: {r.forma_de_pag || "-"}</Pill>
                              </div>

                              {canShowComprovante(r) && (
                                <a
                                  href={r.nota_fiscal!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                  style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Abrir comprovante
                                </a>
                              )}
                            </div>
                          ))}

                          {(groupedCliente.get(s)?.length || 0) > 25 && (
                            <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                              Mostrando 25 (use a tabela para ver tudo).
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* TABELA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <SectionHeader
              title="Lista de compras"
              hint={<>Exporta o conjunto filtrado (Excel/PDF).</>}
              right={
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Export dropdown */}
                  <div ref={exportRef} className="relative">
                    <Btn
                      tone="secondary"
                      disabled={loading || !count}
                      loading={exporting !== ""}
                      onClick={() => setExportOpen((v) => !v)}
                      className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                      aria-haspopup="menu"
                      aria-expanded={exportOpen}
                      title="Exportar"
                    >
                      <FileDown className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                    </Btn>

                    {exportOpen && exporting === "" && (
                      <div
                        className="absolute right-0 mt-2 w-52 border rounded-lg shadow-sm bg-white overflow-hidden z-50"
                        style={{ borderColor: T.border }}
                        role="menu"
                      >
                        <button
                          type="button"
                          disabled={loading || !count}
                          onClick={() => {
                            setExportOpen(false);
                            exportExcel("filtered");
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          style={{ color: T.text }}
                          role="menuitem"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Excel (.xlsx)
                        </button>

                        <div style={{ height: 1, background: "rgba(17,24,39,0.06)" }} />

                        <button
                          type="button"
                          disabled={loading || !count}
                          onClick={() => {
                            setExportOpen(false);
                            exportPDF("filtered");
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          style={{ color: T.text }}
                          role="menuitem"
                        >
                          <FileDown className="w-4 h-4" />
                          PDF (.pdf)
                        </button>



                      </div>
                    )}
                  </div>

                  <Btn
                    tone="secondary"
                    disabled={loading || pageSafe === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Btn>

                  <Btn
                    tone="secondary"
                    disabled={loading || pageSafe >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    title="Próxima"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Btn>
                </div>
              }
            />

            <div className="p-4">
              {!loading && tableRows.length === 0 && (
                <div
                  className="border rounded-lg p-4 text-sm"
                  style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                >
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              )}

              {tableRows.length > 0 && (
                <>
                  {/* MOBILE: cards */}
                  <div className="sm:hidden grid gap-2">
                    {tableRows.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold truncate" style={{ color: T.text }}>
                              {r.usina ? clampUpper(r.usina) : "—"}
                            </div>
                            <div className="mt-0.5 text-[11px] truncate" style={{ color: T.text3 }}>
                              {brDate(r.data)} • {r.cliente || "—"} • ID {fmtCompraId(r.id_compra)}
                            </div>
                          </div>

                          <div className={cx("text-sm font-extrabold whitespace-nowrap", UI.mono)} style={{ color: T.text }}>
                            {formatBRL(r.valor)}
                          </div>
                        </div>

                        <div className="mt-2 text-[12px]" style={{ color: T.text2 }}>
                          {r.servico || "—"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill>AYA: {r.status_aya || "—"}</Pill>
                          <Pill>CLIENTE: {r.status_cliente || "—"}</Pill>
                          <Pill>Pag.: {r.forma_de_pag || "-"}</Pill>
                        </div>

                        {canShowComprovante(r) && (
                          <a
                            href={r.nota_fiscal!}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                            style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir comprovante
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP: tabela */}
                  <div className="hidden sm:block border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
                    <div className="overflow-x-auto">
                      <div className="min-w-[1120px]">
                        <div
                          className="px-3 py-2 text-[11px] font-semibold border-b sticky top-0 z-10"
                          style={{
                            borderColor: T.border,
                            background: "rgba(251,252,253,0.92)",
                            backdropFilter: "blur(6px)",
                            color: T.text2,
                            display: "grid",
                            gridTemplateColumns:
                              "110px 130px 160px minmax(320px, 1fr) 180px 140px",
                            gap: 0,
                          }}
                        >
                          <div>ID</div>
                          <div>Data</div>
                          <div>Usina</div>
                          <div>Serviço/Produto</div>
                          <div>Status (AYA/CLIENTE)</div>
                          <div style={{ textAlign: "right" }}>Valor</div>
                        </div>

                        {tableRows.map((r) => (
                          <div
                            key={r.id}
                            className="px-3 py-2 text-sm border-b last:border-b-0 hover:bg-black/[0.02] transition"
                            style={{
                              borderColor: "rgba(17,24,39,0.08)",
                              background: T.card,
                              display: "grid",
                              gridTemplateColumns:
                                "110px 130px 160px minmax(320px, 1fr) 180px 140px",
                              gap: 0,
                              alignItems: "start",
                            }}
                          >
                            <div className={UI.mono} style={{ color: T.text }}>
                              {fmtCompraId(r.id_compra)}
                            </div>

                            <div className={UI.mono} style={{ color: T.text2 }}>
                              {brDate(r.data)}
                            </div>

                            <div className="truncate font-semibold" style={{ color: T.text }}>
                              {r.usina ? clampUpper(r.usina) : "—"}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate" style={{ color: T.text2 }}>
                                {r.servico || "—"}
                              </div>
                              <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
                                {r.cliente || "—"} • {r.forma_de_pag || "—"} • Impacto: {r.impacto || "-"}
                              </div>

                              {canShowComprovante(r) && (
                                <a
                                  href={r.nota_fiscal!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold underline"
                                  style={{ color: T.accent }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Abrir comprovante
                                </a>
                              )}
                            </div>

                            <div className="text-[11px]" style={{ color: T.text2 }}>
                              <div className="truncate">AYA: {r.status_aya || "—"}</div>
                              <div className="truncate" style={{ color: T.text3 }}>
                                CLIENTE: {r.status_cliente || "—"}
                              </div>
                            </div>

                            <div className={cx("text-right font-extrabold", UI.mono)} style={{ color: T.text }}>
                              {formatBRL(r.valor)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-3 text-[11px]" style={{ color: T.text3 }}>
                Total (filtro): <span className={UI.mono}>{count}</span> • Página{" "}
                <span className={UI.mono}>
                  {pageSafe}/{totalPages}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* focus ring + scrollbar */}
      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }

        input[type="date"] {
          -webkit-appearance: auto !important;
          appearance: auto !important;
        }

        .fin-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .fin-scroll::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.06);
          border-radius: 999px;
        }
        .fin-scroll::-webkit-scrollbar-thumb {
          background: rgba(17, 24, 39, 0.28);
          border-radius: 999px;
        }
        .fin-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(17, 24, 39, 0.38);
        }
      `}</style>
    </section>
  );
}