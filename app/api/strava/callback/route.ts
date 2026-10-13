import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { importar, trocarCodigo } from "@/lib/strava";

export const maxDuration = 60;

// Volta do OAuth: guarda os tokens e importa o histórico recente
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("strava_state")?.value) {
    return NextResponse.redirect(`${origin}/strava?erro=estado`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const t = await trocarCodigo(code);
    const admin = createAdminClient();
    await admin.from("strava_tokens").upsert({
      user_id: user.id,
      athlete_id: t.athlete?.id ?? null,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(t.expires_at * 1000).toISOString(),
      scope: searchParams.get("scope"),
      updated_at: new Date().toISOString(),
    });
    // Histórico: desde 1º/01/2025 (detalhe com calorias só dos últimos 30 dias)
    const n = await importar(admin, user.id, new Date("2025-01-01T00:00:00Z"));
    const res = NextResponse.redirect(`${origin}/strava?ok=${n}`);
    res.cookies.delete("strava_state");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${origin}/strava?erro=troca`);
  }
}
