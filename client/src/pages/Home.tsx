import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Upload, 
  Image, 
  Video, 
  Music, 
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TimelineEditor from "@/components/TimelineEditor";
import VideoPreview from "@/components/VideoPreview";
import ClipProperties from "@/components/ClipProperties";
import ExportButton from "@/components/ExportButton";
import { useKeyboardShortcuts } from "@/components/KeyboardShortcuts";

/**
 * Design Philosophy: Cinematic Dark Minimalism
 * - Dark theme (#0f0f0f background) reduces eye strain
 * - Emerald green accents (#10b981) for interactive elements
 * - Minimal UI with focus on content
 * - Professional video editing aesthetic
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

export default function Home() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [volume, setVolume] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track-1', type: 'video', label: 'Video', clips: [], height: 100 },
    { id: 'track-2', type: 'audio', label: 'Audio', clips: [], height: 60 },
    { id: 'track-3', type: 'text', label: 'Text', clips: [], height: 60 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const audioPlayersRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Handler functions
  const handlePlayPause = (): void => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = (): void => {
    setIsMuted(!isMuted);
    audioPlayersRef.current.forEach(audio => {
      audio.muted = !isMuted;
    });
  };

  const handleFullscreen = (): void => {
    if (canvasRef.current) {
      canvasRef.current.requestFullscreen?.();
    }
  };

  const handleAddClip = (type: 'video' | 'image' | 'audio' | 'text'): void => {
    if (type === 'text') {
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        type: 'text',
        startTime: currentTime,
        duration: 5,
        trackId: 'track-3',
        text: 'Sample Text',
        properties: {
          opacity: 100,
          scale: 100,
          rotation: 0,
          x: 0,
          y: 0,
          fontSize: 24,
          color: '#ffffff',
        },
      };

      setTracks(prev =>
        prev.map(track =>
          track.id === 'track-3'
            ? { ...track, clips: [...track.clips, newClip] }
            : track
        )
      );
    } else {
      document.getElementById('file-upload')?.click();
    }
  };

  const handleDeleteClip = (clipId: string): void => {
    setTracks(prev =>
      prev.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId),
      }))
    );
    setSelectedClipId(null);
  };

  const handleDuplicateClip = (clipId: string): void => {
    setTracks(prev =>
      prev.map(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return track;

        const newClip = {
          ...clip,
          id: `clip-${Date.now()}`,
          startTime: clip.startTime + clip.duration,
        };

        return {
          ...track,
          clips: [...track.clips, newClip],
        };
      })
    );
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onDelete: () => selectedClipId && handleDeleteClip(selectedClipId),
    onDuplicate: () => selectedClipId && handleDuplicateClip(selectedClipId),
    selectedClipId,
  });

  // Audio playback synchronization
  useEffect(() => {
    // Handle both audio track and video track audio
    const allClips = tracks.flatMap(t => t.clips);
    
    allClips.forEach(clip => {
      // Only process audio and video clips with sound
      if ((clip.type !== 'audio' && clip.type !== 'video') || !clip.source) return;

      let audio = audioPlayersRef.current.get(clip.id);
      if (!audio) {
        audio = new Audio();
        audio.src = clip.source;
        audio.crossOrigin = 'anonymous';
        audio.volume = volume / 100;
        audio.muted = isMuted;
        audioPlayersRef.current.set(clip.id, audio);
      }

      // Update volume and mute state
      audio.volume = volume / 100;
      audio.muted = isMuted;

      // Check if audio should be playing
      const isClipActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
      const clipProgress = currentTime - clip.startTime;

      if (isClipActive && isPlaying) {
        if (audio.paused) {
          audio.currentTime = Math.max(0, clipProgress);
          audio.play().catch((err) => console.warn('Audio play error:', err));
        } else {
          // Sync audio time if it drifts
          if (Math.abs(audio.currentTime - clipProgress) > 0.15) {
            audio.currentTime = Math.max(0, clipProgress);
          }
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    });
  }, [currentTime, isPlaying, tracks, volume, isMuted]);

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = Date.now();
    const targetFPS = 30;
    const frameTime = 1000 / targetFPS;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastTime;

      if (elapsed >= frameTime) {
        setCurrentTime(prev => {
          const newTime = prev + (frameTime / 1000);
          if (newTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(0);
            audioPlayersRef.current.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
            });
            return 0;
          }
          return newTime;
        });
        lastTime = now;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Video className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold">Video Timeline Pro</h1>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://discord.gg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Join our discord
            </a>
            <Button variant="outline" size="sm">
              Discord
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Section */}
        <div className="flex-1 flex flex-col items-center justify-center bg-background border-b border-border p-4 overflow-auto">
          <div className="w-full max-w-5xl h-full flex items-center justify-center">
            <VideoPreview 
              ref={canvasRef}
              currentTime={currentTime}
              tracks={tracks}
              width={1200}
              height={675}
            />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={handlePlayPause}
                className="w-10 h-10 p-0"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleMute}
                className="w-10 h-10 p-0"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleFullscreen}
                className="w-10 h-10 p-0"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                max={duration}
                step={0.01}
                className="flex-1"
              />
            </div>

            <div className="text-sm font-mono text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Media Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton
              tracks={tracks}
              duration={duration}
              width={800}
              height={450}
              fps={30}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddClip('image')}
              className="gap-2"
            >
              <Image className="w-4 h-4" />
              Add Image
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddClip('video')}
              className="gap-2"
            >
              <Video className="w-4 h-4" />
              Add Video
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddClip('audio')}
              className="gap-2"
            >
              <Music className="w-4 h-4" />
              Add Audio
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddClip('text')}
              className="gap-2"
            >
              <Type className="w-4 h-4" />
              Add Text
            </Button>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex-1 flex overflow-hidden border-t border-border bg-background">
          {/* Left Sidebar - Track Labels */}
          <div className="w-32 bg-card border-r border-border flex flex-col">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex-1 border-b border-border flex items-center px-3 py-2 text-sm font-medium text-muted-foreground"
                style={{ minHeight: track.height }}
              >
                {track.label}
              </div>
            ))}
          </div>

          {/* Timeline Editor */}
          <div className="flex-1 overflow-auto">
            <TimelineEditor
              tracks={tracks}
              currentTime={currentTime}
              duration={duration}
              zoomLevel={zoomLevel}
              selectedClipId={selectedClipId}
              onSelectClip={setSelectedClipId}
              onDeleteClip={handleDeleteClip}
              onDuplicateClip={handleDuplicateClip}
              onUpdateClip={(clipId: string, updates: Partial<Clip>) => {
                setTracks(prev =>
                  prev.map(track => ({
                    ...track,
                    clips: track.clips.map(clip =>
                      clip.id === clipId ? { ...clip, ...updates } : clip
                    ),
                  }))
                );
              }}
              onSeek={setCurrentTime}
            />
          </div>

          {/* Right Sidebar - Zoom Controls */}
          <div className="w-16 bg-card border-l border-border flex flex-col items-center justify-center gap-2 p-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 3))}
              className="w-8 h-8 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              {(zoomLevel * 100).toFixed(0)}%
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
              className="w-8 h-8 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        id="file-upload"
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;

          const fileUrl = URL.createObjectURL(file);
          const clipId = `clip-${Date.now()}`;
          let clipType: 'video' | 'image' | 'audio' = 'video';
          let trackId = 'track-1';

          if (file.type.startsWith('image')) {
            clipType = 'image';
          } else if (file.type.startsWith('audio')) {
            clipType = 'audio';
            trackId = 'track-2';
          }

          let duration = 5;

          // Detect video duration
          if (clipType === 'video') {
            const video = document.createElement('video');
            video.src = fileUrl;
            video.onloadedmetadata = () => {
              const videoDuration = video.duration || 5;
              setDuration(prev => Math.max(prev, videoDuration));
              setTracks(prev =>
                prev.map(track =>
                  track.id === trackId
                    ? {
                        ...track,
                        clips: track.clips.map(c =>
                          c.id === clipId
                            ? { ...c, duration: videoDuration }
                            : c
                        ),
                      }
                    : track
                )
              );
            };
          }

          const newClip: Clip = {
            id: clipId,
            type: clipType,
            startTime: currentTime,
            duration,
            trackId,
            source: fileUrl,
            text: file.name,
            properties: {
              opacity: 100,
              scale: 100,
              rotation: 0,
              x: 0,
              y: 0,
              fontSize: 24,
              color: '#ffffff',
            },
          };

          setTracks(prev =>
            prev.map(track =>
              track.id === trackId
                ? { ...track, clips: [...track.clips, newClip] }
                : track
            )
          );
        }}
      />

      {/* Clip Properties Panel */}
      {selectedClipId && (
        <ClipProperties
          clip={tracks
            .flatMap(t => t.clips)
            .find(c => c.id === selectedClipId)!}
          onUpdate={(clipId: string, updates: Partial<Clip>) => {
            setTracks(prev =>
              prev.map(track => ({
                ...track,
                clips: track.clips.map(clip =>
                  clip.id === clipId
                    ? { ...clip, ...updates }
                    : clip
                ),
              }))
            );
          }}
          onClose={() => setSelectedClipId(null)}
        />
      )}
    </div>
  );
}
