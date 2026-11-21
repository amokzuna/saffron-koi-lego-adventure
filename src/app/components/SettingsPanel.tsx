import { useId } from 'react';
import { useSettings } from '../../features/settings/SettingsContext';
import type { ReducedMotionSetting, TouchControlsSetting } from '../../features/settings/settings';

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="setting-row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        aria-valuetext={`${Math.round(value * 100)} percent`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className="setting-value" aria-hidden="true">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

/** Audio, motion, and control settings. Used on the Settings screen and inside the pause menu. */
export function SettingsPanel() {
  const { settings, update, saved } = useSettings();
  const motionId = useId();
  const touchId = useId();

  return (
    <div className="settings-panel">
      <fieldset className="field">
        <legend>Sound</legend>
        <label className="setting-check">
          <input type="checkbox" checked={settings.muted} onChange={(e) => update({ muted: e.target.checked })} />
          Mute all sound
        </label>
        <VolumeSlider label="Master volume" value={settings.masterVolume} onChange={(v) => update({ masterVolume: v })} />
        <VolumeSlider label="Music" value={settings.musicVolume} onChange={(v) => update({ musicVolume: v })} />
        <VolumeSlider label="Sound effects" value={settings.sfxVolume} onChange={(v) => update({ sfxVolume: v })} />
      </fieldset>

      <fieldset className="field">
        <legend>Display &amp; controls</legend>
        <div className="setting-row">
          <label htmlFor={motionId}>Reduce motion</label>
          <select id={motionId} value={settings.reducedMotion} onChange={(e) => update({ reducedMotion: e.target.value as ReducedMotionSetting })}>
            <option value="system">Use device setting</option>
            <option value="on">On (no screen shake or flashes)</option>
            <option value="off">Off</option>
          </select>
        </div>
        <div className="setting-row">
          <label htmlFor={touchId}>On-screen controls</label>
          <select id={touchId} value={settings.touchControls} onChange={(e) => update({ touchControls: e.target.value as TouchControlsSetting })}>
            <option value="auto">Automatic (touch devices)</option>
            <option value="always">Always show</option>
            <option value="never">Never show</option>
          </select>
        </div>
      </fieldset>
      {!saved && (
        <p className="error-text" role="status">
          Settings couldn’t be saved on this device; they will apply until you close the page.
        </p>
      )}
    </div>
  );
}
