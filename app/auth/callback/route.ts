import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Retorno do link de confirmação de e-mail (fluxo PKCE do Supabase)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?erro=link`);
}
