import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function normalizeStats(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const login = String(body?.login ?? "").trim();
    const password = String(body?.password ?? "").trim();

    console.log("➡️ LOGIN:", login);
    console.log("➡️ SENHA DIGITADA:", password ? "[OK]" : "[VAZIA]");

    if (!login || !password) {
      return NextResponse.json(
        { error: "Informe login e senha" },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .select("id, client_id, client_name, login, access, stats, password, created_at")
      .eq("login", login)
      .single();

    console.log("➡️ CLIENT DO BANCO:", client);
    console.log("➡️ SUPABASE ERROR:", error);

    if (error || !client) {
      return NextResponse.json(
        { error: "Login não encontrado" },
        { status: 401 }
      );
    }

    console.log("➡️ SENHA NO BANCO:", client.password ? "[OK]" : "[VAZIA]");

    if (password !== client.password) {
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: client.id,
      client_id: client.client_id,
      empresa: client.client_name, // nome exibível
      login: client.login,
      access: client.access || [],
      stats: normalizeStats(client.stats),
      created_at: client.created_at,
    });
  } catch (err) {
    console.error("🔥 ERRO LOGIN:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
