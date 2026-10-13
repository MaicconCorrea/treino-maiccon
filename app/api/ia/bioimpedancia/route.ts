import { NextResponse } from "next/server";
import { iaConfigurada, lerLaudo } from "@/lib/ia";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!iaConfigurada()) return NextResponse.json({ erro: "Chave da Claude API não configurada no servidor." }, { status: 503 });
  const { arquivo } = (await request.json()) as { arquivo?: { data: string; media_type: string } };
  if (!arquivo?.data) return NextResponse.json({ erro: "Envie o laudo." }, { status: 400 });
  try {
    return NextResponse.json(await lerLaudo(arquivo));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: (e as Error).message || "Falha na leitura." }, { status: 500 });
  }
}
