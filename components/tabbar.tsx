import Link from "next/link";

// Abas do app. As que ainda não existem aparecem apagadas até a fase correspondente.
const TABS = [
  { href: "/", label: "Hoje", ic: "H", pronto: true },
  { href: "/musculacao", label: "Treino", ic: "M", pronto: false },
  { href: "/corrida", label: "Corrida", ic: "C", pronto: false },
  { href: "/nutricao", label: "Nutrição", ic: "N", pronto: false },
  { href: "/corpo", label: "Corpo", ic: "B", pronto: false },
];

export default function Tabbar({ atual }: { atual: string }) {
  return (
    <nav className="tabbar" aria-label="Seções">
      <ul>
        {TABS.map((t) => (
          <li key={t.href}>
            {t.pronto ? (
              <Link href={t.href} aria-current={atual === t.href ? "page" : undefined}>
                <i>{t.ic}</i>
                {t.label}
              </Link>
            ) : (
              <span title="Em breve">
                <i>{t.ic}</i>
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
