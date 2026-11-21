import { PLAYER_BODY_HEIGHT, PLAYER_BODY_WIDTH, TILE_SIZE } from '../config/constants';
import type { MovementConfig } from '../config/movement';
import { sampleMovingPlatformPath } from '../systems/movingPlatform';
import { nextHorizontalVelocity, type Direction } from '../systems/movement';
import type { LevelDefinition } from './types';

/**
 * Level-design lint: simulates the player's real movement rules (MovementConfig) to find which
 * standing surfaces, collectibles, and the goal can be reached from spawn, without power-ups.
 *
 * Model and simplifications:
 * - From every standing surface, it simulates full-height jumps (running and standing starts in each
 *   direction, plus straight up) from sampled positions, and walking off each edge.
 * - Collisions use the static solids. Moving platforms are sampled along their path as one-way landing
 *   pads; all samples of one platform are connected (the player can ride it), and timing is ignored
 *   (the player can wait for a platform).
 * - Enemies, hazards, moving hazards, and the boss are ignored (they hurt but don't block movement).
 * - Crumbling planks are treated as solid (they hold long enough to run across or jump from).
 * - Collected items persist after falls in this game, so items touched mid-arc count as reachable.
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Surface {
  index: number;
  x0: number;
  x1: number;
  y: number;
  /** Moving platform id, or null for static ground/platforms. */
  movingId: string | null;
}

export interface ReachabilityReport {
  goalReachable: boolean;
  unreachableCollectibles: string[];
  reachableSurfaceCount: number;
  totalSurfaceCount: number;
}

const SIM_DT_MS = 1000 / 90;
const MAX_SIM_MS = 3000;
const SAMPLE_STEP_PX = 12;
const PLATFORM_SAMPLES = 7;
const ITEM_SIZE = 24;

const W = PLAYER_BODY_WIDTH;
const H = PLAYER_BODY_HEIGHT;

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function tileRect(x: number, y: number, w: number, h: number): Rect {
  return { x: x * TILE_SIZE, y: y * TILE_SIZE, w: w * TILE_SIZE, h: h * TILE_SIZE };
}

/** Splits a top edge into the parts where a player can actually stand (not blocked by solids above). */
function standableSegments(top: Rect, solids: readonly Rect[]): [number, number][] {
  let segments: [number, number][] = [[top.x, top.x + top.w]];
  const headroom: Rect = { x: top.x, y: top.y - H, w: top.w, h: H };
  for (const s of solids) {
    if (s === top || !overlaps(s, headroom)) continue;
    const next: [number, number][] = [];
    for (const [a, b] of segments) {
      if (s.x > a) next.push([a, Math.min(b, s.x)]);
      if (s.x + s.w < b) next.push([Math.max(a, s.x + s.w), b]);
    }
    segments = next.filter(([a, b]) => b - a > 0);
  }
  return segments;
}

/**
 * Doors open when their switch is touched, so analysis repeats with newly opened doors until nothing changes.
 */
export function analyzeReachability(level: LevelDefinition, config: MovementConfig): ReachabilityReport {
  const opened = new Set<string>();
  for (;;) {
    const { report, touchedSwitches } = analyzeOnce(level, config, opened);
    const fresh = [...touchedSwitches].filter((id) => !opened.has(id));
    if (fresh.length === 0) return report;
    fresh.forEach((id) => opened.add(id));
  }
}

