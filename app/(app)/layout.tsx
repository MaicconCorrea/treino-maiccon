import Tabbar from "@/components/tabbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <Tabbar />
    </>
  );
}
