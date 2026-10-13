import { ImageResponse } from "next/og";

// Ícone do app: halter estilizado em fundo azul (cor de destaque do app)
export function renderIcon(size: number) {
  const s = size / 512;
  const bar = (w: number, h: number) => ({
    width: w * s,
    height: h * s,
    background: "#FFFFFF",
    borderRadius: 14 * s,
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2C55E0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10 * s,
        }}
      >
        <div style={bar(44, 170)} />
        <div style={bar(44, 250)} />
        <div style={{ ...bar(120, 40), borderRadius: 6 * s }} />
        <div style={bar(44, 250)} />
        <div style={bar(44, 170)} />
      </div>
    ),
    { width: size, height: size },
  );
}
