"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addDias, diasDaSemana, fmtCurta, fmtLonga, hojeISO } from "@/lib/datas";
import { CURTO_DIA } from "@/lib/semana";
import { CORTE_MAX, REFEICOES, calcularSemana, refeicaoPorHora, type Meta } from "@/lib/nutricao";
import { comprimirImagem, enviar, type Midia } from "@/lib/arquivo";

type Registro = { id: string; data_hora: string; refeicao: string | null; descricao: string; quantidade_g: number | null; kcal: number | null; prot_g: number | null; carb_g: number | null; gord_g: number | null; origem: string; confianca: string | null };
type ItemEd = { descricao: string; quantidade_g: string; kcal: string; prot_g: string; carb_g: string; gord_g: string };
const vazio = (): ItemEd => ({ descricao: "", quantidade_g: "", kcal: "", prot_g: "", carb_g: "", gord_g: "" });
const n = (s: string) => parseFloat(String(s).replace(",", ".")) || 0;
const r0 = (x: number) => Math.round(x);

export default function Nutricao() {
  const hoje = hojeISO();
  const [dia, setDia] = useState(hoje);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [consumo, setConsumo] = useState<Record<string, number>>({});
  const [ref, setRef] = useState<{ tmb: number | null; mlg: number | null; peso: number | null }>({ tmb: null, mlg: null, peso: null });
  const [carregado, setCarregado] = useState(false);
  const dias = useMemo(() => diasDaSemana(dia), [dia]);

  const carregar = useCallback(async () => {
    const sb = createClient();
    const ini = dias[0], fim = dias[6];
    const [mt, fl, bio] = await Promise.all([
      sb.from("nutrition_targets").select("*").lte("vigencia_inicio", dia).order("vigencia_inicio", { ascending: false }).limit(1).maybeSingle(),
      sb.from("foods_log").select("*").gte("data_hora", ini + "T03:00:00Z").lt("data_hora", addDias(fim, 1) + "T03:00:00Z").order("data_hora"),
      sb.from("bioimpedance").select("tmb, mlg, peso").order("data", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setMeta(mt.data as Meta | null);
    const regs = (fl.data || []) as Registro[];
    const c: Record<string, number> = {};
    for (const f of regs) { const d = hojeISO(new Date(f.data_hora)); c[d] = (c[d] || 0) + Number(f.kcal || 0); }
    setConsumo(c);
    setRegistros(regs.filter((f) => hojeISO(new Date(f.data_hora)) === dia));
    setRef({ tmb: bio.data?.tmb ?? null, mlg: bio.data?.mlg ?? null, peso: bio.data?.peso ?? null });
    setCarregado(true);
  }, [dia, dias]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, [carregar]);

  const semana = meta ? calcularSemana(dia === hoje ? hoje : dia, meta.kcal_dia, consumo) : null;
  const metaDia = semana ? (dia === hoje ? semana.metaHoje : dia < hoje ? meta!.kcal_dia : semana.metaHoje) : null;
  const tot = registros.reduce((a, r) => ({ kcal: a.kcal + Number(r.kcal || 0), p: a.p + Number(r.prot_g || 0), c: a.c + Number(r.carb_g || 0), g: a.g + Number(r.gord_g || 0) }), { kcal: 0, p: 0, c: 0, g: 0 });

  async function apagar(id: string) {
    await createClient().from("foods_log").delete().eq("id", id);
    carregar();
  }

  const porRefeicao = REFEICOES.map((rf) => ({ rf, itens: registros.filter((r) => (r.refeicao || "Outros") === rf) })).filter((g) => g.itens.length);
  const outros = registros.filter((r) => !REFEICOES.includes(r.refeicao || ""));

  return (
    <main className="wrap">
      <header>
        <h1>Nutrição</h1>
        <p className="sub">Registre por foto da tabela, foto do prato ou na mão. Objetivo: recomposição, com meta moderada e proteína alta.</p>
      </header>

      <div className="between">
        <button className="btn ghost small" onClick={() => setDia(addDias(dia, -1))} aria-label="Dia anterior">‹</button>
        <b style={{ textTransform: "capitalize" }}>{dia === hoje ? "Hoje" : fmtLonga(dia)}</b>
        <button className="btn ghost small" onClick={() => setDia(addDias(dia, 1))} disabled={dia >= hoje} aria-label="Próximo dia">›</button>
      </div>

      {meta && metaDia ? (
        <section className="card">
          <div className="stats">
            <div className="stat"><b>{r0(tot.kcal)}</b><span>Consumidas</span></div>
            <div className="stat"><b>{metaDia}</b><span>Meta do dia</span></div>
            <div className="stat"><b>{metaDia - r0(tot.kcal)}</b><span>Restam</span></div>
          </div>
          <div className={"bar" + (tot.kcal > metaDia ? " over" : "")}><i style={{ width: Math.min(100, (tot.kcal / metaDia) * 100) + "%" }} /></div>
          <div className="grid3 small">
            <span>Proteína<br /><b>{r0(tot.p)}</b>{meta.prot_g ? ` / ${meta.prot_g} g` : " g"}</span>
            <span>Carboidrato<br /><b>{r0(tot.c)}</b>{meta.carb_g ? ` / ${meta.carb_g} g` : " g"}</span>
            <span>Gordura<br /><b>{r0(tot.g)}</b>{meta.gord_g ? ` / ${meta.gord_g} g` : " g"}</span>
          </div>
          {semana && semana.reducaoDia > 0 && dia >= hoje && (
            <p className="note" style={{ margin: 0 }}>Meta reduzida em {semana.reducaoDia} kcal para redistribuir {semana.excesso} kcal de excesso dos dias anteriores (limite de {CORTE_MAX * 100}% por dia).</p>
          )}
        </section>
      ) : carregado ? (
        <MetaForm ref0={ref} onSaved={carregar} aberto />
      ) : null}

      <NovoRegistro dia={dia} onSaved={carregar} />

      <section className="card">
        <h2>Registros do dia</h2>
        {registros.length === 0 && <p className="note" style={{ margin: 0 }}>Nada registrado neste dia.</p>}
        {[...porRefeicao, ...(outros.length ? [{ rf: "Outros", itens: outros }] : [])].map((g) => (
          <div key={g.rf}>
            <div className="label">{g.rf}</div>
            {g.itens.map((r) => (
              <div className="foodrow" key={r.id}>
                <div style={{ minWidth: 0 }}>
                  <b>{r.descricao}</b>
                  <div className="small muted">
                    {r.quantidade_g ? `${r0(Number(r.quantidade_g))} g · ` : ""}P {r0(Number(r.prot_g || 0))} · C {r0(Number(r.carb_g || 0))} · G {r0(Number(r.gord_g || 0))}
                    {r.origem !== "manual" && ` · estimado por foto${r.confianca ? ` (${r.confianca})` : ""}`}
                  </div>
                </div>
                <div className="r"><b>{r0(Number(r.kcal || 0))}</b> kcal <button className="x" aria-label="Apagar" onClick={() => apagar(r.id)}>×</button></div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {semana && (
        <section className="card">
          <h2>Semana</h2>
          <div className="tbl">
            <table>
              <thead><tr><th>Dia</th><th>Consumido</th><th>Meta</th><th>Saldo</th></tr></thead>
              <tbody>
                {semana.dias.map((d) => {
                  const c = r0(consumo[d] || 0);
                  const m = d < hoje ? semana.metaBase : semana.metaHoje;
                  return (
                    <tr key={d}>
                      <td>{CURTO_DIA[new Date(d + "T12:00:00Z").getUTCDay()]} {fmtCurta(d)}</td>
                      <td>{c || "–"}</td>
                      <td>{m}</td>
                      <td className={c && c > m ? "down" : c ? "up" : ""}>{c ? m - c : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note" style={{ margin: 0 }}>
            Meta semanal {(semana.metaBase * 7).toLocaleString("pt-BR")} kcal · consumido {semana.consumidoSemana.toLocaleString("pt-BR")} ·{" "}
            {semana.saldoSemana >= 0 ? `faltam ${semana.saldoSemana.toLocaleString("pt-BR")}` : `passou ${Math.abs(semana.saldoSemana).toLocaleString("pt-BR")}`}.
            Quando um dia passa da meta, o excesso é dividido nos dias restantes, sem cortar mais de {CORTE_MAX * 100}% de nenhum dia.
          </p>
        </section>
      )}

      {meta && <MetaForm ref0={ref} atual={meta} onSaved={carregar} />}
    </main>
  );
}

function NovoRegistro({ dia, onSaved }: { dia: string; onSaved: () => void }) {
  const [modo, setModo] = useState<"tabela" | "prato" | "manual">("tabela");
  const [foto, setFoto] = useState<{ midia: Midia; blob: Blob; url: string } | null>(null);
  const [qtd, setQtd] = useState("");
  const [unid, setUnid] = useState("g");
  const [desc, setDesc] = useState("");
  const [textoItens, setTextoItens] = useState("");
  const [itens, setItens] = useState<ItemEd[] | null>(null);
  const [info, setInfo] = useState<{ confianca: string; observacao: string } | null>(null);
  const [refeicao, setRefeicao] = useState(refeicaoPorHora(new Date().getHours()));
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limpar() {
    setFoto(null); setQtd(""); setDesc(""); setTextoItens(""); setItens(null); setInfo(null); setErro(null);
  }

  async function escolherFoto(f: File | undefined) {
    if (!f) return;
    const { midia, blob } = await comprimirImagem(f);
    setFoto({ midia, blob, url: URL.createObjectURL(blob) });
  }

  async function ler() {
    setBusy(true); setErro(null);
    try {
      const r = await fetch("/api/ia/nutricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modo === "tabela"
          ? { modo, imagem: foto?.midia, quantidade: n(qtd), unidade: unid, descricao: desc }
          : { modo, imagem: foto?.midia ?? null, itens: textoItens }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "Falha na leitura");
      setItens(j.itens.map((i: Record<string, number | string>) => ({
        descricao: String(i.descricao), quantidade_g: String(r0(Number(i.quantidade_g))), kcal: String(r0(Number(i.kcal))),
        prot_g: String(Math.round(Number(i.prot_g) * 10) / 10), carb_g: String(Math.round(Number(i.carb_g) * 10) / 10), gord_g: String(Math.round(Number(i.gord_g) * 10) / 10),
      })));
      setInfo({ confianca: j.confianca, observacao: j.observacao });
    } catch (e) {
      setErro((e as Error).message);
    }
    setBusy(false);
  }

  async function salvar() {
    const lista = (modo === "manual" ? itens ?? [] : itens ?? []).filter((i) => i.descricao && n(i.kcal) >= 0);
    if (!lista.length) return;
    setBusy(true);
    const path = foto ? await enviar("fotos", foto.blob, "jpg") : null;
    // Horário: agora, se for hoje; meio-dia, se for outro dia
    const quando = dia === hojeISO() ? new Date().toISOString() : new Date(dia + "T15:00:00Z").toISOString();
    const origem = modo === "tabela" ? "foto_tabela" : modo === "prato" && foto ? "foto_prato" : "manual";
    const { error } = await createClient().from("foods_log").insert(lista.map((i) => ({
      data_hora: quando, refeicao, descricao: i.descricao, quantidade_g: n(i.quantidade_g) || null,
      kcal: n(i.kcal), prot_g: n(i.prot_g), carb_g: n(i.carb_g), gord_g: n(i.gord_g),
      origem, foto_path: path, confianca: modo === "manual" ? null : info?.confianca ?? null,
    })));
    setBusy(false);
    if (error) { setErro("Não consegui salvar: " + error.message); return; }
    limpar(); onSaved();
  }

  const editar = (k: number, campo: keyof ItemEd, v: string) => setItens((l) => l!.map((x, i) => (i === k ? { ...x, [campo]: v } : x)));

  return (
    <section className="card">
      <h2>Adicionar</h2>
      <div className="seg" role="group" aria-label="Como registrar">
        <button aria-pressed={modo === "tabela"} onClick={() => { setModo("tabela"); limpar(); }}>Foto da<small>tabela</small></button>
        <button aria-pressed={modo === "prato"} onClick={() => { setModo("prato"); limpar(); }}>Foto do<small>prato</small></button>
        <button aria-pressed={modo === "manual"} onClick={() => { setModo("manual"); limpar(); setItens([vazio()]); }}>Na<small>mão</small></button>
      </div>

      <div className="field">
        <label htmlFor="ref">Refeição</label>
        <select id="ref" value={refeicao} onChange={(e) => setRefeicao(e.target.value)}>{REFEICOES.map((r) => <option key={r}>{r}</option>)}</select>
      </div>

      {modo !== "manual" && !itens && (
        <>
          <div className="field">
            <label htmlFor="foto">{modo === "tabela" ? "Foto da tabela nutricional" : "Foto do prato (opcional se descrever)"}</label>
            <input id="foto" type="file" accept="image/*" onChange={(e) => escolherFoto(e.target.files?.[0])} />
          </div>
          {foto && <img className="photo" src={foto.url} alt="Foto escolhida" />}
          {modo === "tabela" ? (
            <>
              <div className="field">
                <label htmlFor="desc">Produto (opcional)</label>
                <input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: iogurte natural" />
              </div>
              <div className="grid2">
                <div className="field"><label htmlFor="qtd">Quanto consumiu</label><input id="qtd" inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
                <div className="field"><label htmlFor="un">Unidade</label><select id="un" value={unid} onChange={(e) => setUnid(e.target.value)}><option value="g">gramas</option><option value="ml">ml</option><option value="porções">porções</option></select></div>
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="itens">Itens e pesos</label>
              <textarea id="itens" value={textoItens} onChange={(e) => setTextoItens(e.target.value)} placeholder="Ex.: arroz 150 g, feijão 100 g, frango grelhado 120 g, salada" />
            </div>
          )}
          {erro && <p className="msg err">{erro}</p>}
          <button className="btn" onClick={ler} disabled={busy || (modo === "tabela" ? !foto || !n(qtd) : !foto && !textoItens)}>
            {busy ? "Lendo…" : "Ler com IA"}
          </button>
        </>
      )}

      {itens && (
        <>
          {info && (
            <p className="note" style={{ margin: 0 }}>
              <span className={"chip" + (info.confianca === "alta" ? " ok" : info.confianca === "baixa" ? " warn" : "")}>Confiança {info.confianca}</span>{" "}
              Estimativa aproximada; confira e ajuste. {info.observacao}
            </p>
          )}
          {itens.map((i, k) => (
            <div key={k} className="card" style={{ padding: 12 }}>
              <div className="field"><label>Alimento</label><input value={i.descricao} onChange={(e) => editar(k, "descricao", e.target.value)} /></div>
              <div className="grid3">
                <div className="field"><label>Gramas</label><input inputMode="decimal" value={i.quantidade_g} onChange={(e) => editar(k, "quantidade_g", e.target.value)} /></div>
                <div className="field"><label>Kcal</label><input inputMode="decimal" value={i.kcal} onChange={(e) => editar(k, "kcal", e.target.value)} /></div>
                <div className="field"><label>Prot. g</label><input inputMode="decimal" value={i.prot_g} onChange={(e) => editar(k, "prot_g", e.target.value)} /></div>
                <div className="field"><label>Carbo g</label><input inputMode="decimal" value={i.carb_g} onChange={(e) => editar(k, "carb_g", e.target.value)} /></div>
                <div className="field"><label>Gord. g</label><input inputMode="decimal" value={i.gord_g} onChange={(e) => editar(k, "gord_g", e.target.value)} /></div>
                <div className="field" style={{ justifyContent: "flex-end" }}>
                  {itens.length > 1 && <button className="btn ghost small" onClick={() => setItens(itens.filter((_, x) => x !== k))}>Remover</button>}
                </div>
              </div>
            </div>
          ))}
          <button className="link" onClick={() => setItens([...itens, vazio()])}>+ Adicionar item</button>
          <p className="small" style={{ margin: 0 }}>Total: <b>{r0(itens.reduce((a, i) => a + n(i.kcal), 0))} kcal</b> · P {r0(itens.reduce((a, i) => a + n(i.prot_g), 0))} g</p>
          {erro && <p className="msg err">{erro}</p>}
          <button className="btn" onClick={salvar} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
          {modo !== "manual" && <button className="link" onClick={limpar}>Recomeçar</button>}
        </>
      )}
    </section>
  );
}

function MetaForm({ ref0, atual, onSaved, aberto }: { ref0: { tmb: number | null; mlg: number | null; peso: number | null }; atual?: Meta; onSaved: () => void; aberto?: boolean }) {
  // Ponto de partida: TMB × 1,55 menos 500 kcal; proteína 2 g por kg de massa livre de gordura
  const sugKcal = ref0.tmb ? Math.round((ref0.tmb * 1.55 - 500) / 50) * 50 : 2400;
  const sugP = ref0.mlg ? Math.round(ref0.mlg * 2) : 180;
  const sugG = ref0.peso ? Math.round(ref0.peso * 0.8) : 80;
  const sugC = Math.max(0, Math.round((sugKcal - sugP * 4 - sugG * 9) / 4));
  const [kcal, setKcal] = useState(String(atual?.kcal_dia ?? sugKcal));
  const [p, setP] = useState(String(atual?.prot_g ?? sugP));
  const [c, setC] = useState(String(atual?.carb_g ?? sugC));
  const [g, setG] = useState(String(atual?.gord_g ?? sugG));

  async function salvar() {
    await createClient().from("nutrition_targets").insert({ vigencia_inicio: hojeISO(), kcal_dia: n(kcal), prot_g: n(p) || null, carb_g: n(c) || null, gord_g: n(g) || null });
    onSaved();
  }

  return (
    <details className="card" open={aberto}>
      <summary><h2>{atual ? "Meta diária" : "Defina a meta diária"}</h2></summary>
      <div className="in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!atual && (
          <p className="note" style={{ margin: 0 }}>
            Valores pré-preenchidos como ponto de partida{ref0.tmb ? ` (TMB ${ref0.tmb} kcal do último exame)` : ""}. Ajuste com seu nutricionista ou treinador.
          </p>
        )}
        <div className="grid2">
          <div className="field"><label htmlFor="mk">Kcal por dia</label><input id="mk" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} /></div>
          <div className="field"><label htmlFor="mp">Proteína (g)</label><input id="mp" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <div className="field"><label htmlFor="mc">Carboidrato (g)</label><input id="mc" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} /></div>
          <div className="field"><label htmlFor="mg">Gordura (g)</label><input id="mg" inputMode="numeric" value={g} onChange={(e) => setG(e.target.value)} /></div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Meta semanal: {(n(kcal) * 7).toLocaleString("pt-BR")} kcal. A nova meta vale a partir de hoje.</p>
        <button className="btn" onClick={salvar}>Salvar meta</button>
      </div>
    </details>
  );
}
