/**
 * Export Utilities
 * 
 * Provides functionality to export timeline composition as MP4 video
 * Note: Full MP4 encoding requires FFmpeg.wasm or backend service
 * This implementation provides a canvas-based export framework
 */

interface Clip {
  id: string;
  type: 'video' | 'image' | 'audio' | 'text';
  startTime: number;
  duration: number;
  trackId: string;
  source?: string;
  text?: string;
  properties?: {
    opacity?: number;
    scale?: number;
    rotation?: number;
    x?: number;
    y?: number;
    fontSize?: number;
    color?: string;
  };
}

interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  label: string;
  clips: Clip[];
  height: number;
}

/**
 * Export timeline as WebM video (can be converted to MP4)
 * This creates a video file from the canvas frames
 */
export async function exportAsWebM(
  tracks: Track[],
  duration: number,
  width: number = 800,
  height: number = 450,
  fps: number = 30,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Create MediaRecorder to capture canvas
  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000, // 5 Mbps
  });

  const chunks: BlobPart[] = [];
  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    mediaRecorder.onerror = (e: Event) => {
      const error = (e as any).error || 'Unknown error';
      reject(new Error(`MediaRecorder error: ${error}`));
    };

    // Start recording
    mediaRecorder.start();

    // Render frames
    const frameCount = Math.ceil(duration * fps);
    let currentFrame = 0;

    const renderFrame = () => {
      if (currentFrame >= frameCount) {
        mediaRecorder.stop();
        return;
      }

      const currentTime = currentFrame / fps;
      
      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

      // Render all clips at current time
      renderTimelineFrame(ctx, tracks, currentTime, width, height);

      // Update progress
      if (onProgress) {
        onProgress((currentFrame / frameCount) * 100);
      }

      currentFrame++;
      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  });
}

/**
 * Render a single frame of the timeline
 */
function renderTimelineFrame(
  ctx: CanvasRenderingContext2D,
  tracks: Track[],
  currentTime: number,
  width: number,
  height: number
): void {
  // Draw grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Render video track
  const videoTrack = tracks.find(t => t.type === 'video');
  if (videoTrack) {
    const activeClips = videoTrack.clips.filter(
      clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );

    activeClips.forEach(clip => {
      renderClip(ctx, clip, width, height);
    });
  }

  // Render text overlays
  const textTrack = tracks.find(t => t.type === 'text');
  if (textTrack) {
    const activeTextClips = textTrack.clips.filter(
      clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );

    activeTextClips.forEach(clip => {
      renderTextClip(ctx, clip, width, height);
    });
  }
}

/**
 * Render a single clip
 */
function renderClip(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  canvasWidth: number,
  canvasHeight: number
): void {
  const props = clip.properties || {};
  const opacity = props.opacity ?? 1;
  const scale = props.scale ?? 1;
  const rotation = props.rotation ?? 0;
  const x = props.x ?? 0;
  const y = props.y ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(canvasWidth / 2 + x, canvasHeight / 2 + y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Draw placeholder
  const placeholderWidth = 200;
  const placeholderHeight = 150;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
  ctx.lineWidth = 2;
  ctx.fillRect(-placeholderWidth / 2, -placeholderHeight / 2, placeholderWidth, placeholderHeight);
  ctx.strokeRect(-placeholderWidth / 2, -placeholderHeight / 2, placeholderWidth, placeholderHeight);

  ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.type.toUpperCase(), 0, -20);
  ctx.font = '12px Arial';
  ctx.fillText(clip.source || 'Media', 0, 10);

  ctx.restore();
}

/**
 * Render a text clip
 */
function renderTextClip(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  canvasWidth: number,
  canvasHeight: number
): void {
  const props = clip.properties || {};
  const opacity = props.opacity ?? 1;
  const scale = props.scale ?? 1;
  const rotation = props.rotation ?? 0;
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const fontSize = props.fontSize ?? 24;
  const color = props.color ?? '#ffffff';

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(canvasWidth / 2 + x, canvasHeight / 2 + y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.text || 'Text', 0, 0);

  ctx.restore();
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert WebM to MP4 (requires backend service or FFmpeg.wasm)
 * This is a placeholder for the conversion process
 */
export async function convertWebMToMP4(webmBlob: Blob): Promise<Blob> {
  // In production, this would:
  // 1. Send WebM to backend
  // 2. Use FFmpeg to convert to MP4
  // 3. Return MP4 blob
  
  // For now, return WebM as-is with MP4 extension
  console.warn('MP4 conversion requires backend service or FFmpeg.wasm');
  // Create a new blob with MP4 MIME type
  return new Blob([webmBlob], { type: 'video/mp4' });
}
