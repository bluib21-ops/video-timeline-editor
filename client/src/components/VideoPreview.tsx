import { forwardRef, useEffect, useRef } from 'react';

/**
 * VideoPreview Component
 * 
 * Design: Cinematic Dark Minimalism
 * - Canvas-based rendering for real-time preview
 * - Displays current frame from all active tracks
 * - Supports video, images, text, and audio visualization
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

interface VideoPreviewProps {
  currentTime: number;
  tracks: Track[];
  width: number;
  height: number;
}

const VideoPreview = forwardRef<HTMLCanvasElement, VideoPreviewProps>(
  ({ currentTime, tracks, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas with dark background
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

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

      // Get active clips at current time
      const videoTrack = tracks.find(t => t.type === 'video');
      if (videoTrack) {
        const activeClips = videoTrack.clips.filter(
          clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
        );

        activeClips.forEach(clip => {
          if (clip.type === 'image' || clip.type === 'video') {
            drawMediaClip(ctx, clip, width, height);
          }
        });
      }

      // Draw text overlays
      const textTrack = tracks.find(t => t.type === 'text');
      if (textTrack) {
        const activeTextClips = textTrack.clips.filter(
          clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
        );

        activeTextClips.forEach(clip => {
          drawTextClip(ctx, clip, width, height);
        });
      }

      // Draw center crosshair
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Forward ref
      if (ref && typeof ref === 'object') {
        ref.current = canvas;
      }
    }, [currentTime, tracks, width, height, ref]);

    const drawMediaClip = (
      ctx: CanvasRenderingContext2D,
      clip: Clip,
      canvasWidth: number,
      canvasHeight: number
    ) => {
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

      // Draw placeholder rectangle for media
      const placeholderWidth = 200;
      const placeholderHeight = 150;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.fillRect(-placeholderWidth / 2, -placeholderHeight / 2, placeholderWidth, placeholderHeight);
      ctx.strokeRect(-placeholderWidth / 2, -placeholderHeight / 2, placeholderWidth, placeholderHeight);

      // Draw media type icon
      ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.type.toUpperCase(), 0, -20);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(clip.source || 'Sample', 0, 10);

      ctx.restore();
    };

    const drawTextClip = (
      ctx: CanvasRenderingContext2D,
      clip: Clip,
      canvasWidth: number,
      canvasHeight: number
    ) => {
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
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.text || 'Text', 0, 0);

      ctx.restore();
    };

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-border rounded-lg shadow-lg bg-background"
      />
    );
  }
);

VideoPreview.displayName = 'VideoPreview';

export default VideoPreview;
