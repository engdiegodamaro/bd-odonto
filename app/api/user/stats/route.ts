import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-back";

export async function POST(req: Request) {
  try {
    const { login, courseId } = await req.json();

    if (!login || !courseId) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const { data: user, error: fetchError } = await supabaseServer
      .from("clients")
      .select("stats")
      .eq("login", login)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const stats: string[] = user.stats ?? [];

    if (stats.includes(courseId)) {
      return NextResponse.json({ stats });
    }

    const updatedStats = [...stats, courseId];

    const { error: updateError } = await supabaseServer
      .from("clients")
      .update({ stats: updatedStats })
      .eq("login", login);

    if (updateError) {
      return NextResponse.json(
        { error: "Erro ao atualizar progresso" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats: updatedStats });
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado no servidor" },
      { status: 500 }
    );
  }
}
