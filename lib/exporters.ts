// lib/exporters.ts

export type DriveRow = {
  id: string;

  // base
  data: string; // YYYY-MM-DD
  semana?: string | null;
  usina: string;

  // cadastro
  cliente?: string | null;
  equipamento?: string | null;
  alarme?: string | null;

  // novos campos
  motivo_mobilizacao?: string | null;
  problema_identificado?: string | null;
  solucao_imediata?: string | null;
  solucao_definitiva?: string | null;
  ss?: number | null;

  created_at?: string | null;
};

const escapeCsv = (v: any) => {
  const s = (v ?? "").toString();
  return `"${s.replaceAll('"', '""')}"`;
};

export function toCsv(rows: DriveRow[]) {
  const headers = [
    "USINA",
    "DATA",
    "SEMANA",
    "CLIENTE",
    "EQUIPAMENTO",
    "ALARME",
    "SS",
    "MOTIVO_MOBILIZACAO",
    "PROBLEMA_IDENTIFICADO",
    "SOLUCAO_IMEDIATA",
    "SOLUCAO_DEFINITIVA",
  ];

  const lines = [
    headers.join(";"),
    ...(rows || []).map((r) =>
      [
        (r.usina ?? "").toString().toUpperCase(),
        r.data ?? "",
        r.semana ?? "",
        r.cliente ?? "",
        r.equipamento ?? "",
        r.alarme ?? "",
        r.ss ?? "",
        r.motivo_mobilizacao ?? "",
        r.problema_identificado ?? "",
        r.solucao_imediata ?? "",
        r.solucao_definitiva ?? "",
      ]
        .map(escapeCsv)
        .join(";")
    ),
  ];

  return lines.join("\n");
}

export function toReportText(rows: DriveRow[]) {
  if (!rows.length) return "Nenhum registro no período.";

  return rows
    .map((r) => {
      return `
Data: ${r.data ?? "-"}
Usina: ${r.usina ?? "-"}
OSS/SS:${r.ss ?? "-"}
Motivo da mobilização: ${r.motivo_mobilizacao ?? "-"}
Problema identificado: ${r.problema_identificado ?? "-"}
Solução imediata: ${r.solucao_imediata ?? "-"}
Solução definitiva: ${r.solucao_definitiva ?? "-"}
----------------------------------------
`.trim();
    })
    .join("\n\n");
}

export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
