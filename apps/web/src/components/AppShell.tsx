"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md hover:bg-white/5 transition ${
        active ? "text-white" : "text-white/70"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0E0F1A] text-white/80">
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur bg-black/30">
        <nav className="mx-auto max-w-7xl flex gap-2 px-4 py-3">
          <NavLink href="/" label="Home" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/agents" label="Agents" />
          <NavLink href="/analytics" label="Analytics" />
          <NavLink href="/support" label="Support" />
          <NavLink href="/trends" label="Trends" />
          <NavLink href="/settings" label="Settings" />
          <NavLink href="/admin" label="Admin" />
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}


