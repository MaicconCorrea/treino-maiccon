import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { stravaConfigurado } from "@/lib/strava";

// Início do OAuth do Strava
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  if (!stravaConfigurado()) return NextResponse.redirect(`${origin}/strava?erro=config`);

  const state = randomBytes(16).toString("hex");
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", process.env.STRAVA_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${origin}/api/strava/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", "read,activity:read_all,profile:read_all");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("strava_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
