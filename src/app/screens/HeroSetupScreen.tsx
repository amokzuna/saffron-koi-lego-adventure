import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { cropSourceRect, initialCrop, type CropState } from '../../features/character/crop';
import { decodeUserImage, type DecodedImage } from '../../features/character/decodeImage';
import { useHero, type HeroDraft } from '../../features/character/HeroContext';
import { NAME_MAX_LENGTH, validateName } from '../../features/character/heroProfile';
import { suggestFromPhoto } from '../../features/character/photoRegions';
import {
  DEFAULT_PROFILE,
  HAIR_COLORS,
  HAIR_COLOR_IDS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  OUTFIT_COLOR_IDS,
  PORTRAIT_STYLES,
  SKIN_TONES,
  SKIN_TONE_IDS,
  type FaceMode,
  type HairColorId,
  type HairStyleId,
  type HeroAppearance,
  type OutfitColorId,
  type PortraitStyle,
  type SkinToneId,
} from '../../features/character/types';
import { CameraCapture } from '../components/CameraCapture';
import { CropEditor } from '../components/CropEditor';
import { HeroPreview } from '../components/HeroPreview';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTouchDevice } from '../hooks/useTouchDevice';

interface Props {
  onDone: () => void;
}

/** Size of the stored portrait crop (photo mode). */
const PORTRAIT_SIZE = 160;

function renderCrop(image: DecodedImage, crop: CropState): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = PORTRAIT_SIZE;
  const ctx = canvas.getContext('2d')!;
  const rect = cropSourceRect(image, crop);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.source, rect.x, rect.y, rect.size, rect.size, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  return canvas;
}

interface SwatchOption<T extends string> {
  id: T;
  label: string;
  hex: string;
}

function SwatchPicker<T extends string>(props: { legend: string; name: string; value: T; options: SwatchOption<T>[]; onChange: (v: T) => void }) {
  const { legend, name, value, options, onChange } = props;
  const current = options.find((o) => o.id === value);
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="swatches">
        {options.map((o) => (
          <label key={o.id} className="swatch-option" title={o.label}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span className="swatch" style={{ background: o.hex }} aria-hidden="true" />
            <span className="visually-hidden">{o.label}</span>
          </label>
        ))}
      </div>
      <p className="muted small swatch-current">{current?.label}</p>
    </fieldset>
  );
}

const outfitOptions = OUTFIT_COLOR_IDS.map((id) => ({ id, ...OUTFIT_COLORS[id] }));
const skinOptions = SKIN_TONE_IDS.map((id) => ({ id, ...SKIN_TONES[id] }));
const hairOptions = HAIR_COLOR_IDS.map((id) => ({ id, ...HAIR_COLORS[id] }));

