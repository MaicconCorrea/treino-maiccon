# App de Treino e Saúde — Especificação para o Claude Code

Documento de passagem do projeto, do chat para o Claude Code. Junto com este arquivo vai o `treino.html`, a versão atual do app (12 treinos, timer de descanso, registro de carga e repetições). Use-o como ponto de partida de interface e de dados.

---

## 1. Objetivo

Um app pessoal (um único usuário: Maiccon) para centralizar:

1. **Musculação:** os treinos A/B/C já definidos, com registro de carga e repetições por série, timer de descanso e histórico.
2. **Corrida:** plano de treino e importação automática das corridas do Garmin (via Strava).
3. **Outras atividades:** pilates (seg/qua) e muay thai (ter/qui). O muay thai é registrado na mão, porque ele treina sem relógio.
4. **Nutrição:** registro de refeições por foto (tabela nutricional ou prato + peso de cada item), com estimativa de calorias e macros, meta diária e meta semanal com redistribuição do saldo.
5. **Bioimpedância:** histórico de exames (a cada 2 meses), gráficos de evolução e upload do laudo novo, lido automaticamente.
6. **Protocolo:** lista de suplementos e manipulados prescritos, apenas para registro e contexto. O app **não** sugere nem altera doses.

Uso principal: **iPhone**, instalado como app na tela inicial (PWA).

---

## 2. Stack sugerida

| Camada | Ferramenta | Função |
|---|---|---|
| Código | GitHub (repositório privado) | Versionamento |
| Front-end | Next.js na Vercel | App web instalável no iPhone (PWA) |
| Banco + login + arquivos | Supabase | Postgres com RLS, autenticação, storage de fotos e PDFs |
| Funções de servidor | Rotas de API do Next.js ou Edge Functions do Supabase | Strava, leitura de fotos e PDFs pelo Claude |
| IA | Claude API (visão) | Ler tabela nutricional, estimar prato, ler laudo de bioimpedância |
| Atividades | Strava API (OAuth + webhook) | O Garmin sincroniza com o Strava, e o Strava manda para o app |

**Pontos de atenção:**
- **Vercel:** no chat, a criação de projeto no time "Outtax Gestao Contabil" deu erro de permissão (403). Verificar o papel da conta no time ou usar uma conta pessoal. Por serem dados de saúde, o recomendado é **conta pessoal** e não a da empresa, tanto na Vercel quanto no Supabase.
- **Segredos:** chave da Claude API, client secret do Strava e service key do Supabase ficam só em variáveis de ambiente do servidor, nunca no front-end.
- **Supabase:** ativar RLS em todas as tabelas, com acesso apenas ao `auth.uid()` do dono.

---

## 3. Módulos e telas

### 3.1 Hoje (tela inicial)
- Atividade do dia conforme a semana (abaixo), com botão **Iniciar**.
- Calorias do dia: consumidas, meta e gasto do Garmin.
- Saldo da semana: quanto falta ou sobra para fechar a meta semanal.

### 3.2 Musculação
Já está pronta no `treino.html`. Migrar mantendo:
- Seletores: dia (Seg A / Qua B / Sex C), local (academia da rua / academia do prédio), tempo (1h20 completo, 50 min conjugado, 50 min simples).
- Por série: carga (kg), repetições e ✓. O ✓ dispara o timer de descanso. Nas superséries, o descanso só começa no último exercício do bloco.
- Timer com bipe (usar `navigator.audioSession.type = "playback"` no iOS), wake lock e botões −15, +15 e Pular.
- "Última vez" por exercício, para servir de referência de carga.
- Link de vídeo por exercício (busca no YouTube).
- Ao finalizar: duração, séries, volume (kg) e vínculo com a atividade "WeightTraining" do Strava do mesmo dia, para trazer calorias e frequência cardíaca.

### 3.3 Corrida
- Plano semanal, com sessões do tipo rodagem, intervalado, tempo run e longão. O pace alvo é calculado a partir das zonas do Strava.
- **Modo retorno de lesão:** ele está com dor no joelho e vai fazer fisioterapia. O plano precisa de um modo de volume reduzido, liberado pelo fisioterapeuta. Na tela, uma pergunta rápida pós-corrida: "dor de 0 a 10?". Se a dor for ≥ 3, o app sugere reduzir a próxima sessão e mostra um aviso para falar com o fisio.
- Importação automática das corridas pelo webhook do Strava.

