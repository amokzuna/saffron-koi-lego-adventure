import { useEffect, useRef } from 'react';
import { HERO_HEIGHT, HERO_WIDTH, drawHero, type HeroPose } from '../../features/character/heroRenderer';
import type { HeroAppearance } from '../../features/character/types';

interface Props {
  appearance: HeroAppearance;
  pose?: HeroPose;
  /** Display size multiplier relative to the in-game logical size. */
  scale?: number;
  label?: string;
}

/** Draws the hero with the same renderer the game uses, at a crisp device-pixel resolution. */
export function HeroPreview({ appearance, pose = 'idle', scale = 3, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pixelScale = scale * dpr;
    canvas.width = Math.round(HERO_WIDTH * pixelScale);
    canvas.height = Math.round(HERO_HEIGHT * pixelScale);
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHero(ctx, pose, appearance, pixelScale);
  }, [appearance, pose, scale]);

  return (
    <canvas
      ref={ref}
      className="hero-preview"
      style={{ width: HERO_WIDTH * scale, height: HERO_HEIGHT * scale }}
      role="img"
      aria-label={label ?? `${appearance.name}, ${appearance.faceMode === 'photo' && appearance.portrait ? 'with a photo face' : 'with a minifig face'}`}
      data-testid="hero-preview"
      data-has-portrait={appearance.faceMode === 'photo' && appearance.portrait ? 'true' : 'false'}
      data-face-mode={appearance.faceMode}
      data-hair-style={appearance.hairStyle}
      data-skin-tone={appearance.skinTone}
    />
  );
}