export function HeroSetupScreen({ onDone }: Props) {
  const hero = useHero();
  const isTouch = useTouchDevice();
  // Narrow or short screens get a compact preview that sticks to the top while the options scroll.
  const compactPreview = useMediaQuery('(max-width: 680px), (max-height: 560px)');
  const uploadInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const p = hero.profile;

  const [name, setName] = useState(p.name);
  const [torsoColor, setTorsoColor] = useState<OutfitColorId>(p.torsoColor);
  const [legsColor, setLegsColor] = useState<OutfitColorId>(p.legsColor);
  const [style, setStyle] = useState<PortraitStyle>(p.style);
  const [faceMode, setFaceMode] = useState<FaceMode>(p.faceMode);
  const [skinTone, setSkinTone] = useState<SkinToneId>(p.skinTone);
  const [hairColor, setHairColor] = useState<HairColorId>(p.hairColor);
  const [hairStyle, setHairStyle] = useState<HairStyleId>(p.hairStyle);
  const [glasses, setGlasses] = useState(p.glasses);
  const [savedPortrait, setSavedPortrait] = useState(hero.portrait);
  const [editing, setEditing] = useState<{ image: DecodedImage; crop: CropState } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [suggested, setSuggested] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cropCanvas = useMemo(() => (editing ? renderCrop(editing.image, editing.crop) : null), [editing]);
  const portrait = cropCanvas ?? savedPortrait;
  const effectiveFaceMode: FaceMode = faceMode === 'photo' && portrait ? 'photo' : 'minifig';

  const appearance = useMemo<HeroAppearance>(
    () => ({ name: name.trim() || DEFAULT_PROFILE.name, torsoColor, legsColor, style, portrait, faceMode: effectiveFaceMode, skinTone, hairColor, hairStyle, glasses }),
    [name, torsoColor, legsColor, style, portrait, effectiveFaceMode, skinTone, hairColor, hairStyle, glasses],
  );

  const applySuggestion = (image: DecodedImage, crop: CropState) => {
    const s = suggestFromPhoto(image, crop);
    setSkinTone(s.skinTone);
    setHairColor(s.hairColor);
    setHairStyle(s.hairStyle);
    if (s.torsoColor) setTorsoColor(s.torsoColor);
    setSuggested(true);
  };

  /** Shared path for uploads and camera captures: validate, decode, crop, and build a minifig suggestion. */
  const acceptPhoto = async (file: Blob) => {
    setUploadError(null);
    setBusy(true);
    try {
      const result = await decodeUserImage(file);
      if (!result.ok) {
        setUploadError(result.error);
        return;
      }
      const crop = initialCrop(result.image);
      setEditing({ image: result.image, crop });
      applySuggestion(result.image, crop);
      setFaceMode('minifig');
    } finally {
      setBusy(false);
    }
  };

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (file) await acceptPhoto(file);
  };

  const takePhoto = () => {
    // Phones and tablets: the native camera picker. Desktop: an in-page camera preview.
    if (isTouch || !navigator.mediaDevices?.getUserMedia) captureInput.current?.click();
    else setCameraOpen(true);
  };

  const buildDraft = (): HeroDraft => ({
    name,
    torsoColor,
    legsColor,
    style,
    faceMode: effectiveFaceMode,
    skinTone,
    hairColor,
    hairStyle,
    glasses,
    portrait: cropCanvas ? { source: cropCanvas, canvas: cropCanvas, isNew: true } : savedPortrait ? { source: savedPortrait, isNew: false } : null,
  });

  const onSave = async () => {
    const error = validateName(name);
    setNameError(error);
    if (error) return;
    setSaveError(null);
    setBusy(true);
    try {
      await hero.save(buildDraft());
      onDone();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Your hero couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  };

  const resetToDefault = () => {
    setName(DEFAULT_PROFILE.name);
    setTorsoColor(DEFAULT_PROFILE.torsoColor);
    setLegsColor(DEFAULT_PROFILE.legsColor);
    setStyle(DEFAULT_PROFILE.style);
    setFaceMode(DEFAULT_PROFILE.faceMode);
    setSkinTone(DEFAULT_PROFILE.skinTone);
    setHairColor(DEFAULT_PROFILE.hairColor);
    setHairStyle(DEFAULT_PROFILE.hairStyle);
    setGlasses(DEFAULT_PROFILE.glasses);
    setSavedPortrait(null);
    setEditing(null);
    setSuggested(false);
    setUploadError(null);
    setNameError(null);
  };

  return (
    <main className="screen screen-scroll">
      {/* Inert while the camera dialog is open, so keyboard and screen-reader focus stay in the dialog. */}
      <div className="panel setup-panel" inert={cameraOpen}>
        <h1 className="panel-title">Customize Hero</h1>

        <div className="setup-grid">
          <section className={`setup-preview${compactPreview ? ' setup-preview-compact' : ''}`} aria-labelledby="preview-heading" data-testid="setup-preview">
            {compactPreview ? (
              <>
                <div className="preview-stage">
                  <HeroPreview appearance={appearance} scale={1.6} />
                </div>
                <div className="preview-compact-text">
                  <h2 id="preview-heading" className="section-title">
                    Preview
                  </h2>
                  <span className="muted small">Updates as you change options below.</span>
                </div>
              </>
            ) : (
              <>
                <h2 id="preview-heading" className="section-title">
                  Preview
                </h2>
                <div className="preview-stage">
                  <HeroPreview appearance={appearance} scale={4} />
                </div>
                <div className="preview-poses" aria-label="Animation poses">
                  <HeroPreview appearance={appearance} pose="run0" scale={1.5} label="Running pose" />
                  <HeroPreview appearance={appearance} pose="jump" scale={1.5} label="Jumping pose" />
                  <HeroPreview appearance={appearance} pose="hurt" scale={1.5} label="Hurt pose" />
                </div>
                <p className="muted small">
                  The body uses the standard hero animations (run, jump, fall). In photo-face mode the face is a still image and does not
                  animate.
                </p>
              </>
            )}
          </section>

          <div className="setup-fields">
            <section className="field" aria-labelledby="photo-heading">
              <h2 id="photo-heading" className="section-title">
                Your photo
              </h2>
              <p className="privacy-note">
                🔒 Your photo stays on this device. It’s processed in your browser and never uploaded. In minifig mode only the colors
                picked from it are saved, not the photo.
              </p>

              <input
                ref={uploadInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                data-testid="photo-input"
                onChange={onFileChosen}
              />
              <input
                ref={captureInput}
                type="file"
                accept="image/*"
                capture="user"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                data-testid="camera-input"
                onChange={onFileChosen}
              />

              {editing && (
                <CropEditor
                  image={editing.image}
                  crop={editing.crop}
                  onChange={(crop) => setEditing({ ...editing, crop })}
                />
              )}

              <div className="button-row">
                <button className="btn" onClick={takePhoto} disabled={busy}>
                  📷 Take Photo
                </button>
                <button className="btn" onClick={() => uploadInput.current?.click()} disabled={busy}>
                  {editing || savedPortrait ? 'Upload a Different Photo' : 'Upload Photo'}
                </button>
                {editing && (
                  <button className="btn" onClick={() => setEditing(null)} disabled={busy}>
                    Discard New Photo
                  </button>
                )}
                {!editing && savedPortrait && (
                  <button className="btn" onClick={() => setSavedPortrait(null)} disabled={busy}>
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="muted small">PNG, JPG, or WebP · up to 10 MB · at least 64×64 pixels.</p>
              {busy && !saveError && <p role="status">Working…</p>}
              {uploadError && (
                <p className="error-text" role="alert" data-testid="upload-error">
                  {uploadError}
                </p>
              )}
            </section>

            <fieldset className="field">
              <legend>Hero face</legend>
              <div className="style-options">
                <label className="style-option">
                  <input type="radio" name="face-mode" value="minifig" checked={effectiveFaceMode === 'minifig'} onChange={() => setFaceMode('minifig')} />
                  <span>
                    <strong>Minifig look</strong>
                    <span className="muted small"> — a drawn minifigure head with your skin tone, hair, and colors.</span>
                  </span>
                </label>
                <label className="style-option">
                  <input type="radio" name="face-mode" value="photo" checked={effectiveFaceMode === 'photo'} disabled={!portrait} onChange={() => setFaceMode('photo')} />
                  <span>
                    <strong>Photo face</strong>
                    <span className="muted small"> — your photo on the hero’s head{portrait ? '.' : ' (add a photo first).'}</span>
                  </span>
                </label>
              </div>
            </fieldset>

            {effectiveFaceMode === 'minifig' ? (
              <section className="field minifig-builder" aria-labelledby="builder-heading">
                <h2 id="builder-heading" className="section-title">
                  Build your minifig
                </h2>
                {suggested && (
                  <p className="suggestion-note" role="status" data-testid="suggestion-note">
                    ✨ We picked skin tone, hair, and shirt colors from your photo. Change anything you like.
                  </p>
                )}
                {editing && (
                  <button className="btn btn-quiet" onClick={() => applySuggestion(editing.image, editing.crop)}>
                    Pick colors from photo again
                  </button>
                )}
                <SwatchPicker legend="Skin tone" name="skin-tone" value={skinTone} options={skinOptions} onChange={setSkinTone} />
                <fieldset className="field">
                  <legend>Hair</legend>
                  <div className="style-options style-options-inline">
                    {HAIR_STYLES.map((h) => (
                      <label key={h.id} className="style-option">
                        <input type="radio" name="hair-style" value={h.id} checked={hairStyle === h.id} onChange={() => setHairStyle(h.id)} />
                        <span>{h.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {hairStyle !== 'none' && <SwatchPicker legend="Hair color" name="hair-color" value={hairColor} options={hairOptions} onChange={setHairColor} />}
                <label className="setting-check">
                  <input type="checkbox" checked={glasses} onChange={(e) => setGlasses(e.target.checked)} />
                  Glasses
                </label>
              </section>
            ) : (
              <fieldset className="field">
                <legend>Photo style</legend>
                <div className="style-options">
                  {PORTRAIT_STYLES.map((s) => (
                    <label key={s.id} className="style-option">
                      <input type="radio" name="face-style" value={s.id} checked={style === s.id} onChange={() => setStyle(s.id)} />
                      <span>
                        <strong>{s.label}</strong>
                        <span className="muted small"> — {s.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <SwatchPicker legend="Shirt color" name="torso-color" value={torsoColor} options={outfitOptions} onChange={setTorsoColor} />
            <SwatchPicker legend="Pants color" name="legs-color" value={legsColor} options={outfitOptions} onChange={setLegsColor} />

            <div className="field">
              <label htmlFor="hero-name" className="field-label">
                Hero name
              </label>
              <input
                id="hero-name"
                className="text-input"
                value={name}
                maxLength={NAME_MAX_LENGTH * 2}
                autoComplete="off"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'hero-name-error' : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(validateName(e.target.value));
                }}
              />
              {nameError && (
                <p id="hero-name-error" className="error-text" role="alert">
                  {nameError}
                </p>
              )}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="error-box" role="alert" data-testid="save-error">
            <p>{saveError}</p>
            <button
              className="btn"
              onClick={() => {
                hero.applyForSession(buildDraft());
                onDone();
              }}
            >
              Use This Hero Without Saving
            </button>
          </div>
        )}

        <div className="button-row setup-actions">
          <button className="btn btn-primary" onClick={onSave} disabled={busy}>
            Save Hero
          </button>
          <button className="btn" onClick={onDone} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-quiet" onClick={resetToDefault} disabled={busy}>
            Reset to Default Hero
          </button>
        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCancel={() => setCameraOpen(false)}
          onCapture={(blob) => {
            setCameraOpen(false);
            void acceptPhoto(blob);
          }}
        />
      )}
    </main>
  );
}
