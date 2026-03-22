// app/api/compras/dash/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = "financial";

export async function GET() {
  try {
    // 🔹 busca todos os registros incluindo id_compra
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        id,
        id_compra,
        data,
        cliente,
        usina,
        impacto,
        servico,
        valor,
        status_cliente,
        status_aya,
        forma_de_pag,
        bdi,
        nota_fiscal,
        created_at
      `)
      .order("data", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const rows = data ?? [];

    /* =========================================================
       1️⃣ RESUMO POR STATUS AYA
    ========================================================= */

    const resumoAya: Record<string, number> = {};

    for (const r of rows) {
      const key = r.status_aya || "SEM STATUS";
      resumoAya[key] = (resumoAya[key] || 0) + (Number(r.valor) || 0);
    }

    /* =========================================================
       2️⃣ RESUMO POR STATUS CLIENTE
    ========================================================= */

    const resumoCliente: Record<string, number> = {};

    for (const r of rows) {
      const key = r.status_cliente || "SEM STATUS";
      resumoCliente[key] =
        (resumoCliente[key] || 0) + (Number(r.valor) || 0);
    }

    /* =========================================================
       3️⃣ FLUXO MENSAL (agrupado por YYYY-MM)
    ========================================================= */

    const fluxoMensal: Record<string, number> = {};

    for (const r of rows) {
      if (!r.data) continue;

      const mes = String(r.data).slice(0, 7); // YYYY-MM
      fluxoMensal[mes] =
        (fluxoMensal[mes] || 0) + (Number(r.valor) || 0);
    }

    /* =========================================================
       4️⃣ TOTAL GERAL
    ========================================================= */

    const totalGeral = rows.reduce(
      (acc, r) => acc + (Number(r.valor) || 0),
      0
    );

    /* =========================================================
       RETORNO FINAL
    ========================================================= */

    return NextResponse.json({
      ok: true,
      total: totalGeral,
      resumo_status_aya: resumoAya,
      resumo_status_cliente: resumoCliente,
      fluxo_mensal: fluxoMensal,
      lista: rows, // 🔥 agora inclui id_compra
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
