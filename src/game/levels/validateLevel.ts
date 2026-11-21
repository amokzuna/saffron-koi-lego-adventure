import type { LevelDefinition, SolidBlock, TilePoint } from './types';

function insideBounds(level: LevelDefinition, p: TilePoint): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < level.width && p.y < level.height;
}

function pointInSolid(p: TilePoint, s: SolidBlock): boolean {
  return p.x >= s.x && p.x < s.x + s.width && p.y >= s.y && p.y < s.y + s.height;
}

function inAnySolid(level: LevelDefinition, p: TilePoint): boolean {
  return level.solids.some((s) => pointInSolid(p, s));
}

/** Platforms that are solid at least some of the time; nothing should be placed inside them. */
function inAnyPlatformLike(level: LevelDefinition, p: TilePoint): boolean {
  const rows: SolidBlock[] = [
    ...(level.crumbling ?? []).map((c) => ({ x: c.x, y: c.y, width: c.width, height: 1, style: 'platform' as const })),
    ...(level.timedPlatforms ?? []).map((t) => ({ x: t.x, y: t.y, width: t.width, height: 1, style: 'platform' as const })),
    ...(level.sinkingPlatforms ?? []).map((t) => ({ x: t.x, y: t.y, width: t.width, height: 1, style: 'platform' as const })),
    ...(level.doors ?? []).map((d) => ({ x: d.x, y: d.y, width: d.width, height: d.height, style: 'ground' as const })),
  ];
  return rows.some((s) => pointInSolid(p, s));
}

function hasSupportBelow(level: LevelDefinition, p: TilePoint): boolean {
  return inAnySolid(level, { x: p.x, y: p.y + 1 });
}

/**
 * Checks a level definition for authoring mistakes. Returns a list of human-readable errors;
 * an empty list means the level is valid.
 */
