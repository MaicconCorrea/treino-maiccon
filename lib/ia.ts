// Leitura de fotos e laudos com o Claude (só servidor)
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const MODEL = "claude-opus-5-5";

export function iaConfigurada() {
  return !!process.env.ANTHROPIC_API_KEY;
}

type Midia = { data: string; media_type: string };

function bloco(m: Midia): Anthropic.Beta.BetaContentBlockParam {
  if (m.media_type === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: m.data } };
  }
  return {
    type: "image",
    source: { type: "base64", media_type: m.media_type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: m.data },
  };
}

async function extrair<T extends z.ZodType>(schema: T, system: string, midias: Midia[], texto: string): Promise<z.infer<T>> {
  const client = new Anthropic();
  const r = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: [...midias.map(bloco), { type: "text", text: texto }] }],
    output_config: { format: betaZodOutputFormat(schema) },
  });
  if (r.stop_reason === "refusal") throw new Error("A IA não conseguiu ler este arquivo.");
  if (!r.parsed_output) throw new Error("Não foi possível interpretar a resposta da IA.");
  return r.parsed_output as z.infer<T>;
}

// Nutrição ---------------------------------------------------------------------
const num = z.number().nullable();
export const AlimentosSchema = z.object({
  itens: z.array(
    z.object({
      descricao: z.string(),
      quantidade_g: z.number(),
      kcal: z.number(),
      prot_g: z.number(),
      carb_g: z.number(),
      gord_g: z.number(),
    }),
  ),
  confianca: z.enum(["alta", "media", "baixa"]),
  observacao: z.string(),
});
export type Alimentos = z.infer<typeof AlimentosSchema>;

const SYS_NUTRI =
  "Você é um assistente de registro alimentar de um app pessoal brasileiro. Responda em português do Brasil. " +
  "Estime calorias e macronutrientes de forma realista. Use a Tabela Brasileira de Composição de Alimentos (TACO) " +
  "como referência principal e a USDA quando o alimento não estiver na TACO. Quando o usuário informar o peso de um item, " +
  "use exatamente esse peso. Não dê conselhos de dieta; apenas registre. Em 'observacao', diga em uma frase curta " +
  "o que foi considerado ou o que ficou incerto.";

export async function lerTabela(img: Midia, quantidade: number, unidade: string, descricao: string) {
  return extrair(
    AlimentosSchema,
    SYS_NUTRI,
    [img],
    `A foto é de uma tabela nutricional${descricao ? ` do produto "${descricao}"` : ""}. ` +
      `Leia a porção de referência e os valores por porção (kcal, carboidratos, proteínas, gorduras totais). ` +
      `O usuário consumiu ${quantidade} ${unidade}. Calcule proporcionalmente para essa quantidade e devolva um único item, ` +
      `com o nome do produto e quantidade_g = ${quantidade}. Se a tabela estiver ilegível, use confianca "baixa".`,
  );
}

export async function lerPrato(img: Midia | null, itensTexto: string) {
  return extrair(
    AlimentosSchema,
    SYS_NUTRI,
    img ? [img] : [],
    (img ? "A foto é de um prato de comida. Identifique cada alimento. " : "") +
      (itensTexto
        ? `O usuário informou os itens e pesos: "${itensTexto}". Use esses pesos. `
        : "O usuário não informou pesos: estime as porções pela foto e use confianca \"baixa\". ") +
      "Devolva um item por alimento com quantidade em gramas e macros estimados.",
  );
}

// Bioimpedância ----------------------------------------------------------------
export const BioSchema = z.object({
  data: z.string().nullable(),
  peso: num, gordura_kg: num, pgc: num, mme: num, mlg: num, imc: num, tmb: num,
  agua_l: num, proteina_kg: num, minerais_kg: num, rcq: num,
  observacao: z.string(),
});
export type Bio = z.infer<typeof BioSchema>;

export async function lerLaudo(arquivo: Midia) {
  return extrair(
    BioSchema,
    "Você extrai dados de laudos de bioimpedância (InBody, Biospace, Tanita etc.) para um app pessoal. " +
      "Responda em português do Brasil. Copie os valores exatamente como aparecem no laudo, sem estimar. " +
      "Campo ausente no laudo = null.",
    [arquivo],
    "Extraia: data do exame (AAAA-MM-DD), peso (kg), massa de gordura (kg), percentual de gordura (pgc, %), " +
      "massa muscular esquelética (mme, kg), massa livre de gordura (mlg, kg), IMC, taxa metabólica basal (tmb, kcal), " +
      "água corporal total (agua_l, L), proteína (kg), minerais (kg) e relação cintura-quadril (rcq). " +
      "Se a massa livre de gordura não aparecer mas peso e gordura aparecerem, deixe mlg null. " +
      "Em 'observacao', avise em uma frase se algum valor ficou ilegível.",
  );
}
