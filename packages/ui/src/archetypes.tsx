import type { Slide } from "@supergamma/schema";
import { tilesFor } from "@supergamma/schema";
import { Chart, ChartLegend } from "./charts.js";
import { Label, Stat, StatTile, Tile, byId } from "./Tile.js";

/**
 * One component per archetype. Each asks the grid module where its tiles go
 * and then fills them — no component computes placement, spans, or surfaces.
 *
 * `byId` returning undefined means the grid gave this slide fewer tiles than
 * the content has (e.g. a rail timeline capped at four rows), so the extra
 * content is dropped rather than overflowing the slide.
 */

type For<K extends Slide["archetype"]> = Extract<Slide, { archetype: K }>;

export function HeroSlide({ slide }: { slide: For<"hero"> }) {
  const tiles = tilesFor(slide);
  const anchor = byId(tiles, "anchor")!;
  const footer = byId(tiles, "footer")!;

  return (
    <>
      <Tile tile={anchor}>
        {slide.eyebrow ? (
          <span className="bento-row">
            <i className="bento-dot" />
            <Label>{slide.eyebrow}</Label>
          </span>
        ) : null}
        <div className="bento-spacer" />
        <div className="bento-title">{slide.title}</div>
        <div className="bento-subtitle">{slide.subtitle}</div>
      </Tile>
      {slide.stats.map((stat, i) => {
        const tile = byId(tiles, `stat${i}`);
        return tile ? <StatTile key={i} tile={tile} label={stat.label} value={stat.value} /> : null;
      })}
      <Tile tile={footer} row>
        <span className="bento-body">{slide.footerLeft ?? ""}</span>
        <div className="bento-spacer" />
        <span className="bento-body">{slide.footerRight ?? ""}</span>
      </Tile>
    </>
  );
}

export function StatGridSlide({ slide }: { slide: For<"statGrid"> }) {
  const tiles = tilesFor(slide);
  const lead = byId(tiles, "lead")!;

  return (
    <>
      <Tile tile={lead}>
        <Label>{slide.leadLabel}</Label>
        <div className="bento-spacer" />
        <Stat value={slide.leadValue} xl />
        <div className="bento-body">{slide.leadNote}</div>
      </Tile>
      {slide.stats.map((stat, i) => {
        const tile = byId(tiles, `stat${i}`);
        return tile ? <StatTile key={i} tile={tile} label={stat.label} value={stat.value} /> : null;
      })}
    </>
  );
}

export function QuadrantSlide({ slide }: { slide: For<"quadrant"> }) {
  const tiles = tilesFor(slide);
  return (
    <>
      {slide.cells.map((cell, i) => {
        const tile = byId(tiles, `cell${i}`);
        if (!tile) return null;
        return (
          <Tile key={i} tile={tile} ghost={String(i + 1).padStart(2, "0")}>
            <Label>{cell.label}</Label>
            <div className="bento-heading">{cell.heading}</div>
            <div className="bento-body">{cell.body}</div>
          </Tile>
        );
      })}
    </>
  );
}

export function FeatureGridSlide({ slide }: { slide: For<"featureGrid"> }) {
  const tiles = tilesFor(slide);
  const anchor = byId(tiles, "anchor")!;
  return (
    <>
      <Tile tile={anchor} center>
        <Label>{slide.label}</Label>
        <div className="bento-statement">{slide.statement}</div>
      </Tile>
      {slide.features.map((feature, i) => {
        const tile = byId(tiles, `feature${i}`);
        if (!tile) return null;
        return (
          <Tile key={i} tile={tile} center>
            <Label>{String(i + 1).padStart(2, "0")}</Label>
            <div className="bento-heading">{feature.heading}</div>
          </Tile>
        );
      })}
    </>
  );
}

