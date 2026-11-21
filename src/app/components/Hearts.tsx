interface Props {
  current: number;
  max: number;
}

/** Filled vs. outlined hearts, so health is readable without relying on color alone. */
export function Hearts({ current, max }: Props) {
  return (
    <span className="hud-chip hud-hearts" role="img" aria-label={`Health: ${current} of ${max} hearts`} data-testid="hud-hearts" data-hearts={current}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} className={`heart ${i < current ? 'heart-full' : 'heart-empty'}`} viewBox="0 0 24 22" aria-hidden="true">
          <path d="M12 21s-8.5-5.6-10.6-10.4C-0.3 6.6 2.4 2 6.6 2c2.3 0 4 1.3 5.4 3.2C13.4 3.3 15.1 2 17.4 2c4.2 0 6.9 4.6 5.2 8.6C20.5 15.4 12 21 12 21z" />
        </svg>
      ))}
    </span>
  );
}
