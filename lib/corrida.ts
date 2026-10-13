// Plano de corrida: zonas, paces e geração da semana (normal ou retorno de lesão)
import { addDias, isoToDate } from "./datas";

// Zonas de pace do Strava em m/s (especificação, seção 3.3)
export const ZONAS_PACE: Record<string, [number, number]> = {
  Z1: [0, 2.551],
  Z2: [2.551, 2.963],
  Z3: [2.963, 3.301],
  Z4: [3.301, 3.526],
  Z5: [3.526, 3.751],
};
export const ZONAS_FC = "Z1 <125 · Z2 125–154 · Z3 155–169 · Z4 170–184 · Z5 ≥185";

const segKm = (ms: number) => 1000 / ms;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Faixa de pace por km de uma zona. Z1 não tem limite inferior: usa "mais lento que".
export function paceZona(z: keyof typeof ZONAS_PACE | string): string {
  const [lo, hi] = ZONAS_PACE[z];
  if (!lo) return `acima de ${mmss(segKm(hi))}/km`;
  return `${mmss(segKm(hi))}–${mmss(segKm(lo))}/km`;
}

export const PROVA = { nome: "30 km Hoka", data: "2026-11-08", incerta: true };

export type SessaoPlano = { data: string; tipo: string; distancia_km: number; pace_alvo: string; descricao: string };

// Distâncias do modo retorno por nível (liberado pelo fisio). [sexta, sábado, terça]
const RETORNO: [number, number, number][] = [
  [3, 4, 0], [4, 5, 0], [5, 6, 0], [5, 8, 4], [6, 10, 5], [6, 12, 6],
];

export function gerarSemana(segunda: string, retorno: boolean, nivel: number): SessaoPlano[] {
  const ter = addDias(segunda, 1), sex = addDias(segunda, 4), sab = addDias(segunda, 5);
  const z2 = paceZona("Z2");

  if (retorno) {
    const [kSex, kSab, kTer] = RETORNO[Math.min(Math.max(nivel, 1), 6) - 1];
    const out: SessaoPlano[] = [];
    if (kTer)
      out.push({ data: ter, tipo: "rodagem", distancia_km: kTer, pace_alvo: z2, descricao: "Rodagem leve de manhã, opcional. Pare se o joelho doer." });
    out.push({
      data: sex, tipo: "rodagem", distancia_km: kSex, pace_alvo: paceZona("Z1") + " a " + z2,
      descricao: nivel <= 1 ? "Alternar 4 min correndo e 1 min andando. Terreno plano." : "Rodagem leve e contínua, terreno plano.",
    });
    out.push({ data: sab, tipo: "longao", distancia_km: kSab, pace_alvo: z2, descricao: "Longão leve. Conversa possível o tempo todo." });
    return out;
  }

  // Semana normal: alterna tempo run e intervalado na sexta
  const semanaNum = Math.floor(isoToDate(segunda).getTime() / (7 * 86400000));
  const sexta: SessaoPlano =
    semanaNum % 2 === 0
      ? { data: sex, tipo: "tempo", distancia_km: 8, pace_alvo: paceZona("Z3"), descricao: "2 km leve + 4 km em Z3 + 2 km leve." }
      : { data: sex, tipo: "intervalado", distancia_km: 7, pace_alvo: paceZona("Z5"), descricao: "2 km leve + 6 × 800 m em Z4–Z5 com 400 m trotando + 1,5 km leve." };
  return [
    { data: ter, tipo: "rodagem", distancia_km: 6, pace_alvo: z2, descricao: "Rodagem leve de manhã, opcional." },
    sexta,
    { data: sab, tipo: "longao", distancia_km: 14, pace_alvo: z2, descricao: "Longão em Z2, ritmo de conversa." },
  ];
}

export const TIPO_CORRIDA: Record<string, string> = {
  rodagem: "Rodagem", intervalado: "Intervalado", tempo: "Tempo run", longao: "Longão",
};
