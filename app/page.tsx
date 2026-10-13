import { createClient } from "@/lib/supabase/server";
import { SEMANA, hojeSP } from "@/lib/semana";
import Tabbar from "@/components/tabbar";
import { signOut } from "./actions";

export default async function Hoje() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("profiles").select("nome").maybeSingle();

  const { dow, dataLonga } = hojeSP();
  const dia = SEMANA[dow];
  const nome = perfil?.nome || user?.email?.split("@")[0] || "";
  const ordem = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <main className="wrap">
        <header className="topbar">
          <div>
            <h1>Hoje</h1>
            <p className="sub">
              {dia.longo}, {dataLonga}
              {nome ? ` · Olá, ${nome}` : ""}
            </p>
          </div>
          <form action={signOut}>
            <button className="btn ghost small" type="submit">
              Sair
            </button>
          </form>
        </header>

        <section className="card">
          <div className="t">Atividades do dia</div>
          <div className="acts">
            {dia.atividades.map((a) => (
              <div className="act" key={a.nome}>
                <div>
                  <b>{a.nome}</b>
                  {a.obs && <span style={{ display: "block" }}>{a.obs}</span>}
                </div>
                {a.tipo !== "descanso" && <span className="chip">Em breve</span>}
              </div>
            ))}
          </div>
          <p className="note" style={{ margin: 0 }}>
            Registro de treinos, corridas e calorias chega nas próximas fases.
          </p>
        </section>

        <section className="card">
          <h2>Semana</h2>
          <div className="week">
            {ordem.map((i) => (
              <div key={i} className={"day" + (i === dow ? " today" : "")}>
                <b>{SEMANA[i].curto}</b>
                {SEMANA[i].atividades.map((a) => (
                  <span key={a.nome}>{a.nome}</span>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Tabbar atual="/" />
    </>
  );
}
