import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportAsWebM, downloadBlob } from '@/lib/exportUtils';

/**
 * ExportButton Component
 * 
 * Provides export functionality for timeline composition
 * Exports as WebM video (can be converted to MP4)
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

interface ExportButtonProps {
  tracks: Track[];
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
}

export default function ExportButton({
  tracks,
  duration,
  width = 800,
  height = 450,
  fps = 30,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);

      // Export as WebM
      const webmBlob = await exportAsWebM(
        tracks,
        duration,
        width,
        height,
        fps,
        (progress) => setProgress(progress)
      );

      // Download the file
      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(webmBlob, `video-timeline-${timestamp}.webm`);

      setProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExport}
        disabled={isExporting || duration === 0}
        className="gap-2"
        variant={isExporting ? 'secondary' : 'default'}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting... {Math.round(progress)}%
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export as WebM
          </>
        )}
      </Button>
      
      {isExporting && (
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
