"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "entrar" | "criar";

export default function LoginForm({ initialError }: { initialError: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message.includes("Email not confirmed")
            ? "Confirme o e-mail pelo link que enviamos antes de entrar."
            : "E-mail ou senha incorretos.",
        );
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setError(error.message.includes("Signups not allowed") ? "Cadastro desativado." : error.message);
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setInfo("Conta criada. Abra o link de confirmação no seu e-mail e depois volte aqui para entrar.");
    setMode("entrar");
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="t">{mode === "entrar" ? "Entrar" : "Criar conta"}</div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="msg err">{error}</p>}
      {info && <p className="msg ok">{info}</p>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
      </button>
      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
      </button>
    </form>
  );
}
