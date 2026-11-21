export function Logo() {
  return (
    <h1 className="logo" aria-label="LEGO Adventure">
      <span className="logo-bricks" aria-hidden="true">
        {['L', 'E', 'G', 'O'].map((letter, i) => (
          <span key={letter} className={`logo-brick logo-brick-${i}`}>
            {letter}
          </span>
        ))}
      </span>
      <span className="logo-sub" aria-hidden="true">
        Adventure
      </span>
    </h1>
  );
}
