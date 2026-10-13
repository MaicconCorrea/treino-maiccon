// Programa Superior/Inferior (ajuste do treinador em 13/10/2026, ver docs/ajustes-treinador-2026-10-13.md).
// Fila contínua: Superior 1 → Inferior → Superior 2. Treino perdido não sai da fila.
// Exercícios reaproveitados do antigo Full Body ABC (docs/treino.html).
// Linha: [nome, séries, descanso, dica, (grupo | "opt" | {músculo: séries})...]
type Musc = Partial<Record<"q" | "p" | "c" | "pe" | "o" | "bi" | "tri", number>>;
type Linha = [string, string, string, string, ...(string | Musc)[]];
export type Dia = "U1" | "L" | "U2";
export type Local = "rua" | "predio";
export type Tempo = "80" | "50" | "50s";

export const ORDEM: Dia[] = ["U1", "L", "U2"];

// Versões completas (1h20). As de 50 min são derivadas abaixo.
const BASE: Record<Local, Record<Dia, Linha[]>> = {
  rua: {
    U1: [["Aquecimento", "5 min esteira ou bike", "", "Mais 2 × 15 rotação externa com elástico"],
      ["Supino reto com halteres", "4 × 8–10", "75s", "", { pe: 4 }],
      ["Puxada frontal aberta", "4 × 10", "75s", "", { c: 4 }],
      ["Remada unilateral com halter", "3 × 10 cada lado", "60s", "", { c: 3 }],
      ["Desenvolvimento com halteres", "3 × 10", "60s", "", { o: 3 }],
      ["Elevação lateral com halteres", "3 × 12–15", "45s", "", { o: 3 }],
      ["Rosca direta com barra", "3 × 10", "60s", "", { bi: 3 }],
      ["Tríceps corda no pulley", "3 × 12", "60s", "", { tri: 3 }]],
    L: [["Aquecimento", "5 min bike + mobilidade de quadril", "", "Bike em vez de esteira para poupar o joelho"],
      ["Leg press", "4 × 10", "90s", "Amplitude sem dor no joelho", { q: 4 }],
      ["Agachamento búlgaro com halteres", "3 × 10 cada perna", "75s", "Ou agachamento unilateral", { q: 3 }],
      ["Stiff com halteres", "3 × 10", "75s", "", { p: 3 }],
      ["Mesa flexora", "3 × 12", "60s", "", { p: 3 }],
      ["Elevação pélvica", "3 × 12", "60s", "Na máquina ou com barra apoiada no banco"],
      ["Panturrilha no leg press", "3 × 15", "45s", ""]],
    U2: [["Aquecimento", "5 min esteira ou bike", "", "Mais 2 × 15 pull-apart com elástico"],
      ["Supino inclinado na máquina", "4 × 10", "75s", "", { pe: 4 }],
      ["Remada baixa com triângulo", "4 × 10", "75s", "", { c: 4 }],
      ["Puxada frontal pegada neutra", "3 × 10", "60s", "", { c: 3 }],
      ["Crucifixo na máquina", "3 × 12", "60s", "", { pe: 3 }],
      ["Face pull na polia", "3 × 15", "45s", "Ombro posterior, ajuda na postura e no muay thai", { o: 3 }],
      ["Rosca martelo", "3 × 12", "60s", "", { bi: 3 }],
      ["Tríceps testa com halter", "3 × 10", "60s", "", { tri: 3 }],
      ["Abdominal deitado com perna estendida", "3 × máx.", "45s", "Abdômen só neste treino", "opt"]],
  },
  predio: {
    U1: [["Aquecimento no espaldar", "5 min", "", "Mobilidade de ombro + 2 × 15 rotação externa com elástico"],
      ["Supino reto com halteres no banco", "4 × 10–12", "75s", "", { pe: 4 }],
      ["Puxada frontal aberta (polia alta)", "4 × 10", "75s", "", { c: 4 }],
      ["Remada unilateral com halter no banco", "3 × 12 cada lado", "60s", "", { c: 3 }],
      ["Desenvolvimento com halteres sentado", "3 × 10–12", "60s", "", { o: 3 }],
      ["Elevação lateral com halteres", "3 × 15", "45s", "", { o: 3 }],
      ["Rosca direta com barra W", "3 × 10", "60s", "", { bi: 3 }],
      ["Tríceps corda na polia", "3 × 12", "60s", "", { tri: 3 }]],
    L: [["Aquecimento no espaldar", "5 min", "", "Mobilidade de quadril e tornozelo"],
      ["Agachamento goblet com halter", "4 × 12", "75s", "Halter mais pesado, segurando no peito", { q: 4 }],
      ["Agachamento búlgaro (pé no banco)", "3 × 10 cada perna", "75s", "Com halteres", { q: 3 }],
      ["Stiff com barra reta", "3 × 10", "75s", "Coloque anilhas na barra", { p: 3 }],
      ["Elevação pélvica com barra no banco", "3 × 12", "75s", "Costas apoiadas no banco", { p: 3 }],
      ["Cadeira extensora", "3 × 12", "60s", "Amplitude sem dor no joelho", { q: 3 }],
      ["Panturrilha em pé no step com halter", "3 × 15", "45s", ""]],
    U2: [["Aquecimento no espaldar", "5 min", "", "Mobilidade + 2 × 15 pull-apart com elástico"],
      ["Supino inclinado com halteres", "4 × 10–12", "75s", "Banco inclinado", { pe: 4 }],
      ["Remada baixa na polia (corda baixa)", "4 × 10", "75s", "", { c: 4 }],
      ["Puxada fechada (polia alta)", "3 × 10", "60s", "", { c: 3 }],
      ["Crucifixo com halteres no banco", "3 × 12", "60s", "", { pe: 3 }],
      ["Face pull com corda (polia alta)", "3 × 15", "45s", "Ombro posterior, ajuda na postura e no muay thai", { o: 3 }],
      ["Rosca martelo", "3 × 12", "60s", "", { bi: 3 }],
      ["Tríceps testa com barra W", "3 × 10", "60s", "", { tri: 3 }],
      ["Elevação de pernas no espaldar", "3 × máx.", "45s", "Abdômen só neste treino", "opt"]],
  },
};