export function ChartSlide({ slide }: { slide: For<"chart"> }) {
  const tiles = tilesFor(slide);
  const chartTile = byId(tiles, "chart")!;
  const takeaway = byId(tiles, "takeaway");

  return (
    <>
      <Tile tile={chartTile}>
        <Label>{slide.label}</Label>
        <Chart chart={slide.chart} />
        <ChartLegend chart={slide.chart} />
      </Tile>
      {(slide.sideStats ?? []).map((stat, i) => {
        const tile = byId(tiles, `side${i}`);
        return tile ? <StatTile key={i} tile={tile} label={stat.label} value={stat.value} /> : null;
      })}
      {takeaway ? (
        <Tile tile={takeaway} row>
          <i className="bento-dot" />
          <span className="bento-body">{slide.takeaway ?? ""}</span>
        </Tile>
      ) : null}
    </>
  );
}

/**
 * The venn is drawn with each circle carrying a 2px ring in the canvas colour,
 * so overlaps stay legible where the fills cross rather than muddying.
 */
export function DiagramSlide({ slide }: { slide: For<"diagram"> }) {
  const tiles = tilesFor(slide);
  const diagram = byId(tiles, "diagram")!;
  const statement = byId(tiles, "statement")!;
  const proof = byId(tiles, "proof");
  const three = slide.sets.length >= 3;
  const centres = three
    ? [
        { cx: 76, cy: 62 },
        { cx: 124, cy: 62 },
        { cx: 100, cy: 104 },
      ]
    : [
        { cx: 76, cy: 80 },
        { cx: 124, cy: 80 },
      ];

  return (
    <>
      <Tile tile={diagram}>
        <Label>{slide.label}</Label>
        <svg className="bento-viz" viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" role="img">
          <g style={{ fillOpacity: 0.55, stroke: "var(--canvas)", strokeWidth: 2 }}>
            {slide.sets.map((_, i) => (
              <circle key={i} cx={centres[i].cx} cy={centres[i].cy} r="42" fill={`var(--series-${(i % 3) + 1})`} />
            ))}
          </g>
          <text
            x="100"
            y={three ? 82 : 84}
            textAnchor="middle"
            style={{ fill: "var(--text)", fontSize: 10, fontWeight: 700 }}
          >
            {slide.overlapLabel}
          </text>
        </svg>
        <div className="bento-legend">
          {slide.sets.map((set, i) => (
            <span className="bento-leg" key={i}>
              <i style={{ background: `var(--series-${(i % 3) + 1})` }} />
              {set.label}
            </span>
          ))}
        </div>
      </Tile>
      <Tile tile={statement} center>
        <div className="bento-statement">{slide.statement}</div>
      </Tile>
      {proof && slide.proof ? (
        <StatTile tile={proof} label={slide.proof.label} value={slide.proof.value} />
      ) : null}
    </>
  );
}

