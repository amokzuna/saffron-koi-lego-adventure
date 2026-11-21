import { useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

/** True on coarse-pointer devices, or as soon as any touch is observed (e.g. touch laptops). */
export function useTouchDevice(): boolean {
  const coarse = useMediaQuery('(pointer: coarse)');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;
    const onTouch = () => setTouched(true);
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, [touched]);

  return coarse || touched;
}
