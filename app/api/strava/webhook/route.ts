import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gravarAtividade, removerAtividade, stravaGet, tokenValido, verifyToken, type Atividade } from "@/lib/strava";

// Validação da assinatura do webhook (Strava chama com hub.challenge)
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === verifyToken()) {
    return NextResponse.json({ "hub.challenge": p.get("hub.challenge") });
  }
  return NextResponse.json({ erro: "token inválido" }, { status: 403 });
}

type Evento = { object_type: string; object_id: number; aspect_type: string; owner_id: number; updates?: Record<string, string> };

// Eventos de atividade: responde na hora e processa depois (o Strava exige resposta em 2 s)
export async function POST(request: NextRequest) {
  const ev = (await request.json()) as Evento;
  after(async () => {
    try {
      const admin = createAdminClient();
      const { data: t } = await admin.from("strava_tokens").select("user_id").eq("athlete_id", ev.owner_id).maybeSingle();
      if (!t) return;
      if (ev.object_type === "athlete" && ev.updates?.authorized === "false") {
        await admin.from("strava_tokens").delete().eq("user_id", t.user_id);
        return;
      }
      if (ev.object_type !== "activity") return;
      if (ev.aspect_type === "delete") return removerAtividade(admin, t.user_id, ev.object_id);
      const token = await tokenValido(admin, t.user_id);
      if (!token) return;
      const a = await stravaGet<Atividade>(token, `/activities/${ev.object_id}`);
      await gravarAtividade(admin, t.user_id, a);
    } catch (e) {
      console.error("webhook strava", e);
    }
  });
  return NextResponse.json({ ok: true });
}
