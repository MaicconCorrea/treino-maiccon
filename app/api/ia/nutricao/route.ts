import { NextResponse } from "next/server";
import { iaConfigurada, lerPrato, lerTabela } from "@/lib/ia";

export const maxDuration = 60;

type Corpo = {
  modo: "tabela" | "prato";
  imagem?: { data: string; media_type: string } | null;
  quantidade?: number;
  unidade?: string;
  descricao?: string;
  itens?: string;
};

export async function POST(request: Request) {
  if (!iaConfigurada()) return NextResponse.json({ erro: "Chave da Claude API não configurada no servidor." }, { status: 503 });
  const b = (await request.json()) as Corpo;
  try {
    if (b.modo === "tabela") {
      if (!b.imagem || !b.quantidade) return NextResponse.json({ erro: "Envie a foto e a quantidade." }, { status: 400 });
      return NextResponse.json(await lerTabela(b.imagem, b.quantidade, b.unidade || "g", b.descricao || ""));
    }
    if (!b.imagem && !b.itens) return NextResponse.json({ erro: "Envie a foto ou descreva os itens." }, { status: 400 });
    return NextResponse.json(await lerPrato(b.imagem || null, b.itens || ""));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: (e as Error).message || "Falha na leitura." }, { status: 500 });
  }
}
