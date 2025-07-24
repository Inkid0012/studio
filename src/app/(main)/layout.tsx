import { BottomNavBar } from "@/components/layout/bottom-nav-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">{children}</main>
      <BottomNavBar />
    </div>
  );
}