**Dados atuais (Strava, até 13/10/2026):**

| Indicador | Valor |
|---|---|
| Meia maratona (20/09/2026, Meia da Reserva) | 21,1 km em 1h50min24s (5:14/km) |
| Longão mais recente (11/10, 15 km New Balance) | 14,9 km a 6:02/km, com dor no joelho |
| Rodagens típicas | 5 a 9 km entre 5:25 e 5:50/km |
| Volume recente | 15 a 22 km/semana, 2 a 3 corridas |
| 5 km estimado pelo Strava | 23:54 |
| Zonas de FC | Z1 <125, Z2 125–154, Z3 155–169, Z4 170–184, Z5 ≥185 |
| Zonas de pace (m/s) | Z1 <2,551 · Z2 2,551–2,963 · Z3 2,963–3,301 · Z4 3,301–3,526 · Z5 3,526–3,751 · Z6 >3,751 |
| Próxima prova | 30 km Hoka em 08/11/2026, **incerta** por causa do joelho |
| Plano anterior | Runna, "Meia Maratona da Reserva" |

### 3.4 Pilates e muay thai
- Pilates (Voll Pilates Vila Isabel, via Wellhub): registro de presença. O Garmin manda a atividade pelo Strava quando ele usa o relógio.
- Muay thai: registro manual de duração e intensidade (leve, moderada ou forte). Calorias estimadas por MET × peso atual.
- Reserva no Wellhub: abre 2 dias antes, a partir de cerca de 7h. Lembretes recorrentes às 7h já foram criados na Google Agenda (sáb, dom, seg e ter).

### 3.5 Nutrição
- **Foto da tabela nutricional** + quantidade consumida → o Claude lê a tabela (porção, kcal, carboidrato, proteína, gordura) e calcula pela quantidade.
- **Foto do prato** + peso de cada item → o Claude identifica os itens e estima pelas tabelas de referência (TACO/USDA).
- Edição manual sempre possível. A estimativa por foto é aproximada e deve ser mostrada como tal.
- **Meta diária e meta semanal:** quando o dia passa da meta, o app redistribui o excesso nos dias restantes da semana, com limite de no máximo 10–15% abaixo da meta diária por dia (nada de compensação agressiva).
- **Objetivo declarado:** definir, ou seja, perder gordura e ganhar massa (recomposição).

### 3.6 Bioimpedância
- Tabela e gráficos: peso, massa de gordura, % de gordura, massa muscular esquelética, massa livre de gordura, IMC e TMB.
- Upload do laudo novo (PDF ou foto). O Claude extrai os campos e o usuário confirma antes de salvar.
- Destaque automático quando a massa magra cai mais do que a gordura entre dois exames.

**Histórico inicial (InBody/Biospace, altura 184 cm):**

| Data | Peso (kg) | Gordura (kg) | % gordura | MME (kg) | IMC |
|---|---|---|---|---|---|
| 13/06/2025 | 141,3 | 59,8 | 42,3 | 46,8 | 41,7 |
| 21/08/2025 | 130,9 | 48,5 | 37,0 | 47,3 | 38,7 |
| 23/10/2025 | 121,8 | 34,0 | 27,9 | 50,5 | 36,0 |
| 26/12/2025 | 116,5 | 27,8 | 23,8 | 51,1 | 34,4 |
| 26/02/2026 | 111,6 | 26,0 | 23,3 | 49,4 | 33,0 |
| 30/04/2026 | 106,2 | 18,9 | 17,8 | 50,0 | 31,4 |
| 24/07/2026 | 106,1 | 18,0 | 17,0 | 50,7 | 31,3 |
| 17/09/2026 | 101,0 | 16,6 | 16,5 | 48,7 | 29,8 |

TMB no último exame: 2.192 kcal. Água corporal total: 61,5 L. Proteína: 16,8 kg. Minerais: 6,11 kg.

