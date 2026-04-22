import { useRef, useState, useEffect } from 'react';
import { Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * TimelineEditor Component
 * 
 * Design: Cinematic Dark Minimalism
 * - Horizontal timeline with draggable clips
 * - Multi-track support with visual separation
 * - Zoom and scroll capabilities
 * - Clip selection and context menu
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

interface TimelineEditorProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoomLevel: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onSeek: (time: number) => void;
}

export default function TimelineEditor({
  tracks,
  currentTime,
  duration,
  zoomLevel,
  selectedClipId,
  onSelectClip,
  onDeleteClip,
  onDuplicateClip,
  onUpdateClip,
  onSeek,
}: TimelineEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);

  const pixelsPerSecond = 100 * zoomLevel;

  const handleClipMouseDown = (
    e: React.MouseEvent,
    clipId: string,
    clip: Clip
  ) => {
    if (e.button === 2) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isResizeHandle = clickX > rect.width - 10;

    if (isResizeHandle) {
      setIsResizing(true);
      setResizingClipId(clipId);
    } else {
      setIsDragging(true);
      setDraggedClipId(clipId);
      setDragOffset(e.clientX - rect.left);
    }

    onSelectClip(clipId);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    if (isDragging && draggedClipId) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset;
      const newTime = Math.max(0, newX / pixelsPerSecond);

      const clip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === draggedClipId);

      if (clip) {
        onUpdateClip(draggedClipId, { startTime: newTime });
      }
    }

    if (isResizing && resizingClipId) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const clip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === resizingClipId);

      if (clip) {
        const endX = e.clientX - containerRect.left;
        const endTime = endX / pixelsPerSecond;
        const newDuration = Math.max(0.1, endTime - clip.startTime);
        onUpdateClip(resizingClipId, { duration: newDuration });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedClipId(null);
    setIsResizing(false);
    setResizingClipId(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    clipId: string
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, clipId });
    onSelectClip(clipId);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('timeline-background')) {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const newTime = clickX / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(newTime, duration)));
      onSelectClip(null);
    }
  };

  useEffect(() => {
    const handleMouseMoveDocument = (e: MouseEvent) => {
      handleMouseMove(e as any);
    };
    const handleMouseUpDocument = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleMouseMoveDocument);
    document.addEventListener('mouseup', handleMouseUpDocument);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDocument);
      document.removeEventListener('mouseup', handleMouseUpDocument);
    };
  }, [isDragging, draggedClipId, isResizing, resizingClipId, pixelsPerSecond, tracks]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as HTMLElement).closest('[data-context-menu]')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const timelineWidth = duration * pixelsPerSecond;
  const playheadX = currentTime * pixelsPerSecond;

  const getClipColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-900/50 border-blue-600 hover:bg-blue-800/60';
      case 'audio':
        return 'bg-purple-900/50 border-purple-600 hover:bg-purple-800/60';
      case 'text':
        return 'bg-orange-900/50 border-orange-600 hover:bg-orange-800/60';
      case 'image':
        return 'bg-green-900/50 border-green-600 hover:bg-green-800/60';
      default:
        return 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/60';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-background overflow-x-auto overflow-y-auto"
      onMouseDown={handleTimelineClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Timeline Background */}
      <div
        className="timeline-background relative"
        style={{ width: timelineWidth, minHeight: '100%' }}
      >
        {/* Time Ruler */}
        <div className="sticky top-0 h-8 bg-card/80 backdrop-blur-sm border-b border-border flex items-end z-20">
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 border-r border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
              style={{ width: pixelsPerSecond }}
            >
              <div className="px-2 py-1 font-mono">{i}s</div>
            </div>
          ))}
        </div>

        {/* Tracks */}
        {tracks.map((track) => (
          <div
            key={track.id}
            className="relative border-b border-border bg-background/50 hover:bg-background/70 transition-colors"
            style={{ height: track.height }}
          >
            {/* Track Background Grid */}
            {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-r border-border/20"
                style={{
                  left: i * pixelsPerSecond,
                  width: pixelsPerSecond,
                }}
              />
            ))}

            {/* Clips */}
            {track.clips.map((clip) => (
              <div
                key={clip.id}
                className={`absolute top-1.5 bottom-1.5 rounded-md cursor-move transition-all duration-200 border ${
                  selectedClipId === clip.id
                    ? 'ring-2 ring-accent shadow-lg z-10'
                    : 'hover:shadow-md z-5'
                } ${getClipColor(clip.type)} group overflow-hidden`}
                style={{
                  left: clip.startTime * pixelsPerSecond,
                  width: Math.max(30, clip.duration * pixelsPerSecond),
                }}
                onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip)}
                onContextMenu={(e) => handleContextMenu(e, clip.id)}
              >
                {/* Clip Label */}
                <div className="px-2 py-1 text-xs font-semibold text-foreground truncate pointer-events-none">
                  {clip.type === 'text' ? clip.text : clip.source || clip.type}
                </div>

                {/* Resize Handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 bg-accent opacity-0 group-hover:opacity-100 cursor-col-resize transition-opacity hover:w-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizingClipId(clip.id);
                    onSelectClip(clip.id);
                  }}
                />

                {/* Delete Button */}
                <button
                  className="absolute top-0.5 right-0.5 p-1 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClip(clip.id);
                  }}
                  title="Delete clip"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* Duration Label */}
                {clip.duration * pixelsPerSecond > 60 && (
                  <div className="absolute bottom-0 right-2 text-xs text-muted-foreground opacity-60 pointer-events-none">
                    {clip.duration.toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none z-30 shadow-lg"
          style={{ left: playheadX }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-accent rounded-full -mt-2 shadow-lg" />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-xl z-50 py-1 backdrop-blur-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          data-context-menu
        >
          <button
            className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent/20 flex items-center gap-2 transition-colors"
            onClick={() => {
              onDuplicateClip(contextMenu.clipId);
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/20 flex items-center gap-2 transition-colors"
            onClick={() => {
              onDeleteClip(contextMenu.clipId);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
