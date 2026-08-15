import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FlaskConical,
  Map as MapIcon,
  Radar,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAppState, actions } from "@/lib/trinetra/store";
import { hourLabel, runEngine } from "@/lib/trinetra/engine";
import type { WeatherCondition } from "@/lib/trinetra/data";

const NAV = [
  { to: "/", label: "Command Center", icon: MapIcon, desc: "Live risk grid" },
  { to: "/risk", label: "Risk Intelligence", icon: Radar, desc: "Factor decomposition" },
  { to: "/deployment", label: "Deployment", icon: Users, desc: "Officer allocation" },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle, desc: "Live response" },
  { to: "/simulator", label: "Digital Twin", icon: FlaskConical, desc: "What-if rehearsal" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, desc: "Trends & audit" },
] as const;

const WEATHERS: WeatherCondition[] = ["clear", "light-rain", "heavy-rain", "fog"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const world = useAppState((s) => s.world);
  const { metrics } = runEngine(world);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="relative grid size-10 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <ShieldCheck className="size-5 text-primary-foreground" />
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-risk-low animate-blink" />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none tracking-wide">TriNetra</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Nagpur City Grid
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, desc }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 ${
                  active
                    ? "bg-surface-2 text-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 shrink-0 transition-colors ${active ? "text-primary" : ""}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{desc}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">High-risk coverage</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.coveragePct}%`, background: "var(--gradient-risk)" }}
            />
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">{metrics.coveragePct}% covered</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[500] border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <ShieldCheck className="size-5 text-primary" />
              <span className="font-display text-lg font-bold">TriNetra</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
              <Activity className="size-3.5 text-risk-low animate-blink" />
              <span className="font-mono text-xs text-muted-foreground">LIVE FEED</span>
            </div>

            <label className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Clock</span>
              <input
                type="range"
                min={0}
                max={23}
                value={world.hour}
                onChange={(e) => actions.setWorld({ hour: Number(e.target.value) })}
                className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary sm:w-40"
              />
              <span className="w-20 font-mono text-xs text-foreground">{hourLabel(world.hour)}</span>
            </label>

            <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
              {WEATHERS.map((w) => (
                <button
                  key={w}
                  onClick={() => actions.setWorld({ weather: w })}
                  className={`rounded px-2 py-1 font-mono text-[11px] capitalize transition-colors ${
                    world.weather === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w.replace("-", " ")}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-4 font-mono text-xs">
              <span className="text-muted-foreground">
                AVG RISK <span className="text-foreground">{metrics.avgRisk}</span>
              </span>
              <span className="text-risk-high">HIGH {metrics.highCount}</span>
              <span className="text-risk-med">MED {metrics.mediumCount}</span>
              <span className="text-risk-low">LOW {metrics.lowCount}</span>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                  pathname === to ? "bg-surface-2 text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