const ehAquec = (l: Linha) => !/×/.test(l[1]);
const extras = (l: Linha) => l.slice(4) as (string | Musc)[];
const musc = (l: Linha) => extras(l).find((e) => typeof e === "object") as Musc | undefined;
const opt = (l: Linha) => extras(l).includes("opt");
const capSeries = (l: Linha, max: number): Linha => {
  const m = /^(\d+)\s*×(.*)$/.exec(l[1]);
  if (!m || +m[1] <= max) return l;
  const mu = musc(l);
  const novo = mu ? (Object.fromEntries(Object.entries(mu).map(([k, v]) => [k, Math.min(v!, max)])) as Musc) : undefined;
  return [l[0], `${max} ×${m[2]}`, l[2], l[3], ...extras(l).map((e) => (typeof e === "object" ? novo! : e))];
};
const aquec3 = (l: Linha): Linha => [l[0], l[1].replace(/^5 min/, "3 min"), "", l[3]];

// 50 min simples: um exercício por vez, só os principais, no máximo 3 séries
function simples(b: Linha[]): Linha[] {
  const [aq, ...resto] = b;
  return [aquec3(aq), ...resto.filter((l) => !opt(l)).slice(0, 6).map((l) => capSeries(l, 3))];
}

// 50 min conjugado: exercícios em pares (A1/A2, B1/B2...), o último bloco vira trio se sobrar um
function conjugado(b: Linha[]): Linha[] {
  const [aq, ...resto] = b;
  const ex = resto.filter((l) => !opt(l) && !ehAquec(l));
  const grupos: Linha[][] = [];
  for (let i = 0; i < ex.length; i += 2) grupos.push(ex.slice(i, i + 2));
  if (grupos.length > 1 && grupos[grupos.length - 1].length === 1) grupos[grupos.length - 2].push(grupos.pop()![0]);
  const out: Linha[] = [aquec3(aq)];
  grupos.forEach((g, gi) => {
    const L = String.fromCharCode(65 + gi);
    g.forEach((l, k) => {
      const ultimo = k === g.length - 1;
      const rest = ultimo ? (g.length > 2 ? "45s após o trio" : "60s após o par") : "";
      const mu = musc(l);
      out.push([l[0], l[1], rest, l[3], `${L}${k + 1}`, ...(mu ? [mu] : [])]);
    });
  });
  return out;
}

