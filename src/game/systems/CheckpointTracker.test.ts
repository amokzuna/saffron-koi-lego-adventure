import { describe, expect, it } from 'vitest';
import { CheckpointTracker } from './CheckpointTracker';

const spawn = { x: 2, y: 13 };
const placements = [
  { id: 'a', x: 20, y: 13 },
  { id: 'b', x: 50, y: 13 },
];

describe('CheckpointTracker', () => {
  it('respawns at the level spawn until a checkpoint is touched', () => {
    const tracker = new CheckpointTracker(spawn, placements);
    expect(tracker.respawnPoint).toEqual(spawn);
    expect(tracker.activeCheckpointId).toBeNull();
  });

  it('activates each checkpoint once and moves the respawn point', () => {
    const tracker = new CheckpointTracker(spawn, placements);
    expect(tracker.activate('a')).toBe(true);
    expect(tracker.activate('a')).toBe(false);
    expect(tracker.respawnPoint).toEqual({ x: 20, y: 13 });
  });

  it('never moves the respawn point backwards', () => {
    const tracker = new CheckpointTracker(spawn, placements);
    tracker.activate('b');
    tracker.activate('a');
    expect(tracker.respawnPoint).toEqual({ x: 50, y: 13 });
    expect(tracker.activeCheckpointId).toBe('b');
    expect(tracker.isActive('a')).toBe(true);
  });

  it('ignores unknown ids', () => {
    const tracker = new CheckpointTracker(spawn, placements);
    expect(tracker.activate('zzz')).toBe(false);
  });
});