export function ProcessSlide({ slide }: { slide: For<"process"> }) {
  const tiles = tilesFor(slide);
  const header = byId(tiles, "header")!;
  const flow = byId(tiles, "flow")!;
  const n = slide.steps.length;
  const slot = 600 / n;

  return (
    <>
      <Tile tile={header} row>
        <Label>{slide.label}</Label>
        <div className="bento-spacer" />
        {slide.meta ? <Label>{slide.meta}</Label> : null}
      </Tile>
      <Tile tile={flow} center>
        <svg className="bento-viz" viewBox="0 0 620 130" preserveAspectRatio="xMidYMid meet" role="img">
          {slide.steps.map((step, i) => {
            const cx = 20 + slot * i + slot / 2;
            const last = i === n - 1;
            return (
              <g key={i}>
                {i > 0 ? (
                  <line
                    x1={cx - slot + 24}
                    y1="44"
                    x2={cx - 24}
                    y2="44"
                    stroke="var(--border)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : null}
                <circle
                  cx={cx}
                  cy="44"
                  r="22"
                  fill={last ? "var(--t1)" : "var(--s1)"}
                  stroke={last ? "none" : "var(--t1)"}
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y="49"
                  textAnchor="middle"
                  style={{
                    fill: last ? "var(--on-tone)" : "var(--t1)",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
                <text x={cx} y="90" textAnchor="middle" style={{ fill: "var(--text)", fontSize: 13, fontWeight: 600 }}>
                  {step.label}
                </text>
                <text x={cx} y="108" textAnchor="middle" className="v-cat">
                  {step.detail}
                </text>
              </g>
            );
          })}
        </svg>
      </Tile>
      {(slide.footnotes ?? []).map((note, i) => {
        const tile = byId(tiles, `note${i}`);
        if (!tile) return null;
        return (
          <Tile key={i} tile={tile} row>
            <i className="bento-dot" />
            <span className="bento-body">{note}</span>
          </Tile>
        );
      })}
    </>
  );
}

/**
 * Three genuinely different treatments rather than three boxes in a row.
 * "series" is the strongest when a number actually grew: the milestones sit on
 * the real curve, so the shape of the growth carries information by itself.
 */
export function TimelineSlide({ slide }: { slide: For<"timeline"> }) {
  const tiles = tilesFor(slide);

  if (slide.variant === "swimlane") {
    const header = byId(tiles, "header")!;
    const lanesTile = byId(tiles, "lanes")!;
    const lanes = slide.lanes?.length
      ? slide.lanes
      : slide.milestones.map((m, i) => ({
          label: m.label,
          start: (i / slide.milestones.length) * 100,
          end: ((i + 1.6) / slide.milestones.length) * 100,
        }));

    return (
      <>
        <Tile tile={header} row>
          <Label>{slide.label}</Label>
          <div className="bento-spacer" />
          <Label>
            {slide.milestones[0]?.when} → {slide.milestones[slide.milestones.length - 1]?.when}
          </Label>
        </Tile>
        <Tile tile={lanesTile} center>
          <svg className="bento-viz" viewBox="0 0 620 180" preserveAspectRatio="xMidYMid meet" role="img">
            {lanes.map((lane, i) => {
              const rowH = 150 / lanes.length;
              const y = i * rowH + 6;
              const x1 = 96 + (Math.min(lane.start, lane.end) / 100) * 500;
              const x2 = 96 + (Math.max(lane.start, lane.end) / 100) * 500;
              return (
                <g key={i}>
                  <text className="v-cat" x="2" y={y + 16}>
                    {lane.label}
                  </text>
                  <rect
                    x={x1}
                    y={y}
                    width={Math.max(x2 - x1, 6)}
                    height={Math.min(rowH - 10, 24)}
                    rx="6"
                    fill={`var(--series-${(i % 3) + 1})`}
                  />
                </g>
              );
            })}
          </svg>
        </Tile>
      </>
    );
  }

  if (slide.variant === "rail") {
    const anchor = byId(tiles, "anchor")!;
    return (
      <>
        {/* A label plus a date range does not fill a full-height tile, so the
            anchor also carries the milestone names as chips. */}
        <Tile tile={anchor} center>
          <Label>{slide.label}</Label>
          <div className="bento-statement">
            {slide.milestones[0]?.when} → {slide.milestones[slide.milestones.length - 1]?.when}
          </div>
          <div className="bento-spacer" />
          <div className="bento-chips">
            {slide.milestones.map((m, i) => (
              <span className="bento-chip" key={i}>
                {m.label}
              </span>
            ))}
          </div>
        </Tile>
        {slide.milestones.map((m, i) => {
          const tile = byId(tiles, `milestone${i}`);
          if (!tile) return null;
          return (
            <Tile key={i} tile={tile} row>
              <Label>{m.when}</Label>
              <div className="bento-heading">{m.label}</div>
              <div className="bento-spacer" />
              <span className="bento-body">{m.detail}</span>
            </Tile>
          );
        })}
      </>
    );
  }

  // series
  const plot = byId(tiles, "plot")!;
  const values = slide.metric?.values ?? slide.milestones.map((_, i) => i + 1);
  const max = Math.max(...values, 1) * 1.12;
  const px = (i: number) => 20 + (i * 580) / Math.max(values.length - 1, 1);
  const py = (v: number) => 170 - (v / max) * 140;
  const line = values.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  // Milestones are pinned along the curve at even intervals of the series.
  const markerAt = (i: number) =>
    Math.round((i / Math.max(slide.milestones.length - 1, 1)) * (values.length - 1));

  return (
    <>
      <Tile tile={plot}>
        <Label>
          {slide.label}
          {slide.metric ? ` · ${slide.metric.name}` : ""}
        </Label>
        <svg className="bento-viz" viewBox="0 0 620 190" preserveAspectRatio="none" role="img">
          <polygon
            className="v-area"
            style={{ fill: "var(--t1)" }}
            points={`${line} ${px(values.length - 1)},178 ${px(0)},178`}
          />
          <polyline className="v-line" style={{ stroke: "var(--t1)", strokeWidth: 3 }} points={line} />
          {slide.milestones.map((_, i) => {
            const idx = markerAt(i);
            return (
              <g key={i}>
                <line x1={px(idx)} y1={py(values[idx])} x2={px(idx)} y2="178" stroke="var(--border)" strokeWidth="2" />
                <circle cx={px(idx)} cy={py(values[idx])} r="7" fill="var(--t1)" stroke="var(--s2)" strokeWidth="3" />
              </g>
            );
          })}
        </svg>
      </Tile>
      {slide.milestones.slice(0, 3).map((m, i) => {
        const tile = byId(tiles, `milestone${i}`);
        if (!tile) return null;
        return (
          <Tile key={i} tile={tile} center>
            <Label>
              {m.when} · {m.label}
            </Label>
            <div className="bento-body">{m.detail}</div>
          </Tile>
        );
      })}
    </>
  );
}

export function ComparisonSlide({ slide }: { slide: For<"comparison"> }) {
  const tiles = tilesFor(slide);
  const ours = byId(tiles, "ours")!;
  const theirs = byId(tiles, "theirs")!;
  const proof = byId(tiles, "proof")!;

  return (
    <>
      <Tile tile={ours} center>
        {/* No dot here: it sits directly above a bulleted list, where a
            decorative marker reads as a stray first bullet. */}
        <Label>{slide.ours.label}</Label>
        <div className="bento-statement">{slide.ours.heading}</div>
        <div className="bento-list">
          {slide.ours.points.map((p, i) => (
            <div className="bento-list-item" key={i}>
              {p}
            </div>
          ))}
        </div>
      </Tile>
      <Tile tile={theirs}>
        <Label>{slide.theirs.label}</Label>
        <div className="bento-heading">{slide.theirs.heading}</div>
        <div className="bento-list">
          {slide.theirs.points.map((p, i) => (
            <div className="bento-list-item" key={i}>
              {p}
            </div>
          ))}
        </div>
      </Tile>
      <Tile tile={proof} center>
        <Label>{slide.proof.label}</Label>
        <Stat value={slide.proof.value} />
        <div className="bento-body">{slide.proof.note}</div>
      </Tile>
    </>
  );
}

export function ClosingSlide({ slide }: { slide: For<"closing"> }) {
  const tiles = tilesFor(slide);
  const anchor = byId(tiles, "anchor")!;
  const cta = byId(tiles, "cta")!;

  return (
    <>
      <Tile tile={anchor} center>
        <div className="bento-title">{slide.title}</div>
        <div className="bento-subtitle">{slide.subtitle}</div>
      </Tile>
      {(slide.stats ?? []).map((stat, i) => {
        const tile = byId(tiles, `stat${i}`);
        return tile ? <StatTile key={i} tile={tile} label={stat.label} value={stat.value} /> : null;
      })}
      <Tile tile={cta} row>
        <i className="bento-dot" />
        <span className="bento-heading">{slide.cta}</span>
      </Tile>
    </>
  );
}
