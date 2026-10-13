// Semana atual (especificação, seção 4). Índice = Date.getDay() (0 = domingo).
export type Atividade = { tipo: "musculacao" | "pilates" | "muaythai" | "corrida" | "descanso"; nome: string; obs?: string };

export const SEMANA: { curto: string; longo: string; atividades: Atividade[] }[] = [
  { curto: "Dom", longo: "Domingo", atividades: [{ tipo: "descanso", nome: "Descanso" }] },
  {
    curto: "Seg",
    longo: "Segunda",
    atividades: [
      { tipo: "musculacao", nome: "Musculação A", obs: "Perna mais pesada da semana" },
      { tipo: "pilates", nome: "Pilates", obs: "Depois da musculação, ou 2h antes" },
    ],
  },
  {
    curto: "Ter",
    longo: "Terça",
    atividades: [
      { tipo: "muaythai", nome: "Muay thai" },
      { tipo: "corrida", nome: "Corrida leve", obs: "Opcional, de manhã" },
    ],
  },
  {
    curto: "Qua",
    longo: "Quarta",
    atividades: [
      { tipo: "musculacao", nome: "Musculação B" },
      { tipo: "pilates", nome: "Pilates", obs: "Depois da musculação, ou 2h antes" },
    ],
  },
  { curto: "Qui", longo: "Quinta", atividades: [{ tipo: "muaythai", nome: "Muay thai" }] },
  {
    curto: "Sex",
    longo: "Sexta",
    atividades: [
      { tipo: "musculacao", nome: "Musculação C", obs: "Abdômen só hoje" },
      { tipo: "corrida", nome: "Corrida moderada", obs: "Depois da musculação, ou 6h de intervalo" },
    ],
  },
  { curto: "Sáb", longo: "Sábado", atividades: [{ tipo: "corrida", nome: "Corrida longa", obs: "Ritmo leve" }] },
];

// Dia da semana no fuso de São Paulo (o servidor da Vercel roda em UTC)
export function hojeSP(): { dow: number; dataLonga: string } {
  const now = new Date();
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(now);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  const dataLonga = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
  }).format(now);
  return { dow, dataLonga };
}
