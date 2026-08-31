import type { GridTile } from "@supergamma/schema";
import { tileGridArea } from "@supergamma/schema";
import type { ReactNode } from "react";
import { isToneSurface } from "./theme.js";

/**
 * The tile primitive. Placement and surface both come from the grid module —
 * a tile never decides where it sits or what colour it is, which is what keeps
 * the web preview and the pptx export describing the same slide.
 */
export function Tile({
  tile,
  children,
  center,
  row,
  ghost,
}: {
  tile: GridTile;
  children: ReactNode;
  center?: boolean;
  row?: boolean;
  ghost?: string;
}) {
  return (
    <div
      className="bento-tile"
      data-surface={tile.surface}
      data-tone={isToneSurface(tile.surface) ? "1" : undefined}
      data-center={center ? "1" : undefined}
      data-row={row ? "1" : undefined}
      style={tileGridArea(tile)}
    >
      {ghost ? <span className="bento-ghost">{ghost}</span> : null}
      {children}
    </div>
  );
}

/** Look a tile up by the id the grid module assigned it. */
export function byId(tiles: GridTile[], id: string): GridTile | undefined {
  return tiles.find((t) => t.id === id);
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="bento-label">{children}</span>;
}

export function Stat({ value, xl }: { value: string; xl?: boolean }) {
  return (
    <div className="bento-stat" data-xl={xl ? "1" : undefined}>
      {value}
    </div>
  );
}

export function StatTile({ tile, label, value }: { tile: GridTile; label: string; value: string }) {
  return (
    <Tile tile={tile} center>
      <Label>{label}</Label>
      <Stat value={value} />
    </Tile>
  );
}
