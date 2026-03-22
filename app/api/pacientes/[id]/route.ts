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

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, item: data });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json();

    const payload: Record<string, unknown> = {};

    if ("nome_completo" in body) {
      const nome = String(body.nome_completo || "").trim();
      if (!nome) {
        return NextResponse.json(
          { ok: false, error: "Nome completo inválido." },
          { status: 400 }
        );
      }
      payload.nome_completo = nome;
    }

    if ("celular" in body) {
      const celular = digitsOnly(body.celular || "");
      if (celular.length < 10) {
        return NextResponse.json(
          { ok: false, error: "Celular inválido." },
          { status: 400 }
        );
      }
      payload.celular = celular;
    }

    if ("cpf" in body) {
      const cpf = digitsOnly(body.cpf || "");
      if (cpf.length !== 11) {
        return NextResponse.json(
          { ok: false, error: "CPF inválido." },
          { status: 400 }
        );
      }
      payload.cpf = cpf;
    }

    if ("exige_nf" in body) {
      payload.exige_nf = Boolean(body.exige_nf);
    }

    if ("observacoes" in body) {
      payload.observacoes =
        body.observacoes == null ? null : String(body.observacoes).trim();
    }

    if ("etapas" in body) {
      payload.etapas = normalizeSteps(body.etapas);
    }

    if ("etapas" in body || "exige_nf" in body) {
      const { data: current, error: currentError } = await supabaseAdmin
        .from("pacientes")
        .select("etapas, exige_nf")
        .eq("id", id)
        .single();

      if (currentError || !current) {
        return NextResponse.json(
          { ok: false, error: "Paciente não encontrado." },
          { status: 404 }
        );
      }

      const etapas = ("etapas" in payload
        ? payload.etapas
        : normalizeSteps(current.etapas)) as PatientSteps;

      const exige_nf = ("exige_nf" in payload
        ? Boolean(payload.exige_nf)
        : Boolean(current.exige_nf));

      payload.etapa_atual = deriveCurrentStep(etapas, exige_nf);
    }

    const { data, error } = await supabaseAdmin
      .from("pacientes")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { error } = await supabaseAdmin
    .from("pacientes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}