# Treino e Saúde

App pessoal (PWA para iPhone) de musculação, corrida, nutrição, bioimpedância e protocolo.
Especificação completa em [docs/especificacao.md](docs/especificacao.md); versão original do app em [docs/treino.html](docs/treino.html).

## Stack

- Next.js 16 (App Router) na Vercel — projeto `treino-maiccon`
- Supabase (Postgres + Auth + Storage) — projeto `treino-maiccon` (`jdzbelotenvmxyuxehwt`)
- Migrations em `supabase/migrations/` (aplicadas pelo conector do Supabase)

## Rodar local

```bash
npm install
npm run dev
```

Variáveis em `.env.local` (modelo em `.env.example`). Segredos (chave secreta do Supabase, Claude API, Strava) só no servidor, nunca com prefixo `NEXT_PUBLIC_`.

## Fases

1. Fundação: login, RLS, deploy, PWA — **feito**
2. Musculação
3. Bioimpedância e protocolo
4. Strava
5. Corrida
6. Nutrição
7. Tela Hoje completa
