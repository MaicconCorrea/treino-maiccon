import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stravaConfigurado, verifyToken } from "@/lib/strava";

type Sub = { id: number; callback_url: string };

async function assinaturas(): Promise<Sub[]> {
  const u = new URL("https://www.strava.com/api/v3/push_subscriptions");
  u.searchParams.set("client_id", process.env.STRAVA_CLIENT_ID!);
  u.searchParams.set("client_secret", process.env.STRAVA_CLIENT_SECRET!);
  const r = await fetch(u, { cache: "no-store" });
  return r.ok ? r.json() : [];
}

// Situação da integração: configurada no servidor, conectada, webhook ativo
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!stravaConfigurado()) return NextResponse.json({ configurado: false });

  const admin = createAdminClient();
  const { data: t } = await admin.from("strava_tokens").select("athlete_id, updated_at").eq("user_id", user.id).maybeSingle();
  const subs = await assinaturas();
  return NextResponse.json({ configurado: true, conectado: !!t, atleta: t?.athlete_id ?? null, webhook: subs[0]?.callback_url ?? null });
}

// Cria a assinatura do webhook apontando para este app
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!stravaConfigurado()) return NextResponse.json({ erro: "Strava não configurado" }, { status: 503 });

  const { origin } = new URL(request.url);
  if ((await assinaturas()).length) return NextResponse.json({ ok: true, ja: true });
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    callback_url: `${origin}/api/strava/webhook`,
    verify_token: verifyToken(),
  });
  const r = await fetch("https://www.strava.com/api/v3/push_subscriptions", { method: "POST", body });
  if (!r.ok) return NextResponse.json({ erro: await r.text() }, { status: 400 });
  return NextResponse.json({ ok: true });
}