export function validateLevel(level: LevelDefinition): string[] {
  const errors: string[] = [];

  if (!level.id) errors.push('Level id is required.');
  if (level.width <= 0 || level.height <= 0) errors.push('Level size must be positive.');
  if (!(level.parTimeMs > 0)) errors.push('parTimeMs must be positive.');

  for (const [label, point] of [['spawn', level.spawn], ['goal', level.goal]] as const) {
    if (!insideBounds(level, point)) errors.push(`${label} is outside the level bounds.`);
    if (inAnySolid(level, point)) errors.push(`${label} is inside a solid block.`);
    if (!hasSupportBelow(level, point)) errors.push(`${label} has no solid ground directly below it.`);
  }

  level.solids.forEach((s, i) => {
    if (s.width <= 0 || s.height <= 0) errors.push(`Solid #${i} must have a positive size.`);
    if (s.x < 0 || s.y < 0 || s.x + s.width > level.width || s.y + s.height > level.height) {
      errors.push(`Solid #${i} extends outside the level bounds.`);
    }
  });

  const seen = new Set<string>();
  const checkId = (id: string) => {
    if (seen.has(id)) errors.push(`Duplicate id "${id}".`);
    seen.add(id);
  };
  const checkFree = (id: string, p: TilePoint) => {
    if (!insideBounds(level, p)) errors.push(`"${id}" is outside the level bounds.`);
    else if (inAnySolid(level, p)) errors.push(`"${id}" is inside a solid block.`);
    else if (inAnyPlatformLike(level, p)) errors.push(`"${id}" is inside a crumbling, timed, or sinking platform or a door.`);
  };

  for (const c of level.collectibles) {
    checkId(c.id);
    checkFree(c.id, c);
  }

  for (const p of level.powerUps) {
    checkId(p.id);
    checkFree(p.id, p);
  }

  for (const c of level.checkpoints) {
    checkId(c.id);
    checkFree(c.id, c);
    if (!hasSupportBelow(level, c)) errors.push(`Checkpoint "${c.id}" has no solid ground directly below it.`);
  }

  for (const h of level.hazards) {
    checkId(h.id);
    if (h.width <= 0) errors.push(`Hazard "${h.id}" must have a positive width.`);
    for (let x = h.x; x < h.x + h.width; x++) {
      const tile = { x, y: h.y };
      checkFree(h.id, tile);
      if (!hasSupportBelow(level, tile)) errors.push(`Hazard "${h.id}" has an unsupported tile at x=${x}.`);
    }
  }

  for (const e of level.enemies) {
    checkId(e.id);
    checkFree(e.id, e);
    if (e.patrolMinX > e.patrolMaxX) errors.push(`Enemy "${e.id}" has an inverted patrol range.`);
    if (e.x < e.patrolMinX || e.x > e.patrolMaxX) errors.push(`Enemy "${e.id}" starts outside its patrol range.`);
    if (e.patrolMinX < 0 || e.patrolMaxX >= level.width) errors.push(`Enemy "${e.id}" patrols outside the level bounds.`);
    if (e.kind === 'walker' && !hasSupportBelow(level, e)) errors.push(`Walker "${e.id}" has no ground directly below it.`);
  }

  for (const m of level.movingPlatforms) {
    checkId(m.id);
    if (m.width <= 0) errors.push(`Moving platform "${m.id}" must have a positive width.`);
    if (!(m.periodMs > 0)) errors.push(`Moving platform "${m.id}" must have a positive period.`);
    if (m.dx === 0 && m.dy === 0) errors.push(`Moving platform "${m.id}" does not move (dx and dy are 0).`);
    const minX = Math.min(m.x, m.x + m.dx);
    const maxX = Math.max(m.x, m.x + m.dx) + m.width;
    const minY = Math.min(m.y, m.y + m.dy);
    const maxY = Math.max(m.y, m.y + m.dy);
    if (minX < 0 || maxX > level.width || minY < 0 || maxY >= level.height) {
      errors.push(`Moving platform "${m.id}" travels outside the level bounds.`);
    }
  }

  for (const d of level.decorations) {
    if (!insideBounds(level, d)) errors.push(`Decoration at (${d.x}, ${d.y}) is outside the level bounds.`);
    if (d.kind === 'sign' && !d.text) errors.push(`Sign at (${d.x}, ${d.y}) needs text.`);
  }

  for (const c of level.crumbling ?? []) {
    checkId(c.id);
    if (c.width <= 0) errors.push(`Crumbling planks "${c.id}" must have a positive width.`);
    for (let x = c.x; x < c.x + c.width; x++) {
      const tile = { x, y: c.y };
      if (!insideBounds(level, tile)) errors.push(`"${c.id}" is outside the level bounds.`);
      else if (inAnySolid(level, tile)) errors.push(`"${c.id}" is inside a solid block.`);
    }
  }

  for (const h of level.movingHazards ?? []) {
    checkId(h.id);
    if (!(h.periodMs > 0)) errors.push(`Moving hazard "${h.id}" must have a positive period.`);
    const ends = [
      { x: h.x, y: h.y },
      { x: h.x + h.dx, y: h.y + h.dy },
    ];
    if (ends.some((p) => !insideBounds(level, p))) errors.push(`Moving hazard "${h.id}" travels outside the level bounds.`);
  }

  for (const p of level.sinkingPlatforms ?? []) {
    checkId(p.id);
    if (p.width <= 0 || p.maxDrop <= 0) errors.push(`Sinking platform "${p.id}" needs a positive width and maxDrop.`);
    if (p.x < 0 || p.x + p.width > level.width || p.y < 0 || p.y + p.maxDrop >= level.height) errors.push(`Sinking platform "${p.id}" sinks outside the level bounds.`);
  }

  const switchIds = new Set((level.switches ?? []).map((sw) => sw.id));
  for (const sw of level.switches ?? []) {
    checkId(sw.id);
    checkFree(sw.id, sw);
    if (!hasSupportBelow(level, sw)) errors.push(`Switch "${sw.id}" has no solid ground directly below it.`);
  }
  for (const d of level.doors ?? []) {
    checkId(d.id);
    if (!switchIds.has(d.switchId)) errors.push(`Door "${d.id}" references unknown switch "${d.switchId}".`);
    if (d.x < 0 || d.y < 0 || d.x + d.width > level.width || d.y + d.height > level.height) errors.push(`Door "${d.id}" extends outside the level bounds.`);
  }
  for (const sec of level.secrets ?? []) {
    if (sec.x < 0 || sec.y < 0 || sec.x + sec.width > level.width || sec.y + sec.height > level.height) errors.push(`Secret at (${sec.x}, ${sec.y}) extends outside the level bounds.`);
  }

  for (const w of level.windZones ?? []) {
    checkId(w.id);
    if (w.x < 0 || w.x + w.width > level.width) errors.push(`Wind zone "${w.id}" extends outside the level bounds.`);
    if (w.activeMs + w.warningMs >= w.periodMs) errors.push(`Wind zone "${w.id}" needs calm time: activeMs + warningMs must be less than periodMs.`);
    if (w.warningMs < 500) errors.push(`Wind zone "${w.id}" needs at least 500 ms of warning.`);
  }

  for (const b of level.boostPads ?? []) {
    checkId(b.id);
    for (let x = b.x; x < b.x + b.width; x++) {
      if (!hasSupportBelow(level, { x, y: b.y })) errors.push(`Boost pad "${b.id}" has an unsupported tile at x=${x}.`);
    }
  }

  for (const i of level.icicles ?? []) {
    checkId(i.id);
    checkFree(i.id, i);
    if (!inAnySolid(level, { x: i.x, y: i.y - 1 })) errors.push(`Icicle "${i.id}" must hang from a solid ceiling.`);
  }

  for (const f of level.flameJets ?? []) {
    checkId(f.id);
    checkFree(f.id, f);
    if (!hasSupportBelow(level, f)) errors.push(`Flame jet "${f.id}" has no solid ground directly below it.`);
    if (f.activeMs + f.warningMs >= f.periodMs) errors.push(`Flame jet "${f.id}" needs off time: activeMs + warningMs must be less than periodMs.`);
    if (f.warningMs < 400) errors.push(`Flame jet "${f.id}" needs at least 400 ms of warning.`);
  }

  for (const t of level.timedPlatforms ?? []) {
    checkId(t.id);
    if (t.visibleMs <= 900 || t.visibleMs >= t.periodMs) errors.push(`Timed platform "${t.id}" needs 900 ms < visibleMs < periodMs.`);
    if (t.x < 0 || t.x + t.width > level.width || t.y < 0 || t.y >= level.height) errors.push(`Timed platform "${t.id}" is outside the level bounds.`);
  }

  if (level.darkness) {
    const { ambientAlpha, playerLightRadius } = level.darkness;
    if (!(ambientAlpha > 0 && ambientAlpha <= 0.95)) errors.push('Darkness ambientAlpha must be in (0, 0.95] so the level stays readable.');
    if (playerLightRadius < 120) errors.push('Darkness playerLightRadius must be at least 120 px so upcoming jumps are visible.');
  }

  if (level.boss) {
    const b = level.boss;
    if (b.arenaMinX >= b.arenaMaxX) errors.push('Boss arena range is inverted.');
    if (b.arenaMinX < 0 || b.arenaMaxX >= level.width) errors.push('Boss arena extends outside the level bounds.');
    if (b.x <= b.arenaMinX || b.x >= b.arenaMaxX) errors.push('Boss must start inside its arena.');
    if (b.triggerX <= b.arenaMinX || b.triggerX >= b.x) errors.push('Boss trigger must be inside the arena, before the boss.');
    if (level.goal.x <= b.arenaMinX || level.goal.x >= b.arenaMaxX) errors.push('In boss levels the goal must be inside the arena.');
    if (level.spawn.x >= b.arenaMinX) errors.push('Spawn must be before the boss arena.');
    if (!hasSupportBelow(level, b)) errors.push('Boss has no ground directly below it.');
  }

  return errors;
}
