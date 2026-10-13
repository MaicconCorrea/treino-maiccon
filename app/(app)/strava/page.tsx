"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = { configurado: boolean; conectado?: boolean; atleta?: number | null; webhook?: string | null };

export default function Page() {
  return <Suspense><Strava /></Suspense>;
}

function Strava() {
  const params = useSearchParams();
  const [st, setSt] = useState<Status | null>(null);
  const [msg, setMsg] = useState<string | null>(
    params.get("ok") ? `Strava conectado. ${params.get("ok")} atividades importadas.` : null,
  );
  const erroParam = params.get("erro");
  const [erro, setErro] = useState<string | null>(
    erroParam === "config" ? "O Strava ainda não foi configurado no servidor (variáveis da Vercel)." : erroParam ? "Não deu certo conectar. Tente de novo." : null,
  );
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const r = await fetch("/api/strava/status");
    setSt(await r.json());
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, [carregar]);

  async function sincronizar() {
    setBusy(true); setErro(null);
    const r = await fetch("/api/strava/sync", { method: "POST" });
    const j = await r.json();
    setBusy(false);
    if (r.ok) setMsg(`${j.atividades} atividades dos últimos 14 dias sincronizadas.`); else setErro(j.erro);
  }
  async function ativarWebhook() {
    setBusy(true); setErro(null);
    const r = await fetch("/api/strava/status", { method: "POST" });
    const j = await r.json();
    setBusy(false);
    if (r.ok) { setMsg("Importação automática ativada."); carregar(); } else setErro(j.erro);
  }

  return (
    <main className="wrap">
      <header>
        <h1>Strava</h1>
        <p className="sub">O Garmin sincroniza com o Strava, e o Strava manda as atividades para o app (corridas, musculação, pilates).</p>
      </header>
      {msg && <p className="msg ok">{msg}</p>}
      {erro && <p className="msg err">{erro}</p>}

      <section className="card">
        <h2>Situação</h2>
        {!st ? <p className="note">Carregando…</p> : !st.configurado ? (
          <p className="note" style={{ margin: 0 }}>Falta configurar o Strava no servidor: criar o app na página de API do Strava e cadastrar as chaves na Vercel (veja o README do projeto).</p>
        ) : (
          <>
            <div className="act"><b>Conta</b>{st.conectado ? <span className="chip ok">Conectada</span> : <span className="chip warn">Não conectada</span>}</div>
            <div className="act"><b>Importação automática</b>{st.webhook ? <span className="chip ok">Ativa</span> : <span className="chip warn">Desligada</span>}</div>
            {!st.conectado && <a className="btn" href="/api/strava/connect">Conectar com o Strava</a>}
            {st.conectado && !st.webhook && <button className="btn" onClick={ativarWebhook} disabled={busy}>Ativar importação automática</button>}
            {st.conectado && <button className="btn ghost" onClick={sincronizar} disabled={busy}>{busy ? "Sincronizando…" : "Sincronizar agora"}</button>}
          </>
        )}
      </section>

      <section className="card">
        <h2>Como funciona</h2>
        <ul className="small">
          <li>Corridas viram sessões de corrida, com distância, pace e frequência cardíaca.</li>
          <li>Musculação (WeightTraining) do mesmo dia é vinculada ao treino feito no app, trazendo calorias e FC.</li>
          <li>Pilates com relógio é vinculado à presença registrada.</li>
          <li>Muay thai é registrado na mão, porque você treina sem relógio.</li>
        </ul>
      </section>
    </main>
  );
}
