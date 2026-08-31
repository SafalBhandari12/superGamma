/**
 * One stylesheet for the whole renderer, injected once by DeckRenderer.
 *
 * It lives as a string rather than a CSS file because this package has no
 * build step, and because two things here cannot be expressed as inline
 * styles: the container queries that size type against its own tile, and the
 * ::before grain overlay on mesh tiles.
 *
 * Every colour is a var() supplied by the theme — nothing here is hard-coded,
 * so a theme swap repaints the deck without touching this file.
 */
export const BENTO_CSS = `
.bento-slide{
  aspect-ratio:16/9; width:100%;
  display:grid;
  grid-template-columns:repeat(6,1fr);
  grid-template-rows:repeat(4,1fr);
  /* set from the grid module's own constants — see --pad / --col-gap / --row-gap */
  column-gap:var(--col-gap);
  row-gap:var(--row-gap);
  padding:var(--pad);
  background:var(--canvas);
  border-radius:18px;
  color:var(--text);
  font-family:var(--font-sans);
  overflow:hidden;
}

.bento-tile{
  container-type:inline-size;
  position:relative; overflow:hidden;
  display:flex; flex-direction:column;
  align-items:flex-start; justify-content:flex-start;
  gap:clamp(5px,2.4cqi,13px);
  padding:clamp(13px,5.6cqi,26px);
  background:var(--s1);
  border:1px solid var(--border);
  border-radius:14px;
}
.bento-tile[data-surface="s2"]{background:var(--s2);}
.bento-tile[data-surface="s3"]{background:var(--s3);}
.bento-tile[data-surface="tone1"]{background:var(--t1);}
.bento-tile[data-surface="tone2"]{background:var(--t2);}
.bento-tile[data-surface="tone3"]{background:var(--t3);}
.bento-tile[data-surface="tone4"]{background:var(--t4);}
.bento-tile[data-surface="tone5"]{background:var(--t5);}
.bento-tile[data-tone="1"]{border-color:transparent; color:var(--on-tone);}
.bento-tile[data-surface="mesh"]{background:var(--mesh),var(--s2); border-color:transparent;}

/* grain: kills gradient banding and adds the texture flat fills lack */
.bento-tile[data-surface="mesh"]::before{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  opacity:.2; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
}
.bento-tile > *:not(.bento-ghost){position:relative; z-index:1;}
.bento-tile[data-center="1"]{justify-content:center;}
.bento-tile[data-row="1"]{flex-direction:row; align-items:center; gap:clamp(8px,3cqi,16px);}

.bento-ghost{
  position:absolute; right:-2%; bottom:-26%; z-index:0;
  font-size:clamp(70px,58cqi,190px); font-weight:900;
  letter-spacing:-.06em; line-height:1;
  color:var(--ghost); pointer-events:none; user-select:none;
  font-variant-numeric:tabular-nums;
}
.bento-tile[data-tone="1"] .bento-ghost{color:color-mix(in oklch, var(--on-tone) 14%, transparent);}

/* ---- type scale ----
   Verbatim from the published design artifact: cqi-only, with ceilings that a
   normal tile actually reaches, so the effective sizes are label 14 / body 21 /
   heading 32 / statement 38 / stat 52 / title 66. Reproduced exactly rather
   than re-derived, because this is the scale that was signed off. */
.bento-label{
  font-family:var(--font-mono);
  font-size:clamp(9.5px,4cqi,14px); font-weight:500;
  letter-spacing:.1em; text-transform:uppercase; color:var(--muted);
}
.bento-stat{
  font-size:clamp(28px,21cqi,52px); font-weight:800;
  line-height:.92; letter-spacing:-.035em; font-variant-numeric:tabular-nums;
}
.bento-stat[data-xl="1"]{font-size:clamp(50px,30cqi,104px); font-weight:900; letter-spacing:-.045em;}
.bento-heading{font-size:clamp(17px,9cqi,32px); font-weight:700; line-height:1.14; letter-spacing:-.022em;}
.bento-statement{font-size:clamp(20px,10.5cqi,38px); font-weight:700; line-height:1.18; letter-spacing:-.025em; text-wrap:balance;}
.bento-body{font-size:clamp(13px,6.2cqi,21px); font-weight:400; line-height:1.42; color:var(--muted);}
.bento-title{font-size:clamp(34px,14cqi,66px); font-weight:800; line-height:.98; letter-spacing:-.04em;}
.bento-subtitle{font-size:clamp(14px,5.4cqi,24px); font-weight:400; line-height:1.32; color:var(--muted);}
.bento-index{font-family:var(--font-mono); font-size:clamp(11px,5cqi,19px); font-weight:600; color:var(--t1); font-variant-numeric:tabular-nums;}

.bento-tile[data-tone="1"] .bento-label,
.bento-tile[data-tone="1"] .bento-body,
.bento-tile[data-tone="1"] .bento-subtitle{color:var(--on-tone); opacity:.82;}
.bento-tile[data-tone="1"] .bento-index{color:var(--on-tone); opacity:.9;}

.bento-dot{width:.55em; height:.55em; border-radius:50%; background:var(--t1); flex:none;}
.bento-tile[data-tone="1"] .bento-dot{background:var(--on-tone);}
.bento-row{display:flex; align-items:center; gap:8px;}
.bento-spacer{flex:1 1 auto;}

.bento-list{display:flex; flex-direction:column; gap:clamp(5px,2.8cqi,12px); width:100%;}
.bento-list-item{
  font-size:clamp(12.5px,5.8cqi,21px); font-weight:500; line-height:1.28;
  display:flex; gap:9px; align-items:flex-start;
}
.bento-list-item::before{
  content:""; width:.42em; height:.42em; border-radius:50%;
  background:var(--t1); flex:none; margin-top:.5em;
}
.bento-tile[data-tone="1"] .bento-list-item::before{background:var(--on-tone);}

.bento-chips{display:flex; flex-wrap:wrap; gap:clamp(3px,2cqi,8px);}
.bento-chip{
  font-family:var(--font-mono); font-size:clamp(8.5px,3.6cqi,12px); font-weight:500;
  padding:clamp(2px,1.4cqi,5px) clamp(4px,2.6cqi,10px);
  border:1px solid var(--border); border-radius:100px; color:var(--muted);
}
.bento-tile[data-tone="1"] .bento-chip{
  border-color:color-mix(in oklch, var(--on-tone) 28%, transparent);
  color:var(--on-tone); opacity:.85;
}

/* ---- charts ---- */
.bento-viz{width:100%; flex:1 1 auto; min-height:0; display:block; overflow:visible;}
.bento-viz text{font-family:var(--font-sans); font-variant-numeric:tabular-nums;}
.bento-viz .v-val{fill:var(--text); font-size:12.5px; font-weight:700;}
.bento-viz .v-cat{fill:var(--muted); font-size:11.5px; font-weight:500;}
.bento-viz .v-axis{stroke:var(--border); stroke-width:1; fill:none;}
.bento-viz .v-bar{fill:var(--t1);}
.bento-viz .v-bar-mute{fill:var(--muted); opacity:.3;}
.bento-tile[data-tone="1"] .bento-viz .v-val{fill:var(--on-tone);}
.bento-tile[data-tone="1"] .bento-viz .v-cat{fill:var(--on-tone); opacity:.75;}
.bento-tile[data-tone="1"] .bento-viz .v-bar{fill:var(--on-tone);}
.bento-tile[data-tone="1"] .bento-viz .v-axis{stroke:var(--on-tone); opacity:.3;}
.bento-viz .v-line{fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;}
.bento-viz .v-area{opacity:.1;}

.bento-legend{display:flex; flex-wrap:wrap; gap:clamp(5px,3cqi,12px);}
.bento-leg{display:flex; align-items:center; gap:5px; font-size:clamp(10px,4.4cqi,14px); font-weight:500; color:var(--muted);}
.bento-leg i{width:.62em; height:.62em; border-radius:3px; flex:none;}
.bento-tile[data-tone="1"] .bento-leg{color:var(--on-tone); opacity:.85;}
`;
