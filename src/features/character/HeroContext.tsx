import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { canvasToPngBlob, loadHero, saveHero } from '../../storage/heroStorage';
import { sanitizeName } from './heroProfile';
import {
  DEFAULT_PROFILE,
  type FaceMode,
  type HairColorId,
  type HairStyleId,
  type HeroAppearance,
  type HeroProfile,
  type OutfitColorId,
  type PortraitSource,
  type PortraitStyle,
  type SkinToneId,
} from './types';

/** Edits from the setup screen. `portrait.isNew` marks a freshly cropped upload that must be saved. */
export interface HeroDraft {
  name: string;
  torsoColor: OutfitColorId;
  legsColor: OutfitColorId;
  style: PortraitStyle;
  faceMode: FaceMode;
  skinTone: SkinToneId;
  hairColor: HairColorId;
  hairStyle: HairStyleId;
  glasses: boolean;
  /** The cropped photo. Only stored (and only used on the head) in photo mode. */
  portrait: { source: PortraitSource; isNew: boolean; canvas?: HTMLCanvasElement } | null;
}

interface HeroState {
  status: 'loading' | 'ready';
  profile: HeroProfile;
  portrait: PortraitSource | null;
  warning: string | null;
  /** True when the current hero was applied without being saved to this device. */
  sessionOnly: boolean;
}

interface HeroContextValue extends HeroState {
  appearance: HeroAppearance;
  /** Saves to this device. Throws a user-facing Error if storage fails. */
  save: (draft: HeroDraft) => Promise<void>;
  /** Uses the draft for this session only (when saving to the device failed). */
  applyForSession: (draft: HeroDraft) => void;
  dismissWarning: () => void;
}

const HeroContext = createContext<HeroContextValue | null>(null);

/** In minifig mode the photo is not kept: only the colors and options picked from it are saved. */
const usesPhoto = (draft: HeroDraft) => draft.faceMode === 'photo' && draft.portrait !== null;

function profileFromDraft(draft: HeroDraft): HeroProfile {
  const photo = usesPhoto(draft);
  return {
    version: 2,
    name: sanitizeName(draft.name),
    torsoColor: draft.torsoColor,
    legsColor: draft.legsColor,
    style: draft.style,
    hasPortrait: photo,
    faceMode: photo ? 'photo' : 'minifig',
    skinTone: draft.skinTone,
    hairColor: draft.hairColor,
    hairStyle: draft.hairStyle,
    glasses: draft.glasses,
  };
}

export function HeroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HeroState>({
    status: 'loading',
    profile: DEFAULT_PROFILE,
    portrait: null,
    warning: null,
    sessionOnly: false,
  });

  useEffect(() => {
    let cancelled = false;
    void loadHero().then((loaded) => {
      if (!cancelled) setState({ status: 'ready', ...loaded, sessionOnly: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (draft: HeroDraft) => {
      const profile = profileFromDraft(draft);
      try {
        if (usesPhoto(draft) && draft.portrait?.isNew) {
          const canvas = draft.portrait.canvas;
          if (!canvas) throw new Error('missing canvas');
          await saveHero(profile, { kind: 'set', blob: await canvasToPngBlob(canvas) });
        } else {
          await saveHero(profile, usesPhoto(draft) ? { kind: 'keep' } : state.profile.hasPortrait ? { kind: 'remove' } : { kind: 'keep' });
        }
      } catch {
        throw new Error('Your hero couldn’t be saved on this device. Browser storage may be turned off (for example in private browsing) or full.');
      }
      setState({ status: 'ready', profile, portrait: usesPhoto(draft) ? draft.portrait!.source : null, warning: null, sessionOnly: false });
    },
    [state.profile.hasPortrait],
  );

  const applyForSession = useCallback((draft: HeroDraft) => {
    setState({ status: 'ready', profile: profileFromDraft(draft), portrait: usesPhoto(draft) ? draft.portrait!.source : null, warning: null, sessionOnly: true });
  }, []);

  const dismissWarning = useCallback(() => setState((s) => ({ ...s, warning: null })), []);

  const appearance = useMemo<HeroAppearance>(
    () => ({
      name: state.profile.name,
      torsoColor: state.profile.torsoColor,
      legsColor: state.profile.legsColor,
      style: state.profile.style,
      portrait: state.portrait,
      faceMode: state.profile.faceMode,
      skinTone: state.profile.skinTone,
      hairColor: state.profile.hairColor,
      hairStyle: state.profile.hairStyle,
      glasses: state.profile.glasses,
    }),
    [state.profile, state.portrait],
  );

  const value = useMemo(
    () => ({ ...state, appearance, save, applyForSession, dismissWarning }),
    [state, appearance, save, applyForSession, dismissWarning],
  );
  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHero(): HeroContextValue {
  const ctx = useContext(HeroContext);
  if (!ctx) throw new Error('useHero must be used inside HeroProvider');
  return ctx;
}
