import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-back";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("clients")
      .select("client_name")
      .order("client_name");

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar empresas" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado no servidor" },
      { status: 500 }
    );
  }
}
