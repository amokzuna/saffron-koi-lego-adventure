import type { BossHud } from '../../game/bridge/GameBridge';

export function BossBar({ boss }: { boss: BossHud }) {
  return (
    <div className="boss-bar" role="status" aria-label={`${boss.name}: ${boss.hp} of ${boss.maxHp} health`} data-testid="boss-bar" data-hp={boss.hp}>
      <span className="boss-name">{boss.name}</span>
      <span className="boss-segments" aria-hidden="true">
        {Array.from({ length: boss.maxHp }, (_, i) => (
          <span key={i} className={i < boss.hp ? 'boss-seg-full' : 'boss-seg-empty'} />
        ))}
      </span>
      <span className="boss-hp" aria-hidden="true">
        {boss.hp}/{boss.maxHp}
      </span>
    </div>
  );
}
