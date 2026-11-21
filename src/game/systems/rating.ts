import type { CollectibleCounts } from './CollectibleTracker';

export interface RatingCriterion {
  id: 'complete' | 'allBricks' | 'parTime';
  label: string;
  met: boolean;
}

export interface LevelRating {
  stars: number;
  criteria: RatingCriterion[];
}

function bricksLabel(total: number): string {
  if (total === 0) return 'No build bricks to find';
  if (total === 1) return 'Find the build brick';
  return `Find all ${total} build bricks`;
}

function formatPar(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

/**
 * One star per criterion met. Criteria are shown to the player so the rating is transparent:
 * 1. Reach the goal. 2. Collect every build brick. 3. Finish at or under the par time.
 */
export function rateLevel(input: {
  collected: CollectibleCounts;
  totals: CollectibleCounts;
  elapsedMs: number;
  parTimeMs: number;
}): LevelRating {
  const criteria: RatingCriterion[] = [
    { id: 'complete', label: 'Reach the goal', met: true },
    {
      id: 'allBricks',
      label: bricksLabel(input.totals.brick),
      met: input.collected.brick >= input.totals.brick,
    },
    { id: 'parTime', label: `Finish within ${formatPar(input.parTimeMs)}`, met: input.elapsedMs <= input.parTimeMs },
  ];
  return { stars: criteria.filter((c) => c.met).length, criteria };
}