export const W: Record<Local, Record<Tempo, Record<Dia, Linha[]>>> = Object.fromEntries(
  (Object.keys(BASE) as Local[]).map((l) => [
    l,
    {
      "80": BASE[l],
      "50": Object.fromEntries(ORDEM.map((d) => [d, conjugado(BASE[l][d])])),
      "50s": Object.fromEntries(ORDEM.map((d) => [d, simples(BASE[l][d])])),
    },
  ]),
) as Record<Local, Record<Tempo, Record<Dia, Linha[]>>>;

export const DURNAME: Record<Tempo, string> = { "80": "1h20", "50": "50 min conjugado", "50s": "50 min simples" };
export const DAYNAME: Record<Dia, string> = { U1: "Superior 1", L: "Inferior (perna)", U2: "Superior 2" };
export const DAYSHORT: Record<string, string> = { U1: "Sup. 1", L: "Inferior", U2: "Sup. 2", A: "ABC · A", B: "ABC · B", C: "ABC · C" };
export const LOCNAME: Record<Local, string> = { rua: "Academia da rua", predio: "Academia do prédio" };
// Séries por semana no Full Body ABC antigo (1h20, academia da rua), para comparar
export const MUS: [keyof Musc, string, number][] = [
  ["q", "Quadríceps", 11], ["p", "Posterior de coxa", 6], ["c", "Costas", 18], ["pe", "Peito", 14],
  ["o", "Ombro", 12], ["bi", "Bíceps", 9], ["tri", "Tríceps", 9],
];

// Próximo da fila a partir do último treino feito
export function proximoDaFila(ultimo: string | null | undefined): Dia {
  const i = ORDEM.indexOf(ultimo as Dia);
  return i < 0 ? "U1" : ORDEM[(i + 1) % ORDEM.length];
}

export type Item = {
  name: string; sx: string; rest: string; tip: string; group: string | null; opt: boolean;
  mus: Musc | null; sets: number; restS: number; target: string;
};

export function parse(row: Linha): Item {
  const [name, sx, rest, tip, ...extra] = row;
  let group: string | null = null, op = false, mus: Musc | null = null;
  for (const e of extra) {
    if (e === "opt") op = true;
    else if (typeof e === "string") group = e;
    else if (e && typeof e === "object") mus = e;
  }
  return { name, sx, rest, tip, group, opt: op, mus, sets: setsOf(sx), restS: parseInt(rest) || 0, target: targetOf(sx) };
}
function setsOf(sx: string) { const m = /^(\d+)\s*×/.exec(sx); return m ? +m[1] : 0; }
function targetOf(sx: string) { const p = sx.split("×")[1] || ""; const m = /\d+(?:[–-]\d+)?/.exec(p); return m ? m[0] : "máx"; }
export function defReps(t: string) { const m = /(\d+)$/.exec(t); return m ? m[1] : ""; }
export function ytUrl(name: string) {
  const q = name.replace(/\s*\(.*?\)\s*/g, " ").trim() + " execução correta shorts";
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
}
export function itens(l: Local, t: Tempo, d: Dia): Item[] {
  return W[l][t][d].map(parse);
}
