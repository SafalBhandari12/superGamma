import type { ChartSpec } from "@supergamma/schema";

/**
 * Chart marks follow one fixed spec everywhere, which is what makes a chart
 * read as part of the tile rather than an image pasted into it:
 *
 *   bars      ≤20 units thick, 4px rounded data-end, square at the baseline
 *   lines     2px, round cap/join
 *   markers   r ≥ 4 (≥8px), with a 2px surface-coloured ring
 *   fills     touching marks separated by a 2px surface gap, never a stroke
 *   area      the series hue at ~10% opacity, a wash not a block
 *   axes      hairline, one step off the surface, recessive
 *
 * Colour comes from --series-N (validated for colour-vision separation), never
 * from the decorative --tN tile fills. Text always wears a text token.
 */

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"] as const;

/** Column bar with rounded top corners only, anchored square to the baseline. */
function columnPath(x: number, y: number, w: number, baseline: number, r = 4): string {
  const radius = Math.min(r, w / 2, Math.max(baseline - y, 0));
  return `M${x},${baseline} L${x},${y + radius} q0,${-radius} ${radius},${-radius} h${
    w - radius * 2
  } q${radius},0 ${radius},${radius} L${x + w},${baseline} Z`;
}

function niceMax(values: number[]): number {
  const max = Math.max(...values.map(Math.abs), 0);
  return max === 0 ? 1 : max * 1.15;
}

