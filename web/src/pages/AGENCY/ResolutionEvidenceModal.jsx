import { useRef, useState, useCallback, useEffect } from "react";
import { uploadEvidenceImage } from "../../api/uploads.js";

const MAX_IMAGES = 10;
const MAX_NOTES = 500;
// Uploaded files are scaled down to this before upload, like camera captures.
const MAX_DIMENSION = 1280;

function CameraIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/** Reads an image file and returns it as a JPEG data URI no larger than MAX_DIMENSION. */
function fileToJpeg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a supported image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ResolutionEvidenceModal({ onClose, onSubmit }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const fileRef    = useRef(null);

  // Each photo keeps a stable id, so an upload that finishes after an earlier photo
  // was removed still replaces the right one. (Array positions shifted under it.)
  const [images,   setImages]   = useState([]);
  const [notes,    setNotes]    = useState("");
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
          ? "Camera permission denied. Allow camera access, or upload photos instead."
          : err.name === "NotFoundError"
          ? "No camera found on this device. Upload photos instead."
          : `Camera error: ${err.message}`;
      setCamError(msg);
    }
  };

  /**
   * Adds a photo and uploads it straight away, so the wait overlaps the next shot
   * rather than stacking up as megabytes of base64 at submit time. The hosted URL
   * replaces the data URI; on failure the data URI simply stays.
   */
  const addImage = useCallback((dataUrl) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setImages(prev => [...prev, { id, src: dataUrl, uploading: true }]);
    setError("");
    uploadEvidenceImage(dataUrl, "resolution")
      .then((hosted) => {
        setImages(prev => prev.map((img) => (img.id === id ? { ...img, src: hosted } : img)));
      })
      .finally(() => {
        setImages(prev => prev.map((img) => (img.id === id ? { ...img, uploading: false } : img)));
      });
  }, []);

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
    addImage(canvas.toDataURL("image/jpeg", 0.85));
  }, [camReady, images.length, addImage]);

  // For a dispatcher without a camera, or photos taken on a responder's phone.
  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith("image/"));
    event.target.value = "";
    const room = MAX_IMAGES - images.length;
    if (files.length > room) setError(`Only ${room} more photo${room === 1 ? "" : "s"} can be added.`);
    for (const file of files.slice(0, room)) {
      try {
        addImage(await fileToJpeg(file));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const removeImage = (id) => setImages(prev => prev.filter((img) => img.id !== id));

  const stillUploading = images.some((img) => img.uploading);

  const submit = async () => {
    if (!images.length) return setError("At least one photo is required.");
    if (stillUploading) {
      return setError("Please wait — photos are still uploading.");
    }
    setSaving(true);
    stopStream();
    try {
      await onSubmit(images.map((img) => img.src), notes.trim());
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
            <h3 className="font-black text-sm tracking-wide uppercase">Resolve incident</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Add scene photos and a short note. The reporter sees both — {images.length}/{MAX_IMAGES} photos
            </p>
          </div>
          {!saving && (
            <button
              onClick={() => { stopStream(); onClose(); }}
              className="ml-2 text-white/40 hover:text-white transition-colors shrink-0"
              title="Close"
              aria-label="Close"
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
                  aria-label="Capture photo"
                >
                  <span className="h-11 w-11 rounded-full bg-white block shadow-inner" />
                </button>

                <span className="text-xs font-bold text-white/70 tabular-nums">
                  {images.length}/{MAX_IMAGES}
                </span>
              </div>
            )}
          </div>

          {/* ── upload instead of / as well as the camera ── */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">
              No camera here, or photos on a responder's phone? Upload them instead.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={remaining === 0 || saving}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Upload photos
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          {/* ── captured thumbnails ── */}
          {images.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Photos ({images.length}/{MAX_IMAGES})
              </p>
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group">
                    <img
                      src={img.src}
                      alt={`Evidence ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <svg className="h-4 w-4 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute right-0.5 top-0.5 h-5 w-5 rounded bg-slate-900/70 text-white text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Remove"
                      aria-label={`Remove photo ${idx + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── what was done ── */}
          <div>
            <label htmlFor="resolution-notes" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">
              What did your team do? <span className="normal-case font-semibold tracking-normal text-slate-400">· shown to the reporter</span>
            </label>
            <textarea
              id="resolution-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
              rows={3}
              placeholder="e.g. Scene secured. No injuries. One person taken to the district hospital."
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400 tabular-nums">{notes.length}/{MAX_NOTES}</p>
          </div>

          {/* ── error ── */}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          {images.length === 0 && !camError && (
            <p className="text-center text-xs text-slate-400">
              Capture or upload scene photos. At least <strong>1 photo</strong> is required.
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
            disabled={!images.length || saving || stillUploading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Saving…
              </>
            ) : stillUploading ? (
              "Uploading photos…"
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit &amp; Resolve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
