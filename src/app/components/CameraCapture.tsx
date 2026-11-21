import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (photo: Blob) => void;
  onCancel: () => void;
}

type CameraState = { kind: 'starting' } | { kind: 'live' } | { kind: 'error'; message: string };

function describeCameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow camera access in your browser’s site settings, or upload a photo instead.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. You can upload a photo instead.';
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again, or upload a photo instead.';
  return 'The camera couldn’t be started. You can upload a photo instead.';
}

/**
 * Live camera preview with a capture button (desktop and laptops). The picture is taken in the browser and
 * handed to the same validation and crop flow as uploads; nothing is sent anywhere.
 */
export function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ kind: 'starting' });

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ kind: 'error', message: 'This browser can’t use the camera here (a secure https connection is required). You can upload a photo instead.' });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setState({ kind: 'live' });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ kind: 'error', message: describeCameraError(error) });
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    // Match the mirrored preview, like a selfie camera.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/jpeg', 0.92);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="camera-title" data-testid="camera-dialog">
      <div className="panel camera-panel">
        <h2 id="camera-title" className="panel-title">
          Take a photo
        </h2>
        <p className="privacy-note">🔒 The camera picture stays on this device and is never uploaded.</p>
        <div className="camera-frame">
          <video ref={videoRef} className="camera-video" playsInline muted aria-label="Camera preview" />
          {state.kind === 'live' && <div className="camera-guide" aria-hidden="true" />}
          {state.kind === 'starting' && (
            <p className="camera-status" role="status">
              Starting camera… Your browser may ask for permission.
            </p>
          )}
        </div>
        {state.kind === 'error' && (
          <p className="error-text" role="alert" data-testid="camera-error">
            {state.message}
          </p>
        )}
        {state.kind === 'live' && <p className="muted small">Fit your face inside the oval and look at the camera.</p>}
        <div className="button-row">
          <button className="btn btn-primary" onClick={capture} disabled={state.kind !== 'live'} autoFocus>
            📸 Capture
          </button>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
