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
          video.preload = 'auto';
          video.onloadedmetadata = () => {
            mediaCache.current.set(clip.id, video);
            loadingRef.current.delete(clip.id);
          };
          video.oncanplay = () => {
            if (!mediaCache.current.has(clip.id)) {
              mediaCache.current.set(clip.id, video);
              loadingRef.current.delete(clip.id);
            }
          };
          video.onerror = () => {
            console.warn(`Failed to load video: ${clip.source}`);
            loadingRef.current.delete(clip.id);
          };
          video.src = clip.source || '';
        }
      });
    }, [tracks]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas with dark background
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

      // Draw center crosshair
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw video track clips
      const videoTrack = tracks.find(t => t.type === 'video');
      if (videoTrack) {
        videoTrack.clips.forEach(clip => {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
            const media = mediaCache.current.get(clip.id);
            if (media) {
              // For videos, seek to the correct frame
              if (clip.type === 'video' && media instanceof HTMLVideoElement) {
                const clipProgress = currentTime - clip.startTime;
                media.currentTime = clipProgress;
              }
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
        // Get actual dimensions
        let mediaWidth = 0;
        let mediaHeight = 0;

        if (media instanceof HTMLVideoElement) {
          mediaWidth = media.videoWidth || 640;
          mediaHeight = media.videoHeight || 480;
        } else if (media instanceof HTMLImageElement) {
          mediaWidth = media.naturalWidth || media.width || 640;
          mediaHeight = media.naturalHeight || media.height || 480;
        }

        // Draw media centered
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

      const w = 300;
      const h = 200;
      
      // Draw rounded rectangle background
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + radius, -h / 2);
      ctx.lineTo(w / 2 - radius, -h / 2);
      ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
      ctx.lineTo(w / 2, h / 2 - radius);
      ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
      ctx.lineTo(-w / 2 + radius, h / 2);
      ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
      ctx.lineTo(-w / 2, -h / 2 + radius);
      ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw loading spinner
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20, 20, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();

      // Draw text
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', 0, 20);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.fillText(clip.type.toUpperCase(), 0, 40);

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
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(clip.text || 'Text', 0, 0);

      ctx.restore();
    };

    const drawAudioIndicator = (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(canvasWidth - 70, 15, 60, 40);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const x = canvasWidth - 65 + i * 12;
        const h = 12 + Math.random() * 18;
        ctx.beginPath();
        ctx.moveTo(x, 35 - h / 2);
        ctx.lineTo(x, 35 + h / 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full border border-border rounded-lg shadow-xl bg-background"
      />
    );
  }
);

VideoPreview.displayName = 'VideoPreview';

export default VideoPreview;
