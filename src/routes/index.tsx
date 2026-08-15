import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Gauge, ShieldAlert, Users } from "lucide-react";
import { RiskMap } from "@/components/trinetra/RiskMap";
import { runEngine } from "@/lib/trinetra/engine";
import { useAppState } from "@/lib/trinetra/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TriNetra — Nagpur Traffic Risk & Deployment Command Center" },
      {
        name: "description",
        content:
          "Live AI risk heatmap of Nagpur junctions with explainable scores and police deployment recommendations.",
      },
      { property: "og:title", content: "TriNetra — Nagpur Traffic Command Center" },
      {
        property: "og:description",
        content: "Live AI risk heatmap and explainable police deployment decision support for Nagpur city.",
      },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const world = useAppState((s) => s.world);
  const incidents = useAppState((s) => s.incidents);
  const { results, metrics } = useMemo(() => runEngine(world), [world]);
  const [selected, setSelected] = useState<string | undefined>(results[0]?.junction.id);
  const active = results.find((r) => r.junction.id === selected) ?? results[0];

  const kpis = [
    { label: "Average City Risk", value: `${metrics.avgRisk}`, sub: "/100 composite", icon: Gauge, tone: "text-primary" },
    { label: "High-Risk Zones", value: `${metrics.highCount}`, sub: "score ≥ 71", icon: ShieldAlert, tone: "text-risk-high" },
    { label: "Officers Allocated", value: `${metrics.officersUsed}`, sub: `of ${world.totalOfficers} on roster`, icon: Users, tone: "text-risk-low" },
    { label: "Open Incidents", value: `${incidents.filter((i) => i.status !== "cleared").length}`, sub: "awaiting response", icon: AlertTriangle, tone: "text-risk-med" },
  ];

  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-primary">Operational Picture</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          Nagpur City <span className="text-gradient">Risk Grid</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Fused traffic, accident, violation, weather and event signals scored per junction — with a ranked,
          explainable "act here first" deployment list.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="panel animate-rise p-4 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k.label}</p>
              <k.icon className={`size-4 ${k.tone}`} />
            </div>
            <p className="mt-3 font-display text-4xl font-bold leading-none">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <div className="panel scanline relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Live Risk Heatmap</h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                28 monitored junctions · 15-min window
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <Legend color="var(--risk-low)" label="0–40" />
              <Legend color="var(--risk-med)" label="41–70" />
              <Legend color="var(--risk-high)" label="71–100" />
            </div>
          </div>
          <div className="h-[520px] w-full">
            <RiskMap results={results} selectedId={selected} onSelect={setSelected} />
          </div>
        </div>

        <div className="panel flex max-h-[600px] flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Act Here First</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Risk × (1 − coverage) ranking
            </p>
          </div>
          <ol className="flex-1 divide-y divide-border overflow-y-auto">
            {results.slice(0, 12).map((r, i) => (
              <li key={r.junction.id}>
                <button
                  onClick={() => setSelected(r.junction.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selected === r.junction.id ? "bg-surface-2" : "hover:bg-surface-2/60"
                  }`}
                >
                  <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.junction.name}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {r.junction.zone} · {r.officersPresent}/{r.officersRecommended} officers
                    </span>
                  </span>
                  <span
                    className="rounded px-2 py-1 font-mono text-xs font-bold"
                    style={{
                      background: `color-mix(in oklab, var(--risk-${r.band === "high" ? "high" : r.band === "medium" ? "med" : "low"}) 22%, transparent)`,
                      color: `var(--risk-${r.band === "high" ? "high" : r.band === "medium" ? "med" : "low"})`,
                    }}
                  >
                    {r.score}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {active && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="panel p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Explainability Layer</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">{active.junction.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.explanation}</p>
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px]">
              <Chip>{active.junction.roadType}</Chip>
              <Chip>{active.junction.laneCount} lanes</Chip>
              <Chip>{active.junction.hasSignal ? "signalled" : "unsignalled"}</Chip>
              {active.junction.nearSchool && <Chip>school zone</Chip>}
              {active.junction.nearHospital && <Chip>hospital</Chip>}
              {active.activeEvent && <Chip>{active.activeEvent}</Chip>}
            </div>
            <Link
              to="/deployment"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
            >
              Open deployment plan <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="panel p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Factor contribution (points of 100)
            </p>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["Traffic congestion", active.factors.congestion, 30],
                  ["Accident probability", active.factors.accident, 25],
                  ["Violation density", active.factors.violation, 15],
                  ["Weather impact", active.factors.weather, 10],
                  ["Event / crowd", active.factors.event, 10],
                  ["Road & structural", active.factors.structural, 10],
                ] as const
              ).map(([label, val, max]) => (
                <div key={label}>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">{label}</span>
                    <span>
                      +{val.toFixed(1)} <span className="text-muted-foreground">/ {max}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(val / max) * 100}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="panel overflow-hidden">
        <div className="flex whitespace-nowrap py-2">
          <div className="ticker-track flex gap-8 pr-8 font-mono text-xs text-muted-foreground">
            {[...results.slice(0, 10), ...results.slice(0, 10)].map((r, i) => (
              <span key={i}>
                <span className="text-primary">{r.junction.id}</span> {r.junction.name} · risk {r.score} · cong{" "}
                {(r.congestionIndex * 100).toFixed(0)}% · viol/hr {r.violationsPerHour}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 capitalize text-muted-foreground">
      {children}
    </span>
  );
}
