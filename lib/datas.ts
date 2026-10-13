// Datas sempre no fuso de São Paulo, no formato ISO (AAAA-MM-DD)
const TZ = "America/Sao_Paulo";

export function hojeISO(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// Aritmética de datas ISO sem fuso (meio-dia UTC evita virada de dia)
export function isoToDate(iso: string): Date {
  return new Date(iso + "T12:00:00Z");
}
export function addDias(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diaSemana(iso: string): number {
  return isoToDate(iso).getUTCDay();
}
// Segunda-feira da semana da data
export function inicioSemana(iso: string): string {
  const dow = diaSemana(iso);
  return addDias(iso, dow === 0 ? -6 : 1 - dow);
}
export function diasDaSemana(iso: string): string[] {
  const seg = inicioSemana(iso);
  return Array.from({ length: 7 }, (_, i) => addDias(seg, i));
}
export function diasEntre(a: string, b: string): number {
  return Math.round((isoToDate(b).getTime() - isoToDate(a).getTime()) / 86400000);
}

export function fmtCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
export function fmtLonga(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(isoToDate(iso));
}
export function fmtDataCompleta(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDuracao(s: number | null | undefined): string {
  if (!s) return "–";
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
export function fmtPace(segKm: number | null | undefined): string {
  if (!segKm || !isFinite(segKm)) return "–";
  const m = Math.floor(segKm / 60), s = Math.round(segKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}
export function fmtNum(n: number | null | undefined, casas = 0): string {
  if (n == null || isNaN(Number(n))) return "–";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
