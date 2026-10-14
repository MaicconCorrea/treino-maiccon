// Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/Unicamp. Valores por 100 g.
// Dados convertidos do PDF oficial pelo projeto aberto raulfdm/taco-api.
export type Taco = { id: number; nome: string; categoria: string; kcal: number; prot: number; carb: number; gord: number; fibra: number };

let cache: Taco[] | null = null;

export async function carregarTaco(): Promise<Taco[]> {
  if (cache) return cache;
  const dados = (await import("./taco.json")).default as [number, string, string, number, number, number, number, number][];
  cache = dados.map(([id, nome, categoria, kcal, prot, carb, gord, fibra]) => ({ id, nome, categoria, kcal, prot, carb, gord, fibra }));
  return cache;
}

export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Todas as palavras digitadas precisam aparecer no nome. Começo do nome e nomes curtos vêm primeiro.
export function buscar(lista: Taco[], termo: string, max = 12): Taco[] {
  const palavras = normalizar(termo).split(/[\s,]+/).filter((p) => p.length > 1);
  if (!palavras.length) return [];
  return lista
    .map((t) => {
      const n = normalizar(t.nome);
      if (!palavras.every((p) => n.includes(p))) return null;
      const primeiro = n.split(",")[0].trim();
      const inicio = primeiro === palavras[0] ? 0 : n.startsWith(palavras[0]) ? 50 : 100;
      // Cru perde posição, exceto em frutas (onde cru é o jeito comum de comer)
      const cru = /\bcru[ao]?s?\b/.test(n) && !/frutas/i.test(t.categoria) ? 20 : 0;
      const pontos = inicio + cru + n.length / 10;
      return { t, pontos };
    })
    .filter((x): x is { t: Taco; pontos: number } => !!x)
    .sort((a, b) => a.pontos - b.pontos)
    .slice(0, max)
    .map((x) => x.t);
}

export function porGramas(t: Pick<Taco, "kcal" | "prot" | "carb" | "gord">, g: number) {
  const k = g / 100;
  return {
    kcal: Math.round(t.kcal * k),
    prot: Math.round(t.prot * k * 10) / 10,
    carb: Math.round(t.carb * k * 10) / 10,
    gord: Math.round(t.gord * k * 10) / 10,
  };
}