function ColumnChart({ chart }: { chart: Extract<ChartSpec, { kind: "column" | "bar" }> }) {
  const points = chart.points;
  const max = niceMax(points.map((p) => p.value));
  const baseline = 122;
  const slot = 260 / points.length;
  const barW = Math.min(20, slot * 0.5);

  return (
    <svg className="bento-viz" viewBox="0 0 270 152" preserveAspectRatio="xMidYMid meet" role="img">
      <line className="v-axis" x1="4" y1={baseline} x2="266" y2={baseline} />
      {points.map((p, i) => {
        const h = (Math.abs(p.value) / max) * 92;
        const x = 5 + slot * i + (slot - barW) / 2;
        const y = baseline - h;
        const emphasised = chart.kind === "column" && chart.emphasisIndex !== undefined;
        const isLead = emphasised && chart.emphasisIndex === i;
        return (
          <g key={p.label + i}>
            <path
              className={emphasised && !isLead ? "v-bar-mute" : "v-bar"}
              d={columnPath(x, y, barW, baseline)}
            />
            <text className="v-val" x={x + barW / 2} y={y - 6} textAnchor="middle">
              {p.value}
              {chart.unit ?? ""}
            </text>
            <text className="v-cat" x={x + barW / 2} y={baseline + 16} textAnchor="middle">
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bars — the right call the moment category names would wrap. */
function BarChart({ chart }: { chart: Extract<ChartSpec, { kind: "bar" }> }) {
  const max = niceMax(chart.points.map((p) => p.value));
  const rowH = 140 / chart.points.length;
  const barH = Math.min(18, rowH * 0.42);

  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      {chart.points.map((p, i) => {
        const w = (Math.abs(p.value) / max) * 196;
        const y = i * rowH + 4;
        return (
          <g key={p.label + i}>
            <text className="v-cat" x="2" y={y + 10}>
              {p.label}
            </text>
            <rect className="v-bar" x="2" y={y + 15} width={w} height={barH} rx="4" />
            <text className="v-val" x={w + 8} y={y + 15 + barH - 3}>
              {p.value}
              {chart.unit ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ chart }: { chart: Extract<ChartSpec, { kind: "line" }> }) {
  const all = chart.series.flatMap((s) => s.values);
  const max = niceMax(all);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const n = Math.max(chart.xLabels.length, 1);
  const px = (i: number) => 16 + (i * 244) / Math.max(n - 1, 1);
  const py = (v: number) => 122 - ((v - min) / span) * 104;

  return (
    <svg className="bento-viz" viewBox="0 0 270 152" preserveAspectRatio="xMidYMid meet" role="img">
      <line className="v-axis" x1="10" y1="122" x2="266" y2="122" />
      {chart.series.map((s, si) => (
        <g key={s.name}>
          <polyline
            className="v-line"
            style={{ stroke: SERIES[si % 3] }}
            points={s.values.map((v, i) => `${px(i)},${py(v)}`).join(" ")}
          />
          <circle
            cx={px(s.values.length - 1)}
            cy={py(s.values[s.values.length - 1])}
            r="4"
            fill={SERIES[si % 3]}
            stroke="var(--s2)"
            strokeWidth="2"
          />
        </g>
      ))}
      {chart.xLabels.map((l, i) =>
        i === 0 || i === chart.xLabels.length - 1 ? (
          <text key={l + i} className="v-cat" x={px(i)} y="140" textAnchor={i === 0 ? "start" : "end"}>
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

function AreaChart({ chart }: { chart: Extract<ChartSpec, { kind: "area" }> }) {
  const max = niceMax(chart.values);
  const n = chart.values.length;
  const px = (i: number) => 12 + (i * 246) / Math.max(n - 1, 1);
  const py = (v: number) => 122 - (v / max) * 104;
  const line = chart.values.map((v, i) => `${px(i)},${py(v)}`).join(" ");

  return (
    <svg className="bento-viz" viewBox="0 0 270 152" preserveAspectRatio="xMidYMid meet" role="img">
      <line className="v-axis" x1="8" y1="122" x2="266" y2="122" />
      <polygon className="v-area" style={{ fill: "var(--t1)" }} points={`${line} ${px(n - 1)},122 ${px(0)},122`} />
      <polyline className="v-line" style={{ stroke: "var(--t1)" }} points={line} />
      <circle cx={px(n - 1)} cy={py(chart.values[n - 1])} r="4" fill="var(--t1)" stroke="var(--s2)" strokeWidth="2" />
      {chart.xLabels.map((l, i) =>
        i === 0 || i === chart.xLabels.length - 1 ? (
          <text key={l + i} className="v-cat" x={px(i)} y="140" textAnchor={i === 0 ? "start" : "end"}>
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** Hole at ~57% of the outer radius — inside the 40-60% band that reads as a donut. */
function DonutChart({ chart }: { chart: Extract<ChartSpec, { kind: "donut" }> }) {
  const total = chart.slices.reduce((sum, s) => sum + Math.abs(s.value), 0) || 1;
  const r = 46;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg className="bento-viz" viewBox="0 0 150 150" preserveAspectRatio="xMidYMid meet" role="img">
      <g transform="rotate(-90 75 75)">
        {chart.slices.map((s, i) => {
          const frac = Math.abs(s.value) / total;
          // 2px surface gap between segments — separation by space, not stroke.
          const len = Math.max(frac * circumference - 2, 1);
          const dash = `${len} ${circumference - len}`;
          const el = (
            <circle
              key={s.label + i}
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke={SERIES[i % 3]}
              strokeWidth="24"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += frac * circumference;
          return el;
        })}
      </g>
      {chart.centerValue ? (
        <text x="75" y="76" textAnchor="middle" style={{ fill: "var(--text)", fontSize: 20, fontWeight: 800 }}>
          {chart.centerValue}
        </text>
      ) : null}
      {chart.centerLabel ? (
        <text x="75" y="92" textAnchor="middle" className="v-cat">
          {chart.centerLabel}
        </text>
      ) : null}
    </svg>
  );
}

/** A share you can count, which beats a pie for "how many out of a hundred". */
function WaffleChart({ chart }: { chart: Extract<ChartSpec, { kind: "waffle" }> }) {
  const filled = Math.round(chart.percent);
  return (
    <svg className="bento-viz" viewBox="0 0 150 150" preserveAspectRatio="xMidYMid meet" role="img">
      {Array.from({ length: 100 }, (_, i) => (
        <rect
          key={i}
          x={8 + (i % 10) * 14}
          y={8 + Math.floor(i / 10) * 14}
          width="10"
          height="10"
          rx="2.5"
          fill={i < filled ? "var(--t1)" : "var(--border)"}
        />
      ))}
    </svg>
  );
}

function DivergingChart({ chart }: { chart: Extract<ChartSpec, { kind: "diverging" }> }) {
  const max = niceMax(chart.points.map((p) => p.value));
  const rowH = 138 / chart.points.length;
  const barH = Math.min(16, rowH * 0.45);
  const mid = 150;

  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      <line className="v-axis" x1={mid} y1="4" x2={mid} y2="142" />
      {chart.points.map((p, i) => {
        const w = (Math.abs(p.value) / max) * 104;
        const y = i * rowH + 6;
        const positive = p.value >= 0;
        return (
          <g key={p.label + i}>
            <text className="v-cat" x="2" y={y + barH - 2}>
              {p.label}
            </text>
            <rect
              x={positive ? mid : mid - w}
              y={y}
              width={w}
              height={barH}
              rx="4"
              fill={positive ? "var(--positive)" : "var(--negative)"}
            />
            <text className="v-val" x={positive ? mid + w + 6 : mid - w - 6} y={y + barH - 2} textAnchor={positive ? "start" : "end"}>
              {p.value > 0 ? `+${p.value}` : p.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Bar is actual, the tick is target — the honest form for "are we on track". */
function BulletChart({ chart }: { chart: Extract<ChartSpec, { kind: "bullet" }> }) {
  const rowH = 140 / chart.items.length;
  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      {chart.items.map((item, i) => {
        const scale = Math.max(item.actual, item.target) * 1.15 || 1;
        const y = i * rowH + 6;
        const w = (item.actual / scale) * 260;
        const tx = 4 + (item.target / scale) * 260;
        return (
          <g key={item.label + i}>
            <text className="v-cat" x="4" y={y + 10}>
              {item.label}
            </text>
            <rect x="4" y={y + 15} width="260" height="14" rx="4" fill="var(--border)" />
            <rect x="4" y={y + 15} width={w} height="14" rx="4" fill="var(--t1)" />
            <line x1={tx} y1={y + 11} x2={tx} y2={y + 33} stroke="var(--text)" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function DumbbellChart({ chart }: { chart: Extract<ChartSpec, { kind: "dumbbell" }> }) {
  const all = chart.items.flatMap((i) => [i.before, i.after]);
  const max = niceMax(all);
  const rowH = 132 / chart.items.length;

  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      {chart.items.map((item, i) => {
        const y = i * rowH + 16;
        const x1 = 70 + (item.before / max) * 180;
        const x2 = 70 + (item.after / max) * 180;
        return (
          <g key={item.label + i}>
            <text className="v-cat" x="2" y={y + 4}>
              {item.label}
            </text>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--border)" strokeWidth="2" />
            <circle cx={x1} cy={y} r="5" fill="var(--muted)" />
            <circle cx={x2} cy={y} r="5" fill="var(--t1)" />
          </g>
        );
      })}
    </svg>
  );
}

/** Ordered stages take an ordinal ramp — one hue, stepping down. */
function FunnelChart({ chart }: { chart: Extract<ChartSpec, { kind: "funnel" }> }) {
  const rowH = 144 / chart.stages.length;
  const top = chart.stages[0]?.value || 1;

  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      {chart.stages.map((s, i) => {
        const w = Math.max((s.value / top) * 258, 40);
        const y = i * rowH + 3;
        const h = Math.min(rowH - 6, 26);
        return (
          <g key={s.label + i}>
            <rect x={(270 - w) / 2} y={y} width={w} height={h} rx="4" fill="var(--t1)" opacity={1 - i * 0.18} />
            <text className="v-val" x="135" y={y + h / 2 + 4} textAnchor="middle" style={{ fill: "var(--on-tone)" }}>
              {s.label} · {s.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GanttChart({ chart }: { chart: Extract<ChartSpec, { kind: "gantt" }> }) {
  const rowH = 122 / chart.lanes.length;
  const x = (pct: number) => 62 + (pct / 100) * 200;

  return (
    <svg className="bento-viz" viewBox="0 0 270 150" preserveAspectRatio="xMidYMid meet" role="img">
      {chart.axisLabels.map((l, i) => {
        const gx = x((i / Math.max(chart.axisLabels.length - 1, 1)) * 100);
        return (
          <g key={l + i}>
            <line className="v-axis" x1={gx} y1="4" x2={gx} y2="126" opacity=".6" />
            <text className="v-cat" x={gx} y="142" textAnchor="middle">
              {l}
            </text>
          </g>
        );
      })}
      {chart.lanes.map((lane, i) => {
        const y = i * rowH + 8;
        const x1 = x(Math.min(lane.start, lane.end));
        const x2 = x(Math.max(lane.start, lane.end));
        return (
          <g key={lane.label + i}>
            <text className="v-cat" x="2" y={y + 12}>
              {lane.label}
            </text>
            <rect x={x1} y={y} width={Math.max(x2 - x1, 4)} height={Math.min(rowH - 8, 16)} rx="4" fill={SERIES[i % 3]} />
          </g>
        );
      })}
    </svg>
  );
}

/** A legend is present for two or more series; one series needs none. */
export function ChartLegend({ chart }: { chart: ChartSpec }) {
  const names =
    chart.kind === "line"
      ? chart.series.map((s) => s.name)
      : chart.kind === "donut"
        ? chart.slices.map((s) => s.label)
        : chart.kind === "gantt"
          ? chart.lanes.map((l) => l.label)
          : [];
  if (names.length < 2) return null;

  return (
    <div className="bento-legend">
      {names.map((name, i) => (
        <span className="bento-leg" key={name + i}>
          <i style={{ background: SERIES[i % 3] }} />
          {name}
        </span>
      ))}
    </div>
  );
}

export function Chart({ chart }: { chart: ChartSpec }) {
  switch (chart.kind) {
    case "column":
      return <ColumnChart chart={chart} />;
    case "bar":
      return <BarChart chart={chart} />;
    case "line":
      return <LineChart chart={chart} />;
    case "area":
      return <AreaChart chart={chart} />;
    case "donut":
      return <DonutChart chart={chart} />;
    case "waffle":
      return <WaffleChart chart={chart} />;
    case "diverging":
      return <DivergingChart chart={chart} />;
    case "bullet":
      return <BulletChart chart={chart} />;
    case "dumbbell":
      return <DumbbellChart chart={chart} />;
    case "funnel":
      return <FunnelChart chart={chart} />;
    case "gantt":
      return <GanttChart chart={chart} />;
    default: {
      const _exhaustive: never = chart;
      return _exhaustive;
    }
  }
}
