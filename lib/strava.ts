// Integração com o Strava (só servidor). O Garmin sincroniza com o Strava e o Strava manda para o app.
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const API = "https://www.strava.com/api/v3";

export function stravaConfigurado() {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET && process.env.SUPABASE_SECRET_KEY);
}

// Token de verificação do webhook derivado do client secret (dispensa outra variável)
export function verifyToken() {
  return createHash("sha256").update((process.env.STRAVA_CLIENT_SECRET || "") + ":webhook").digest("hex").slice(0, 32);
}

type TokenResp = { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } };

export async function trocarCodigo(code: string): Promise<TokenResp> {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new Error("Strava recusou o código: " + (await r.text()));
  return r.json();
}

// Devolve um access token válido, renovando se faltar menos de 5 min
export async function tokenValido(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data: t } = await admin.from("strava_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!t) return null;
  if (new Date(t.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return t.access_token;
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: t.refresh_token,
    }),
  });
  if (!r.ok) return null;
  const n: TokenResp = await r.json();
  await admin
    .from("strava_tokens")
    .update({ access_token: n.access_token, refresh_token: n.refresh_token, expires_at: new Date(n.expires_at * 1000).toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return n.access_token;
}

export async function stravaGet<T>(token: string, path: string): Promise<T> {
  const r = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`Strava ${r.status}: ${await r.text()}`);
  return r.json();
}

export type Atividade = {
  id: number; name: string; sport_type: string; type: string; start_date: string; start_date_local: string;
  moving_time: number; elapsed_time: number; distance: number; total_elevation_gain: number;
  average_heartrate?: number; max_heartrate?: number; calories?: number;
};

export function tipoDoStrava(sport: string): string {
  if (/Run/.test(sport)) return "corrida";
  if (/WeightTraining|Crossfit/.test(sport)) return "musculacao";
  if (/Pilates|Yoga/.test(sport)) return "pilates";
  if (/Boxing|Kickboxing|MartialArts/.test(sport)) return "muaythai";
  return "outro";
}

// Grava ou atualiza uma atividade. Vincula a sessões feitas no app no mesmo dia (musculação, pilates, muay thai).
export async function gravarAtividade(admin: SupabaseClient, userId: string, a: Atividade) {
  const tipo = tipoDoStrava(a.sport_type || a.type);
  const data = a.start_date_local.slice(0, 10);
  const campos = {
    inicio: a.start_date,
    distancia_m: a.distance || null,
    elevacao_m: a.total_elevation_gain || null,
    fc_media: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    fc_max: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    kcal: a.calories ? Math.round(a.calories) : null,
    strava_tipo: a.sport_type || a.type,
    strava_activity_id: a.id,
  };

  const { data: existente } = await admin
    .from("workout_sessions").select("id, fonte").eq("user_id", userId).eq("strava_activity_id", a.id).maybeSingle();
  if (existente) {
    const extra = existente.fonte === "strava" ? { nome: a.name, duracao_s: tipo === "corrida" ? a.moving_time : a.elapsed_time } : {};
    await admin.from("workout_sessions").update({ ...campos, ...extra }).eq("id", existente.id);
    return "atualizada";
  }

  if (tipo !== "corrida" && tipo !== "outro") {
    const { data: doApp } = await admin
      .from("workout_sessions").select("id")
      .eq("user_id", userId).eq("data", data).eq("tipo", tipo).is("strava_activity_id", null).neq("fonte", "strava")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (doApp) {
      await admin.from("workout_sessions").update(campos).eq("id", doApp.id);
      return "vinculada";
    }
  }

  await admin.from("workout_sessions").insert({
    ...campos, user_id: userId, data, tipo, fonte: "strava", nome: a.name,
    duracao_s: tipo === "corrida" ? a.moving_time : a.elapsed_time,
  });
  return "nova";
}

export async function removerAtividade(admin: SupabaseClient, userId: string, stravaId: number) {
  await admin.from("workout_sessions").delete().eq("user_id", userId).eq("strava_activity_id", stravaId).eq("fonte", "strava");
  await admin.from("workout_sessions")
    .update({ strava_activity_id: null, kcal: null, fc_media: null, fc_max: null })
    .eq("user_id", userId).eq("strava_activity_id", stravaId);
}

// Importa atividades desde uma data. Busca o detalhe (que traz calorias) só das recentes, para poupar o limite da API.
export async function importar(admin: SupabaseClient, userId: string, desde: Date, detalharDias = 30) {
  const token = await tokenValido(admin, userId);
  if (!token) throw new Error("Strava não conectado");
  const after = Math.floor(desde.getTime() / 1000);
  const corteDetalhe = Date.now() - detalharDias * 86400000;
  let page = 1, total = 0;
  for (;;) {
    const lista = await stravaGet<Atividade[]>(token, `/athlete/activities?after=${after}&per_page=100&page=${page}`);
    if (!lista.length) break;
    for (const s of lista) {
      let a = s;
      if (new Date(s.start_date).getTime() > corteDetalhe) {
        try { a = await stravaGet<Atividade>(token, `/activities/${s.id}`); } catch { /* fica com o resumo */ }
      }
      await gravarAtividade(admin, userId, a);
      total++;
    }
    if (lista.length < 100 || page >= 10) break;
    page++;
  }
  return total;
}
