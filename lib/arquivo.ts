"use client";

import { createClient } from "./supabase/client";

export type Midia = { data: string; media_type: string };

// Reduz a foto para no máximo 1600 px em JPEG (fotos do iPhone passam de 4 MB)
export async function comprimirImagem(file: File, max = 1600, qualidade = 0.85): Promise<{ midia: Midia; blob: Blob }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", qualidade));
    return { midia: { data: await paraBase64(blob), media_type: "image/jpeg" }, blob };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function paraBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

// PDF segue como está; imagem é comprimida
export async function prepararArquivo(file: File): Promise<{ midia: Midia; blob: Blob; ext: string }> {
  if (file.type === "application/pdf") {
    return { midia: { data: await paraBase64(file), media_type: "application/pdf" }, blob: file, ext: "pdf" };
  }
  const { midia, blob } = await comprimirImagem(file);
  return { midia, blob, ext: "jpg" };
}

// Envia para o bucket privado, na pasta do usuário. Devolve o caminho salvo.
export async function enviar(bucket: "fotos" | "laudos" | "receitas", blob: Blob, ext: string): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type || undefined });
  return error ? null : path;
}

export async function linkAssinado(bucket: string, path: string): Promise<string | null> {
  const { data } = await createClient().storage.from(bucket).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
