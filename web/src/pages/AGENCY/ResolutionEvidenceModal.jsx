import { useRef, useState, useCallback, useEffect } from "react";

const MAX_IMAGES = 10;

function CameraIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ResolutionEvidenceModal({ onClose, onSubmit }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [images,   setImages]   = useState([]);
  const [error,    setError]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState("");
  const [starting, setStarting] = useState(false);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  };

  const startCamera = async () => {
    setCamError("");
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      // wait for next frame so <video> is in the DOM
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCamReady(true);
            setStarting(false);
          };
        }
      });
    } catch (err) {
      setStarting(false);
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : `Camera error: ${err.message}`;
      setCamError(msg);
    }
  };

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !camReady) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum of ${MAX_IMAGES} photos reached.`);
      return;
    }

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImages(prev => [...prev, dataUrl]);
    setError("");
  }, [camReady, images.length]);

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!images.length) return setError("At least one photo is required.");
    setSaving(true);
    stopStream();
    try {
      await onSubmit(images);
    } finally {
      setSaving(false);
    }
  };

  const remaining = MAX_IMAGES - images.length;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* backdrop — not dismissible while saving */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* ── header ── */}
        <div className="flex items-center gap-3 bg-[#0a1e3f] px-5 py-4 text-white shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30">
            <CameraIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm tracking-wide uppercase">Scene Evidence Required</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Take live photos of the scene before resolving — {images.length}/{MAX_IMAGES} captured
            </p>
          </div>
          {!saving && (
            <button
              onClick={() => { stopStream(); onClose(); }}
              className="ml-2 text-white/40 hover:text-white transition-colors shrink-0"
              title="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400 shrink-0" />

        {/* ── body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* ── live camera view ── */}
          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* loading overlay */}
            {(starting || (!camReady && !camError)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
                <svg className="h-7 w-7 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                <span className="text-sm font-semibold text-white/80">Starting camera…</span>
              </div>
            )}

            {/* camera error overlay */}
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-6 text-center">
                <svg className="h-10 w-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-sm font-semibold text-white/80">{camError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wide hover:bg-emerald-700 transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* shutter button overlay */}
            {camReady && !camError && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-xs font-bold text-white/70">
                  {remaining > 0 ? `${remaining} photo${remaining !== 1 ? "s" : ""} left` : "Limit reached"}
                </span>

                {/* shutter */}
                <button
                  onClick={capturePhoto}
                  disabled={remaining === 0}
                  className="h-16 w-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/35 backdrop-blur-sm transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl flex items-center justify-center"
                  title="Capture photo"
                >
                  <span className="h-11 w-11 rounded-full bg-white block shadow-inner" />
                </button>

                <span className="text-xs font-bold text-white/70 tabular-nums">
                  {images.length}/{MAX_IMAGES}
                </span>
              </div>
            )}
          </div>

          {/* ── captured thumbnails ── */}
          {images.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Captured ({images.length}/{MAX_IMAGES})
              </p>
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group">
                    <img
                      src={src}
                      alt={`Evidence ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-0.5 top-0.5 h-5 w-5 rounded bg-slate-900/70 text-white text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── error ── */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
              ⚠️ {error}
            </p>
          )}

          {images.length === 0 && !camError && (
            <p className="text-center text-xs text-slate-400">
              Press the shutter button to capture scene photos. At least <strong>1 photo</strong> is required.
            </p>
          )}
        </div>

        {/* ── footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 shrink-0">
          <button
            onClick={() => { stopStream(); onClose(); }}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!images.length || saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Proof &amp; Resolve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
