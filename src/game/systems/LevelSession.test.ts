import { describe, expect, it } from 'vitest';
import { SANDBOX_LEVEL } from '../../data/levels/sandboxLevel';
import { GAMEPLAY } from '../config/gameplay';
import { MOVEMENT } from '../config/movement';
import { LevelSession } from './LevelSession';

const newSession = () => new LevelSession(SANDBOX_LEVEL);

describe('LevelSession', () => {
  it('starts with full hearts and a running timer', () => {
    const session = newSession();
    session.tick(500);
    expect(session.hud()).toMatchObject({ hearts: 3, maxHearts: 3, elapsedMs: 500, powerUps: [] });
  });

  it('applies invulnerability between hits', () => {
    const session = newSession();
    expect(session.hit()).toBe('hurt');
    expect(session.hit()).toBe('ignored');
    session.tick(GAMEPLAY.invulnerabilityMs);
    expect(session.hit()).toBe('hurt');
    expect(session.heartsLost).toBe(2);
  });

  it('pits always cost a heart and lead to game over at zero', () => {
    const session = newSession();
    expect(session.fall()).toBe('hurt');
    expect(session.fall()).toBe('hurt');
    expect(session.fall()).toBe('dead');
    expect(session.state).toBe('gameOver');
    expect(session.falls).toBe(3);
    expect(session.gameOvers).toBe(1);
  });

  it('stops the completion timer during game over and resumes after continue', () => {
    const session = newSession();
    session.fall();
    session.fall();
    session.fall();
    session.tick(1000);
    expect(session.elapsedMs).toBe(0);
    session.continueFromCheckpoint();
    expect(session.hud().hearts).toBe(3);
    session.tick(100);
    expect(session.elapsedMs).toBe(100);
  });

  it('continues from the latest checkpoint', () => {
    const session = newSession();
    const cp = SANDBOX_LEVEL.checkpoints[0]!;
    session.checkpoints.activate(cp.id);
    session.fall();
    session.fall();
    session.fall();
    expect(session.continueFromCheckpoint()).toEqual({ x: cp.x, y: cp.y });
  });

  it('shield absorbs a hit but not a fall', () => {
    const session = newSession();
    session.collectPowerUp('test-shield', 'shield');
    expect(session.hit()).toBe('shielded');
    expect(session.hud().hearts).toBe(3);
    session.collectPowerUp('test-shield-2', 'shield');
    expect(session.fall()).toBe('hurt');
  });

  it('collects each power-up once and applies movement modifiers', () => {
    const session = newSession();
    expect(session.collectPowerUp('p1', 'speedBoost')).toEqual({ kind: 'speedBoost', healed: 0 });
    expect(session.collectPowerUp('p1', 'speedBoost')).toBeNull();
    expect(session.movementConfig(MOVEMENT).maxRunSpeed).toBeCloseTo(MOVEMENT.maxRunSpeed * 1.4);
    session.tick(8000);
    expect(session.movementConfig(MOVEMENT)).toBe(MOVEMENT);
  });

  it('extra heart heals only when damaged', () => {
    const session = newSession();
    expect(session.collectPowerUp('h1', 'extraHeart')?.healed).toBe(0);
    session.hit();
    expect(session.collectPowerUp('h2', 'extraHeart')?.healed).toBe(1);
  });

  it('produces a rated result once on completion', () => {
    const session = newSession();
    session.tick(1000);
    session.hit();
    const result = session.complete();
    expect(result).toMatchObject({ elapsedMs: 1000, heartsLost: 1, gameOvers: 0 });
    expect(result?.rating.stars).toBeGreaterThanOrEqual(1);
    expect(session.complete()).toBeNull();
    expect(session.hit()).toBe('ignored');
  });
});