function analyzeOnce(level: LevelDefinition, config: MovementConfig, openedSwitches: ReadonlySet<string>) {
  // Crumbling planks, sinking sand (at rest height), and timed platforms hold long enough to cross or wait for,
  // so they count as solid. Doors are solid until their switch has been reached.
  const solids = [
    ...level.solids.map((s) => tileRect(s.x, s.y, s.width, s.height)),
    ...(level.crumbling ?? []).map((c) => tileRect(c.x, c.y, c.width, 1)),
    ...(level.sinkingPlatforms ?? []).map((p) => tileRect(p.x, p.y, p.width, 1)),
    ...(level.timedPlatforms ?? []).map((p) => tileRect(p.x, p.y, p.width, 1)),
    ...(level.doors ?? []).filter((d) => !openedSwitches.has(d.switchId)).map((d) => tileRect(d.x, d.y, d.width, d.height)),
  ];
  // Lava ends a trajectory like a pit.
  const lava = level.hazards.filter((h) => h.kind === 'lava').map((h) => ({ x: h.x * TILE_SIZE, y: h.y * TILE_SIZE + 12, w: h.width * TILE_SIZE, h: TILE_SIZE - 12 }));
  const inLava = (box: Rect) => lava.some((l) => overlaps(box, l));
  const switches = (level.switches ?? []).map((sw) => ({ id: sw.id, rect: { x: sw.x * TILE_SIZE, y: sw.y * TILE_SIZE + 16, w: TILE_SIZE, h: 16 } }));
  const touchedSwitches = new Set<string>();
  const levelW = level.width * TILE_SIZE;
  const deathY = level.height * TILE_SIZE + 100;

  const surfaces: Surface[] = [];
  const addSurface = (x0: number, x1: number, y: number, movingId: string | null) =>
    surfaces.push({ index: surfaces.length, x0, x1, y, movingId });

  // Lava splits surfaces: the stretch beneath it is not walkable.
  for (const solid of solids) {
    for (const [x0, x1] of standableSegments(solid, [...solids, ...lava])) addSurface(x0, x1, solid.y, null);
  }
  const pads: Surface[] = [];
  for (const m of level.movingPlatforms) {
    for (const p of sampleMovingPlatformPath(m, PLATFORM_SAMPLES)) {
      addSurface(p.x * TILE_SIZE, (p.x + m.width) * TILE_SIZE, p.y * TILE_SIZE, m.id);
      pads.push(surfaces[surfaces.length - 1]!);
    }
  }

  const items = level.collectibles.map((c) => ({
    id: c.id,
    rect: {
      x: c.x * TILE_SIZE + (TILE_SIZE - ITEM_SIZE) / 2,
      y: c.y * TILE_SIZE + (TILE_SIZE - ITEM_SIZE) / 2,
      w: ITEM_SIZE,
      h: ITEM_SIZE,
    },
  }));
  const goalFeetX = level.goal.x * TILE_SIZE + TILE_SIZE / 2;
  const goalFeetY = (level.goal.y + 1) * TILE_SIZE;
  const goalRect: Rect = { x: goalFeetX - 12, y: goalFeetY - 160, w: 24, h: 160 };

  const touchedItems = new Set<string>();
  let goalTouched = false;
  const touch = (box: Rect) => {
    for (const item of items) if (!touchedItems.has(item.id) && overlaps(box, item.rect)) touchedItems.add(item.id);
    for (const sw of switches) if (overlaps(box, sw.rect)) touchedSwitches.add(sw.id);
    if (!goalTouched && overlaps(box, goalRect)) goalTouched = true;
  };

  const surfaceAt = (x: number, y: number, movingId: string | null): Surface | undefined =>
    surfaces.find((s) => s.movingId === movingId && Math.abs(s.y - y) < 0.5 && x + W > s.x0 && x < s.x1);

  /** Simulates one airborne trajectory and returns the surface it lands on, if any. */
  const simulate = (startX: number, startY: number, vx0: number, vy0: number, dir: Direction): Surface | undefined => {
    let x = startX;
    let y = startY;
    let vx = vx0;
    let vy = vy0;
    for (let t = 0; t < MAX_SIM_MS; t += SIM_DT_MS) {
      const dt = SIM_DT_MS / 1000;
      vx = nextHorizontalVelocity(vx, dir, false, SIM_DT_MS, config);
      vy = Math.min(vy + config.gravity * dt, config.maxFallSpeed);

      // Horizontal move with wall collisions and world bounds.
      let nx = Math.max(0, Math.min(levelW - W, x + vx * dt));
      for (const s of solids) {
        if (!overlaps({ x: nx, y, w: W, h: H }, s)) continue;
        // Resolve against the side we approached from.
        if (x + W <= s.x) nx = s.x - W;
        else if (x >= s.x + s.w) nx = s.x + s.w;
        else nx = x;
        vx = 0;
      }
      x = nx;

      // Vertical move: land on solids, bonk on ceilings, land on moving-platform pads from above.
      const prevBottom = y + H;
      let ny = y + vy * dt;
      for (const s of solids) {
        if (overlaps({ x, y: ny, w: W, h: H }, s)) {
          if (vy > 0) {
            if (inLava({ x, y: s.y - H, w: W, h: H })) return undefined;
            touch({ x, y: s.y - H, w: W, h: H });
            return surfaceAt(x, s.y, null);
          }
          ny = s.y + s.h;
          vy = 0;
        }
      }
      if (vy > 0) {
        for (const pad of pads) {
          if (prevBottom <= pad.y && ny + H >= pad.y && x + W > pad.x0 && x < pad.x1) {
            touch({ x, y: pad.y - H, w: W, h: H });
            return pad;
          }
        }
      }
      y = ny;
      touch({ x, y, w: W, h: H });
      if (y > deathY || inLava({ x, y, w: W, h: H })) return undefined;
    }
    return undefined;
  };

  const spawnX = level.spawn.x * TILE_SIZE + TILE_SIZE / 2 - W / 2;
  const spawnSurface = surfaceAt(spawnX, (level.spawn.y + 1) * TILE_SIZE, null);
  const reached = new Set<number>();
  const queue: Surface[] = [];
  const visit = (s: Surface | undefined) => {
    if (!s || reached.has(s.index)) return;
    reached.add(s.index);
    queue.push(s);
    // Riding a moving platform reaches every sampled position along its path.
    if (s.movingId) for (const other of surfaces) if (other.movingId === s.movingId) visit(other);
  };
  visit(spawnSurface);

  const variants: [Direction, number][] = [
    [1, config.maxRunSpeed],
    [-1, -config.maxRunSpeed],
    [1, 0],
    [-1, 0],
    [0, 0],
  ];

  const blocked = (x: number, y: number) => solids.some((solid) => overlaps({ x, y, w: W, h: H }, solid));

  while (queue.length > 0) {
    const s = queue.shift()!;
    // Walking along the surface touches anything at standing height (lava stretches are not walkable).
    if (!lava.length) touch({ x: s.x0 - W + 1, y: s.y - H, w: s.x1 - s.x0 + 2 * W - 2, h: H });
    else for (let x = s.x0 - W + 2; x <= s.x1 - 2; x += 4) if (!inLava({ x, y: s.y - H, w: W, h: H })) touch({ x, y: s.y - H, w: W, h: H });

    for (let x = s.x0 - W + 2; x <= s.x1 - 2; x += SAMPLE_STEP_PX) {
      if (blocked(x, s.y - H) || inLava({ x, y: s.y - H, w: W, h: H })) continue;
      for (const [dir, vx0] of variants) visit(simulate(x, s.y - H, vx0, -config.jumpVelocity, dir));
    }
    // Walking off each edge (only where the edge is open, not against a wall).
    if (!blocked(s.x0 - W + 1, s.y - H)) visit(simulate(s.x0 - W + 1, s.y - H, -config.maxRunSpeed, 0, -1));
    if (!blocked(s.x1 - 1, s.y - H)) visit(simulate(s.x1 - 1, s.y - H, config.maxRunSpeed, 0, 1));
  }

  const report: ReachabilityReport = {
    goalReachable: goalTouched,
    unreachableCollectibles: items.filter((i) => !touchedItems.has(i.id)).map((i) => i.id),
    reachableSurfaceCount: reached.size,
    totalSurfaceCount: surfaces.length,
  };
  return { report, touchedSwitches };
}
