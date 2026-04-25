"use client";

import { useEffect, useRef, useState } from "react";

/**
 * VideoAscii — live ASCII rendering of the hero video.
 *
 * The hero MP4 plays into a hidden <video>. Each animation tick we draw
 * the current video frame into a tiny offscreen <canvas> (~96×54 px),
 * read the pixel buffer back, map each pixel's luminance to a character
 * from a density ramp ("@" = dark, " " = light or vice versa), and write
 * the resulting string into a <pre>. The result: the lab video, rendered
 * frame by frame as ASCII art.
 *
 * Architecture:
 *  - Video is muted + playsInline + loop + autoplay (the only way to get
 *    cross-browser autoplay reliably).
 *  - Canvas is `willReadFrequently: true` so the browser keeps the buffer
 *    on the CPU side — `getImageData` is cheap.
 *  - RAF tick is gated to ~24 FPS (every 42ms). Higher FPS doesn't read
 *    much better at this character resolution and burns CPU.
 *  - We re-fit the canvas resolution to the wrapper's aspect ratio so the
 *    ASCII art fills the box without stretching.
 *  - prefers-reduced-motion -> render ONE frame, then stop the RAF loop
 *    AND pause the video.
 *  - document.visibilityState === "hidden" -> skip frame draws (cheap).
 *
 * Borrows from Ascii-Motion (CameronFoxly): the cell-grid pattern + the
 * per-frame stepping discipline. We don't need its full timeline editor
 * — the video itself IS our timeline.
 *
 * The wrapping <pre> uses the same forest-green color as the rest of the
 * landing so the ASCII reads as part of the brand, not as a video-render
 * artifact.
 */

// Light → dark density ramp. The empty space at the start matters: video
// brights map to space (gives the canvas air) and darks map to dense chars.
// Reversed because our background is light and the visible "ink" is dark.
const RAMP_DARK_ON_LIGHT = " .,:;-=+*#%@";
const COLS = 96;
const ROWS = 54;
const FRAME_GATE_MS = 42; // ~24 FPS

type Props = {
  src?: string;
  className?: string;
};

export function VideoAscii({ src = "/hero.mp4", className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const pre = preRef.current;
    if (!video || !canvas || !pre) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = COLS;
    canvas.height = ROWS;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let stopped = false;

    const drawFrame = () => {
      if (video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, COLS, ROWS);
      const data = ctx.getImageData(0, 0, COLS, ROWS).data;
      let out = "";
      for (let y = 0; y < ROWS; y++) {
        let row = "";
        for (let x = 0; x < COLS; x++) {
          const i = (y * COLS + x) * 4;
          // Rec. 709 luminance — perceptual brightness
          const lum =
            data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
          const idx = Math.min(
            RAMP_DARK_ON_LIGHT.length - 1,
            Math.max(0, Math.floor((lum / 255) * RAMP_DARK_ON_LIGHT.length))
          );
          row += RAMP_DARK_ON_LIGHT[idx];
        }
        out += row + "\n";
      }
      pre.textContent = out;
    };

    const loop = (now: number) => {
      if (stopped) return;
      if (document.visibilityState !== "hidden" && now - last > FRAME_GATE_MS) {
        drawFrame();
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };

    const onPlaying = () => {
      setReady(true);
      if (!reduced) raf = requestAnimationFrame(loop);
      else drawFrame();
    };
    video.addEventListener("playing", onPlaying);
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.src = src;
    video.play().catch(() => setReady(false));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("playing", onPlaying);
      video.pause();
      // remove src so it doesn't keep the connection alive
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <div className={`l-vascii ${className ?? ""}`} ref={wrapRef}>
      {/* Hidden video — the source of pixel data. Never displayed. */}
      <video ref={videoRef} aria-hidden="true" preload="auto" style={{ display: "none" }} />
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "none" }} />
      <pre ref={preRef} className="l-vascii-out" aria-hidden="true" />
      {!ready ? (
        <div className="l-vascii-loading" aria-hidden="true">
          loading frames…
        </div>
      ) : null}
    </div>
  );
}
