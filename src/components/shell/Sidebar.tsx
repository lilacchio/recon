"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ScrollText,
  Radio,
  Info,
  Lightbulb,
  Skull,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { slug: "feed", label: "feed", href: "/feed", icon: Activity },
  { slug: "track", label: "track", href: "/track", icon: ScrollText },
  { slug: "kills", label: "kill list", href: "/kills", icon: Skull },
  { slug: "log", label: "agent log", href: "/log", icon: Radio },
  { slug: "how", label: "how it works", href: "/how-it-works", icon: Lightbulb },
  { slug: "about", label: "about", href: "/about", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)] lg:flex lg:w-[220px]">
      <div className="px-5 pt-6 pb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-mute)]">
          _&gt; navigation
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 px-2.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.slug}
              href={item.href}
              className="group flex items-center gap-3 rounded-[2px] px-3 py-2 font-sans text-[13px] transition-colors"
              style={{
                color: active ? "var(--accent)" : "var(--text-dim)",
                background: active ? "var(--accent-soft)" : "transparent",
              }}
            >
              <Icon
                className="h-[14px] w-[14px] shrink-0"
                strokeWidth={active ? 2.25 : 1.75}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto font-mono text-[9px] text-[var(--accent)]/60">
                  active
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] px-5 py-5 font-mono text-[10.5px] leading-[1.7] text-[var(--text-mute)]">
        <div className="mb-2 uppercase tracking-[0.2em] text-[9.5px]">
          system
        </div>
        <div>
          <span className="text-[var(--text-dim)]">chain</span>{" "}
          <span className="text-[var(--text)]">solana</span>
        </div>
        <div>
          <span className="text-[var(--text-dim)]">feed</span>{" "}
          <span className="text-[var(--text)]">birdeye</span>
        </div>
        <div>
          <span className="text-[var(--text-dim)]">llm</span>{" "}
          <span className="text-[var(--text)]">haiku-4.5</span>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="grid shrink-0 grid-cols-6 border-t border-[var(--border)] bg-[var(--bg)] lg:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.slug}
            href={item.href}
            className="flex flex-col items-center gap-1 py-2.5 font-mono text-[9.5px] tracking-[0.04em]"
            style={{
              color: active ? "var(--accent)" : "var(--text-mute)",
            }}
          >
            <Icon className="h-[16px] w-[16px]" strokeWidth={active ? 2.25 : 1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
