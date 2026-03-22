// app/api/financeiro/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = "financial";

// ✅ sem validação de conteúdo (você pediu “só alterando”)
// - status_cliente: pode ser qualquer string (ou null)
// - status_aya: pode ser qualquer string (ou null)
// - nota_fiscal: pode ser qualquer string (ou null)
const normText = (v: any) => {
  if (v === "" || v === undefined || v === null) return null;
  return String(v).trim();
};

function assertUuid(id: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  if (!ok) throw new Error(`ID inválido: ${id}`);
}

type Ctx = { params: Promise<{ id: string }> }; // Next 15

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    assertUuid(id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  // ✅ atualiza SOMENTE o que vier no body (não mexe no resto)
  const payload: any = {};

  if (Object.prototype.hasOwnProperty.call(body, "status_cliente")) {
    payload.status_cliente = normText(body.status_cliente);
  }
  if (Object.prototype.hasOwnProperty.call(body, "status_aya")) {
    payload.status_aya = normText(body.status_aya);
  }
  if (Object.prototype.hasOwnProperty.call(body, "nota_fiscal")) {
    payload.nota_fiscal = normText(body.nota_fiscal);
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, row: data });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    assertUuid(id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
