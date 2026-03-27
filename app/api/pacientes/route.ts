import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PATIENT_STEPS = [
  { key: "agendamento", optional: false },
  { key: "solicitacao_exames", optional: false },
  { key: "exames_realizados", optional: false },
  { key: "planejamento_apresentado", optional: false },
  { key: "planejamento_aprovado", optional: false },
  { key: "execucao_agendada", optional: false },
  { key: "contrato_formalizado", optional: false },
  { key: "termo_conclusao", optional: false },
  { key: "entrega_nf", optional: true },
  { key: "retornos_programados", optional: false },
] as const;

type StepKey = (typeof PATIENT_STEPS)[number]["key"];
type PatientSteps = Record<StepKey, boolean>;

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function emptySteps(): PatientSteps {
  return {
    agendamento: false,
    solicitacao_exames: false,
    exames_realizados: false,
    planejamento_apresentado: false,
    planejamento_aprovado: false,
    execucao_agendada: false,
    contrato_formalizado: false,
    termo_conclusao: false,
    entrega_nf: false,
    retornos_programados: false,
  };
}

function normalizeSteps(input: unknown): PatientSteps {
  const base = emptySteps();
  if (!input || typeof input !== "object") return base;

  for (const key of Object.keys(base) as StepKey[]) {
    base[key] = Boolean((input as Record<string, unknown>)[key]);
  }

  return base;
}

function deriveCurrentStep(steps: PatientSteps, exigeNF: boolean): StepKey | null {
  let current: StepKey | null = null;

  for (const step of PATIENT_STEPS) {
    if (step.optional && !exigeNF) continue;
    if (steps[step.key]) current = step.key;
  }

  return current;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.trim() || "";
  const etapaAtual = searchParams.get("etapa_atual")?.trim() || "";
  const concluido = searchParams.get("concluido") === "true";

  let query = supabaseAdmin
    .from("pacientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (etapaAtual) {
    query = query.eq("etapa_atual", etapaAtual);
  }

  if (q) {
    query = query.or(
      `nome_completo.ilike.%${q}%,cpf.ilike.%${q}%,celular.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const filtered =
    concluido
      ? (data || []).filter((row) => {
          const steps = normalizeSteps(row.etapas);
          const relevant = PATIENT_STEPS.filter(
            (s) => !s.optional || row.exige_nf
          );
          return relevant.every((s) => steps[s.key]);
        })
      : (data || []);

  return NextResponse.json({ ok: true, items: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nome_completo = String(body?.nome_completo || "").trim();
    const celular = digitsOnly(body?.celular || "");
    const cpf = digitsOnly(body?.cpf || "");
    const exige_nf = Boolean(body?.exige_nf);
    const etapas = normalizeSteps(body?.etapas);
    const observacoes =
      body?.observacoes == null ? null : String(body.observacoes).trim();

    if (!nome_completo) {
      return NextResponse.json(
        { ok: false, error: "Informe o nome completo." },
        { status: 400 }
      );
    }

    if (cpf.length > 0 && cpf.length !== 11) {
      return NextResponse.json(
        { ok: false, error: "CPF inválido. Informe 11 dígitos." },
        { status: 400 }
      );
    }

    if (celular.length > 0 && celular.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Celular inválido." },
        { status: 400 }
      );
    }

    const etapa_atual = deriveCurrentStep(etapas, exige_nf);

    const { data, error } = await supabaseAdmin
      .from("pacientes")
      .insert({
        nome_completo,
        celular: celular || null,
        cpf: cpf || null,
        exige_nf,
        etapas,
        etapa_atual,
        observacoes,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido." },
      { status: 400 }
    );
  }
}