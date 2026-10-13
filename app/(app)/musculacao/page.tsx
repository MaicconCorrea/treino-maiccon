import { Suspense } from "react";
import Treino from "./treino";

export const metadata = { title: "Musculação · Treino" };

export default function Page() {
  return (
    <Suspense>
      <Treino />
    </Suspense>
  );
}
