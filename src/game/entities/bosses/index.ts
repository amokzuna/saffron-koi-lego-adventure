import type Phaser from 'phaser';
import type { BossPlacement } from '../../levels/types';
import type { BossBase } from './BossBase';
import { FinalBoss } from './FinalBoss';
import { FrostBoss } from './FrostBoss';
import { GuardianBoss } from './GuardianBoss';
import { ProtectorBoss } from './ProtectorBoss';
import { SentinelBoss } from './SentinelBoss';

export type { BossBase, BossSpawn, BossTickResult } from './BossBase';

export function createBoss(scene: Phaser.Scene, placement: BossPlacement): BossBase {
  switch (placement.kind) {
    case 'guardian':
      return new GuardianBoss(scene, placement);
    case 'protector':
      return new ProtectorBoss(scene, placement);
    case 'sentinel':
      return new SentinelBoss(scene, placement);
    case 'frost':
      return new FrostBoss(scene, placement);
    case 'final':
      return new FinalBoss(scene, placement);
  }
}
