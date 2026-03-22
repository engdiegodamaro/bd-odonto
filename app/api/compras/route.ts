// app/api/financeiro/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = "financial";

const CLIENTES = ["INEER", "KAMAI", "ÉLIS"] as const;
type Cliente = (typeof CLIENTES)[number];

const FORMAS_PAG = ["NOTA FISCAL", "PIX", "NOTA DE DEBITO", "CAJU"] as const;
type FormaPag = (typeof FORMAS_PAG)[number];

const STATUS_LIST = ["PENDENTE APROVAÇÃO", "APROVADO", "REPROVADO"] as const;
type Status = (typeof STATUS_LIST)[number];

function canon(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normText(v: any) {
  if (v === "" || v === undefined) return null;
  if (v === null) return null;
  return String(v).trim();
}

function normUpper(v: any) {
  const s = normText(v);
  return s ? s.toUpperCase() : null;
}

function toNumOrNull(v: any) {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function toBoolImpacto(v: any): boolean | null {
  if (v === "" || v === undefined || v === null) return null;
  const c = canon(String(v));
  if (c === "SIM" || c === "TRUE" || c === "1") return true;
  if (c === "NAO" || c === "NÃO" || c === "FALSE" || c === "0") return false;
  return null;
}

function normCliente(v: any): Cliente | null {
  const c = canon(String(v ?? ""));
  if (c === "INEER") return "INEER";
  if (c === "KAMAI") return "KAMAI";
  if (c === "ELIS" || c === "ÉLIS") return "ÉLIS";
  return null;
}

function normFormaPag(v: any): FormaPag | null {
  const c = canon(String(v ?? ""));
  if (c === "NOTA FISCAL") return "NOTA FISCAL";
  if (c === "PIX") return "PIX";
  if (c === "NOTA DE DEBITO" || c === "NOTA DE DÉBITO") return "NOTA DE DEBITO";
  if (c === "CAJU") return "CAJU";
  return null;
}

function normStatus(v: any): Status | null {
  if (v === "" || v === undefined || v === null) return null;
  const c = canon(String(v));
  if (c === "PENDENTE APROVACAO") return "PENDENTE APROVAÇÃO";
  if (c === "APROVADO") return "APROVADO";
  if (c === "REPROVADO") return "REPROVADO";
  return null;
}

// GET /api/financeiro?limit=10&offset=0&cliente=INEER&usina=RBB&start=YYYY-MM-DD&end=YYYY-MM-DD&status_cliente=...&status_aya=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 12), 1), 50);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  const cliente = searchParams.get("cliente");
  const usina = searchParams.get("usina");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const status_cliente = searchParams.get("status_cliente");
  const status_aya = searchParams.get("status_aya");

  let q = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (cliente) {
    const c = normCliente(cliente);
    if (!c) return NextResponse.json({ error: "cliente inválido" }, { status: 400 });
    q = q.eq("cliente", c);
  }

  if (usina) q = q.ilike("usina", `%${String(usina).trim()}%`);

  if (start) q = q.gte("data", start);
  if (end) q = q.lte("data", end);

  if (status_cliente) {
    const sc = normStatus(status_cliente);
    if (!sc) return NextResponse.json({ error: "status_cliente inválido" }, { status: 400 });
    q = q.eq("status_cliente", sc);
  }
  if (status_aya) {
    const sa = normStatus(status_aya);
    if (!sa) return NextResponse.json({ error: "status_aya inválido" }, { status: 400 });
    q = q.eq("status_aya", sa);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rows: data ?? [] });
}

// POST /api/financeiro  (status_* NÃO vem do front — entra PENDENTE APROVAÇÃO automaticamente)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const data = normText(body.data);
  const cliente = normCliente(body.cliente);
  const usina = normUpper(body.usina);
  const impacto = toBoolImpacto(body.impacto);
  const servico = normText(body.servico);
  const valor = toNumOrNull(body.valor);
  const forma_de_pag = normFormaPag(body.forma_de_pag);
  const nota_fiscal = normText(body.nota_fiscal);
  const bdi = toNumOrNull(body.bdi);

  if (!data) return NextResponse.json({ error: "data é obrigatória" }, { status: 400 });
  if (!cliente) return NextResponse.json({ error: "cliente inválido (INEER/KAMAI/ÉLIS)" }, { status: 400 });
  if (!usina) return NextResponse.json({ error: "usina é obrigatória" }, { status: 400 });
  if (impacto === null) return NextResponse.json({ error: "impacto inválido (SIM/NÃO)" }, { status: 400 });
  if (!servico) return NextResponse.json({ error: "servico é obrigatório" }, { status: 400 });
  if (valor === null) return NextResponse.json({ error: "valor inválido" }, { status: 400 });
  if (!forma_de_pag) return NextResponse.json({ error: "forma_de_pag inválida" }, { status: 400 });

  // 🔒 status não pode vir do cadastro
  const payload = {
    data,
    cliente,
    usina,
    impacto: impacto ? "SIM" : "NÃO", // se sua coluna é text
    servico,
    valor,
    forma_de_pag,
    nota_fiscal,
    bdi,
    status_cliente: "REEMBOLSO PENDENTE" as Status,
    status_aya: "PENDENTE APROVAÇÃO" as Status,
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, row: inserted });
}
