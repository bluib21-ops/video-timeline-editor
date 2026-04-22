import { forwardRef, useEffect, useRef } from 'react';

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
    const mediaCache = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map());
    const loadingRef = useRef<Set<string>>(new Set());

    // Load media files
    useEffect(() => {
      const videoTrack = tracks.find(t => t.type === 'video');
      if (!videoTrack) return;

      videoTrack.clips.forEach(clip => {
        if (!clip.source) return;
        if (mediaCache.current.has(clip.id)) return;
        if (loadingRef.current.has(clip.id)) return;

        loadingRef.current.add(clip.id);

        if (clip.type === 'image') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            mediaCache.current.set(clip.id, img);
            loadingRef.current.delete(clip.id);
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${clip.source}`);
            loadingRef.current.delete(clip.id);
          };
          img.src = clip.source;
        } else if (clip.type === 'video') {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.onloadedmetadata = () => {
            mediaCache.current.set(clip.id, video);
            loadingRef.current.delete(clip.id);
          };
          video.onerror = () => {
            console.warn(`Failed to load video: ${clip.source}`);
            loadingRef.current.delete(clip.id);
          };
          video.src = clip.source || '';
          video.load();
        }
      });
    }, [tracks]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
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

      // Draw video track clips
      const videoTrack = tracks.find(t => t.type === 'video');
      if (videoTrack) {
        videoTrack.clips.forEach(clip => {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
            const media = mediaCache.current.get(clip.id);
            if (media) {
              drawMedia(ctx, media, clip, width, height);
            } else if (clip.source) {
              drawLoadingPlaceholder(ctx, clip, width, height);
            }
          }
        });
      }

      // Draw text overlays
      const textTrack = tracks.find(t => t.type === 'text');
      if (textTrack) {
        textTrack.clips.forEach(clip => {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
            drawText(ctx, clip, width, height);
          }
        });
      }

      // Draw audio indicator
      const audioTrack = tracks.find(t => t.type === 'audio');
      if (audioTrack) {
        const hasAudio = audioTrack.clips.some(
          clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
        );
        if (hasAudio) {
          drawAudioIndicator(ctx, width, height);
        }
      }

      // Forward ref
      if (ref && typeof ref === 'object') {
        ref.current = canvas;
      }
    }, [currentTime, tracks, width, height, ref]);

    const drawMedia = (
      ctx: CanvasRenderingContext2D,
      media: HTMLImageElement | HTMLVideoElement,
      clip: Clip,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const props = clip.properties || {};
      const opacity = (props.opacity ?? 100) / 100;
      const scale = (props.scale ?? 100) / 100;
      const rotation = props.rotation ?? 0;
      const x = props.x ?? 0;
      const y = props.y ?? 0;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(canvasWidth / 2 + x, canvasHeight / 2 + y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      try {
        const mediaWidth = media.width || 400;
        const mediaHeight = media.height || 300;
        ctx.drawImage(media, -mediaWidth / 2, -mediaHeight / 2, mediaWidth, mediaHeight);
      } catch (e) {
        console.warn('Error drawing media:', e);
      }

      ctx.restore();
    };

    const drawLoadingPlaceholder = (
      ctx: CanvasRenderingContext2D,
      clip: Clip,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const props = clip.properties || {};
      const opacity = (props.opacity ?? 100) / 100;
      const scale = (props.scale ?? 100) / 100;
      const rotation = props.rotation ?? 0;
      const x = props.x ?? 0;
      const y = props.y ?? 0;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(canvasWidth / 2 + x, canvasHeight / 2 + y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const w = 200;
      const h = 150;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 2;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', 0, -10);
      ctx.font = '10px Arial';
      ctx.fillText(clip.type.toUpperCase(), 0, 10);

      ctx.restore();
    };

    const drawText = (
      ctx: CanvasRenderingContext2D,
      clip: Clip,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const props = clip.properties || {};
      const opacity = (props.opacity ?? 100) / 100;
      const scale = (props.scale ?? 100) / 100;
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
    };

    const drawAudioIndicator = (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.fillRect(canvasWidth - 60, 10, 50, 30);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const x = canvasWidth - 55 + i * 10;
        const h = 10 + Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(x, 25 - h / 2);
        ctx.lineTo(x, 25 + h / 2);
        ctx.stroke();
      }

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
