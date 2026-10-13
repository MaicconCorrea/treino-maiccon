"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addDias, diasEntre, fmtDataCompleta, hojeISO } from "@/lib/datas";
import { enviar, linkAssinado, prepararArquivo } from "@/lib/arquivo";

type Item = { id: string; horario: string; item: string; dose: string | null; doses_total: number | null; inicio_uso: string | null; dias_por_dose: number; ativo: boolean; prescription_id: string | null; receita_data: string };
type Receita = { id: string; data: string; medico: string | null; file_path: string | null };
const ORDEM_H = ["Ao acordar", "Junto à refeição", "14h", "Jantar", "1x por semana"];

export default function Protocolo() {
  const [itens, setItens] = useState<Item[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const hoje = hojeISO();

  const carregar = useCallback(async () => {
    const sb = createClient();
    const [{ data: i }, { data: r }] = await Promise.all([
      sb.from("protocol_items").select("*").eq("ativo", true).order("item"),
      sb.from("prescriptions").select("*").order("data", { ascending: false }),
    ]);
    setItens((i || []) as Item[]);
    setReceitas((r || []) as Receita[]);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, [carregar]);

  const grupos = [...new Set(itens.map((i) => i.horario))].sort((a, b) => (ORDEM_H.indexOf(a) + 99) % 99 - (ORDEM_H.indexOf(b) + 99) % 99);
  const fimDe = (g: Item[]) => {
    const i = g[0];
    if (!i?.inicio_uso || !i.doses_total) return null;
    return addDias(i.inicio_uso, i.doses_total * (i.dias_por_dose || 1));
  };

  async function mudarInicio(horario: string, data: string) {
    await createClient().from("protocol_items").update({ inicio_uso: data }).eq("horario", horario).eq("ativo", true);
    carregar();
  }
  async function abrir(p: string) {
    const u = await linkAssinado("receitas", p);
    if (u) window.open(u, "_blank");
  }

  const avisos = grupos.map((h) => ({ h, fim: fimDe(itens.filter((i) => i.horario === h)) })).filter((x) => x.fim && diasEntre(hoje, x.fim) <= 10);
  const atual = receitas[0];

  return (
    <main className="wrap">
      <header>
        <h1>Protocolo</h1>
        <p className="sub">Registro do que foi prescrito, para contexto. O app não sugere nem altera doses.</p>
      </header>

      {avisos.map((a) => (
        <div key={a.h} className="alert">
          <b>Recompra: {a.h.toLowerCase()}.</b> {diasEntre(hoje, a.fim!) >= 0 ? `Acaba por volta de ${fmtDataCompleta(a.fim!)} (${diasEntre(hoje, a.fim!)} dias).` : `Deveria ter acabado em ${fmtDataCompleta(a.fim!)}.`}
        </div>
      ))}

      {atual && (
        <section className="card">
          <div className="between">
            <h2>Receita atual</h2>
            {atual.file_path && <button className="btn ghost small" onClick={() => abrir(atual.file_path!)}>Ver arquivo</button>}
          </div>
          <p className="small" style={{ margin: 0 }}>{fmtDataCompleta(atual.data)}{atual.medico ? ` · ${atual.medico}` : ""}</p>
        </section>
      )}

      {grupos.map((h) => {
        const g = itens.filter((i) => i.horario === h);
        const fim = fimDe(g);
        return (
          <section className="card" key={h}>
            <div className="between">
              <h2>{h}</h2>
              {g[0]?.doses_total && <span className="chip">{g[0].doses_total} doses</span>}
            </div>
            <ul>{g.map((i) => <li key={i.id}>{i.item}{i.dose ? <span className="muted"> · {i.dose}</span> : null}</li>)}</ul>
            <div className="grid2">
              <div className="field">
                <label htmlFor={"ini" + h}>Início do uso</label>
                <input id={"ini" + h} type="date" defaultValue={g[0]?.inicio_uso || ""} onBlur={(e) => e.target.value && e.target.value !== g[0]?.inicio_uso && mudarInicio(h, e.target.value)} />
              </div>
              <div className="field">
                <label>Acaba em</label>
                <span style={{ padding: "12px 0" }}>{fim ? `${fmtDataCompleta(fim)} (${diasEntre(hoje, fim)} dias)` : "–"}</span>
              </div>
            </div>
          </section>
        );
      })}

      <NovaReceita onSaved={carregar} />

      {receitas.length > 1 && (
        <details className="card">
          <summary><h2>Receitas anteriores</h2></summary>
          <div className="in hist">
            {receitas.slice(1).map((r) => (
              <div key={r.id}><span>{fmtDataCompleta(r.data)}{r.medico ? ` · ${r.medico}` : ""}</span><span>{r.file_path && <button className="x" onClick={() => abrir(r.file_path!)}>Arquivo</button>}</span></div>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

function NovaReceita({ onSaved }: { onSaved: () => void }) {
  const [data, setData] = useState(hojeISO());
  const [medico, setMedico] = useState("");
  const [arq, setArq] = useState<File | null>(null);
  const [linhas, setLinhas] = useState("");
  const [substituir, setSubstituir] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Itens no formato "Horário | Item | Dose | Doses", um por linha
  async function salvar() {
    setBusy(true); setMsg(null);
    const sb = createClient();
    let path: string | null = null;
    if (arq) { const p = await prepararArquivo(arq); path = await enviar("receitas", p.blob, p.ext); }
    const { data: rx, error } = await sb.from("prescriptions").insert({ data, medico: medico || null, file_path: path }).select("id").single();
    if (error) { setBusy(false); setMsg(error.message); return; }
    const novos = linhas.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length >= 2 && p[0] && p[1]).map((p) => ({
      prescription_id: rx.id, receita_data: data, horario: p[0], item: p[1], dose: p[2] || null,
      doses_total: parseInt(p[3]) || 60, inicio_uso: data, dias_por_dose: /semana/i.test(p[0]) ? 7 : 1,
    }));
    if (novos.length) {
      if (substituir) await sb.from("protocol_items").update({ ativo: false }).eq("ativo", true);
      await sb.from("protocol_items").insert(novos);
    }
    setBusy(false); setArq(null); setLinhas(""); setMedico("");
    setMsg(novos.length ? `Receita salva com ${novos.length} itens.` : "Receita salva (arquivo e data).");
    onSaved();
  }

  return (
    <details className="card">
      <summary><h2>Nova receita</h2></summary>
      <div className="in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="grid2">
          <div className="field"><label htmlFor="rd">Data</label><input id="rd" type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div className="field"><label htmlFor="rm">Médico</label><input id="rm" value={medico} onChange={(e) => setMedico(e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="ra">Arquivo (PDF ou foto)</label><input id="ra" type="file" accept="application/pdf,image/*" onChange={(e) => setArq(e.target.files?.[0] || null)} /></div>
        <div className="field">
          <label htmlFor="rl">Itens (opcional), um por linha</label>
          <textarea id="rl" value={linhas} onChange={(e) => setLinhas(e.target.value)} placeholder={"Ao acordar | Vitamina D3 | 20.000 UI | 60\n1x por semana | Cabergolina | 0,5 mg | 8"} />
        </div>
        {linhas && (
          <label className="check"><input type="checkbox" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} /><span>Substituir a lista atual por estes itens</span></label>
        )}
        {msg && <p className="msg ok">{msg}</p>}
        <button className="btn" onClick={salvar} disabled={busy}>{busy ? "Salvando…" : "Salvar receita"}</button>
      </div>
    </details>
  );
}
