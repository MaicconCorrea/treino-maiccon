import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { importar, stravaConfigurado } from "@/lib/strava";

export const maxDuration = 60;

// Sincroniza manualmente os últimos 14 dias (com detalhe e calorias)
export async function POST() {
  if (!stravaConfigurado()) return NextResponse.json({ erro: "Strava não configurado no servidor" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "login" }, { status: 401 });
  try {
    const n = await importar(createAdminClient(), user.id, new Date(Date.now() - 14 * 86400000), 14);
    return NextResponse.json({ ok: true, atividades: n });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 400 });
  }
}
