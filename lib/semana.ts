// Semana padrão (especificação, seção 4) e catálogo de atividades para ajustar um dia.
import { diaSemana } from "./datas";

export type TipoAtividade = "musculacao" | "pilates" | "muaythai" | "corrida" | "descanso";
export type Atividade = { id: string; tipo: TipoAtividade; nome: string; obs?: string };

export const CATALOGO: Record<string, Atividade> = {
  musculacao: { id: "musculacao", tipo: "musculacao", nome: "Musculação", obs: "Próximo treino da fila" },
  pilates: { id: "pilates", tipo: "pilates", nome: "Pilates", obs: "Depois da musculação, ou 2h antes" },
  muaythai: { id: "muaythai", tipo: "muaythai", nome: "Muay thai" },
  corrida_leve: { id: "corrida_leve", tipo: "corrida", nome: "Corrida leve", obs: "Opcional, de manhã" },
  corrida_moderada: { id: "corrida_moderada", tipo: "corrida", nome: "Corrida moderada", obs: "Depois da musculação, ou 6h de intervalo" },
  corrida_longa: { id: "corrida_longa", tipo: "corrida", nome: "Corrida longa", obs: "Ritmo leve" },
  descanso: { id: "descanso", tipo: "descanso", nome: "Descanso" },
};

// Índice = getDay() (0 = domingo)
export const PADRAO: string[][] = [
  ["descanso"],
  ["musculacao", "pilates"],
  ["muaythai", "corrida_leve"],
  ["musculacao", "pilates"],
  ["muaythai"],
  ["musculacao", "corrida_moderada"],
  ["corrida_longa"],
];

export const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const CURTO_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function atividadesDoDia(iso: string, ajuste?: string[] | null): Atividade[] {
  const ids = ajuste && ajuste.length ? ajuste : PADRAO[diaSemana(iso)];
  return ids.map((id) => CATALOGO[id]).filter(Boolean);
}

