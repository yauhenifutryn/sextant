import { HeaderBar } from "@/components/header-bar";

/**
 * Nested layout for the `/app/*` routes (D-26b). Mounts the global
 * <HeaderBar /> above all dashboard children. The landing route at `/`
 * does NOT include this layout, so the header bar is absent from the
 * marketing surface (D-18a, D-26a).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink overflow-x-hidden">
      <HeaderBar />
      {children}
    </div>
  );
}
