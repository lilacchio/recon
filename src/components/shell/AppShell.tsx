"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { Sidebar, BottomNav } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <div className="min-h-screen w-full bg-[#0a0a0a]">{children}</div>;
  }

  return (
    <div className="flex h-screen min-h-full flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <BottomNav />
      <StatusBar />
    </div>
  );
}
