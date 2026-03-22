import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-back";

export async function POST(req: Request) {
  try {
    const { login } = await req.json();

    if (!login) {
      return NextResponse.json({ error: "Login inválido" }, { status: 400 });
    }

    // zera stats no banco (array vazio)
    const { data, error } = await supabaseServer
      .from("clients")
      .update({ stats: [] })
      .eq("login", String(login).trim())
      .select("stats")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stats: data?.stats ?? [] });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
