# Treino e Saúde

App pessoal (PWA para iPhone) de musculação, corrida, nutrição, bioimpedância e protocolo.
Especificação em [docs/especificacao.md](docs/especificacao.md); app original em [docs/treino.html](docs/treino.html);
ajustes do treinador em [docs/ajustes-treinador-2026-10-13.md](docs/ajustes-treinador-2026-10-13.md).

## Telas

| Aba | O que faz |
|---|---|
| Hoje | Atividades do dia, calorias (consumo, meta ajustada, gasto do Garmin), saldo da semana. Toque num dia da semana para ver detalhes ou ajustar só aquela data. |
| Treino | Musculação Superior/Inferior em fila (Superior 1 → Inferior → Superior 2). Séries com carga e reps, timer com bipe, wake lock, "última vez", vídeo. |
| Corrida | Plano da semana (normal ou retorno de lesão por nível), dor 0–10 pós-corrida, redução da próxima sessão, corridas do Strava. |
| Nutrição | Registro por foto da tabela, foto do prato ou manual (Claude lê a foto), meta diária e semanal com redistribuição (máx. 15%/dia). |
| Mais → Corpo | Bioimpedância: tabela, gráficos, alerta quando a massa magra cai mais que a gordura, leitura do laudo pelo Claude. |
| Mais → Protocolo | Suplementos e manipulados (registro apenas), aviso de recompra, receitas. |
| Mais → Atividades | Muay thai (MET × peso), presença no pilates, histórico. |
| Mais → Strava | Conexão OAuth, importação do histórico, webhook automático. |

## Stack

- Next.js 16 (App Router, `proxy.ts`) na Vercel — projeto `treino-maiccon`
- Supabase — projeto `treino-maiccon` (`jdzbelotenvmxyuxehwt`), RLS por dono em todas as tabelas, buckets privados `fotos`, `laudos`, `receitas`
- Migrations em `supabase/migrations/`; dados iniciais em `supabase/seed/`
- Claude API (`claude-opus-5-5`) para ler fotos e laudos, com fallback do servidor ativado

## Variáveis de ambiente

Públicas ficam em `.env.production` (versionado). Segredos vão **só** no painel da Vercel (Settings → Environment Variables):

| Variável | Onde pegar |
|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → Secret key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET` | strava.com/settings/api (criar app; Authorization Callback Domain: `treino-maiccon.vercel.app`) |
| `ALLOWED_EMAILS` (opcional) | e-mails que podem entrar, separados por vírgula |

Depois de cadastrar, faça um novo deploy (Deployments → Redeploy) e, no app, Mais → Strava → Conectar → Ativar importação automática.

## Rodar local

```bash
npm install
npm run dev
```
