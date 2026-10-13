// Gráfico de linha simples em SVG (evolução por data)
import { fmtCurta } from "@/lib/datas";

export default function Grafico({ pontos, unidade, casas = 1 }: { pontos: { data: string; v: number }[]; unidade: string; casas?: number }) {
  if (pontos.length < 2) return <p className="note">Poucos dados para o gráfico.</p>;
  const W = 600, H = 220, pl = 44, pr = 16, pt = 16, pb = 28;
  const t = pontos.map((p) => new Date(p.data + "T12:00:00Z").getTime());
  const tmin = Math.min(...t), tmax = Math.max(...t);
  const vs = pontos.map((p) => p.v);
  let vmin = Math.min(...vs), vmax = Math.max(...vs);
  const folga = (vmax - vmin) * 0.12 || 1;
  vmin -= folga; vmax += folga;
  const x = (ti: number) => pl + ((ti - tmin) / (tmax - tmin || 1)) * (W - pl - pr);
  const y = (v: number) => pt + (1 - (v - vmin) / (vmax - vmin)) * (H - pt - pb);
  const d = pontos.map((p, i) => `${i ? "L" : "M"}${x(t[i]).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const ticks = [vmin + folga, (vmin + vmax) / 2, vmax - folga];
  const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: casas });
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução em ${unidade}`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 6} y={y(v) + 4} textAnchor="end">{fmt(v)}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
      {pontos.map((p, i) => (
        <g key={p.data}>
          <circle cx={x(t[i])} cy={y(p.v)} r={4} fill="var(--accent)" />
          {(i === 0 || i === pontos.length - 1) && (
            <text x={x(t[i])} y={H - 8} textAnchor={i === 0 ? "start" : "end"}>{fmtCurta(p.data)}/{p.data.slice(2, 4)}</text>
          )}
          {i === pontos.length - 1 && (
            <text x={x(t[i]) - 8} y={y(p.v) - 10} textAnchor="end" style={{ fill: "var(--fg)", fontWeight: 600 }}>{fmt(p.v)} {unidade}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