> Leitura: entre 24/07 e 17/09, saíram 5,1 kg de peso, mas só 1,4 kg de gordura. A massa livre de gordura caiu 3,7 kg e a MME caiu 2,0 kg. A meta calórica deve ser **moderada** e a proteína alta, para preservar a massa magra.

### 3.7 Protocolo (registro apenas)
Receituário de 17/09/2026, Dr. José Victor Rosa:

| Horário | Fórmula |
|---|---|
| Ao acordar (60 doses) | Kelp iodine 700 mcg, cocoabuterol 50 mg, espironolactona 70 mg, ioimbina 10 mg, alopurinol 300 mg, citrato de clomifeno 30 mg, Actrisave 200 mg, coenzima Q10 70 mg, urolitina A 70 mg, vitamina D3 20.000 UI, vitamina K2 MK7 140 mcg, cafeína anidra 170 mg, taurina 500 mg, tirosina 500 mg, tamoxifeno 20 mg |
| Junto à refeição (60 doses) | Clonapure 2,5 g |
| 1x por semana (8 doses) | Cabergolina 0,5 mg |
| 14h (60 doses) | Bupropiona 80 mg, naltrexona 8 mg, complexo C 500 mg, Cromminex 10 mg, Serenzo 100 mg |
| Jantar (60 doses) | Melatonina 3,5 mg, 5-HTP 150 mg, Pro Sleep 130 mg, metilfolato 1,0 mg, metilcobalamina 1,0 mg, vitamina E 500 UI, anastrozol 0,1 mg, citrato de clomifeno 30 mg, zinco quelado 30 mg, magnésio glicina 500 mg |

Funções: lista atual, data da receita, aviso de recompra (60 doses ≈ 60 dias a partir da data de início) e campo para subir receitas novas. **Sem recomendações de dose.**

---

## 4. Semana atual

| Dia | Atividades |
|---|---|
| Seg | Musculação A + pilates |
| Ter | Muay thai (corrida leve de manhã, opcional) |
| Qua | Musculação B + pilates |
| Qui | Muay thai |
| Sex | Musculação C + corrida moderada |
| Sáb | Corrida longa, ritmo leve |
| Dom | Descanso |

Regras: musculação antes da corrida e do pilates (ou com 6h e 2h de intervalo, respectivamente). Perna mais pesada na segunda. Abdômen só na sexta.

---

## 5. Modelo de dados (Supabase)

```
profiles(id, nome, altura_cm, data_nasc, objetivo)
workout_sessions(id, user_id, data, tipo[musculacao|corrida|pilates|muaythai|outro], plano_dia, local, duracao_s, kcal, fc_media, strava_activity_id, notas)
workout_sets(id, session_id, exercicio, ordem, serie, carga_kg, reps, ok)
run_plan(id, user_id, data, tipo, distancia_km, pace_alvo, descricao, status)
run_feedback(id, session_id, dor_0a10, local_dor, notas)
foods_log(id, user_id, data_hora, refeicao, descricao, quantidade_g, kcal, prot_g, carb_g, gord_g, origem[foto_tabela|foto_prato|manual], foto_path, confianca)
nutrition_targets(id, user_id, vigencia_inicio, kcal_dia, prot_g, carb_g, gord_g)
bioimpedance(id, user_id, data, peso, gordura_kg, pgc, mme, mlg, imc, tmb, agua_l, proteina_kg, minerais_kg, rcq, pdf_path)
protocol_items(id, user_id, receita_data, horario, item, dose, doses_total, inicio_uso, ativo)
strava_tokens(user_id, access_token, refresh_token, expires_at)  -- só servidor
```

---

## 6. Fases

1. **Fundação:** repositório, Next.js, Supabase (login e RLS), deploy na Vercel, PWA instalável.
2. **Musculação:** migrar o `treino.html` com os dados no Supabase.
3. **Bioimpedância e protocolo:** importar o histórico acima, gráficos e upload com leitura pelo Claude.
4. **Strava:** OAuth, importação do histórico, webhook e vínculo com as sessões.
5. **Corrida:** plano, modo retorno de lesão e feedback de dor.
6. **Nutrição:** registro por foto, metas diária e semanal, redistribuição.
7. **Tela Hoje:** junta tudo.
