import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

/**
 * ClipProperties Component
 * 
 * Design: Cinematic Dark Minimalism
 * - Floating panel for editing clip properties
 * - Opacity, scale, rotation, position controls
 * - Color picker for text clips
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

interface ClipPropertiesProps {
  clip: Clip | null;
  onClose: () => void;
  onUpdate: (clipId: string, updates: Partial<Clip>) => void;
}

export default function ClipProperties({
  clip,
  onClose,
  onUpdate,
}: ClipPropertiesProps) {
  if (!clip) return null;

  const props = clip.properties || {};

  const handlePropertyChange = (key: string, value: any) => {
    onUpdate(clip.id, {
      properties: {
        ...props,
        [key]: value,
      },
    });
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-xl p-4 z-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">
          {clip.type === 'text' ? 'Text Properties' : 'Clip Properties'}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="w-6 h-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Properties */}
      <div className="space-y-4">
        {/* Opacity */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Opacity: {Math.round((props.opacity ?? 1) * 100)}%
          </label>
          <Slider
            value={[(props.opacity ?? 1) * 100]}
            onValueChange={([value]) =>
              handlePropertyChange('opacity', value / 100)
            }
            max={100}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Scale */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Scale: {((props.scale ?? 1) * 100).toFixed(0)}%
          </label>
          <Slider
            value={[(props.scale ?? 1) * 100]}
            onValueChange={([value]) =>
              handlePropertyChange('scale', value / 100)
            }
            max={200}
            min={10}
            step={5}
            className="mt-2"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Rotation: {Math.round(props.rotation ?? 0)}°
          </label>
          <Slider
            value={[props.rotation ?? 0]}
            onValueChange={([value]) =>
              handlePropertyChange('rotation', value)
            }
            max={360}
            min={0}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Position X */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Position X: {Math.round(props.x ?? 0)}px
          </label>
          <Slider
            value={[props.x ?? 0]}
            onValueChange={([value]) =>
              handlePropertyChange('x', value)
            }
            max={400}
            min={-400}
            step={10}
            className="mt-2"
          />
        </div>

        {/* Position Y */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Position Y: {Math.round(props.y ?? 0)}px
          </label>
          <Slider
            value={[props.y ?? 0]}
            onValueChange={([value]) =>
              handlePropertyChange('y', value)
            }
            max={225}
            min={-225}
            step={10}
            className="mt-2"
          />
        </div>

        {/* Text-specific properties */}
        {clip.type === 'text' && (
          <>
            {/* Font Size */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Font Size: {props.fontSize ?? 24}px
              </label>
              <Slider
                value={[props.fontSize ?? 24]}
                onValueChange={([value]) =>
                  handlePropertyChange('fontSize', value)
                }
                max={120}
                min={8}
                step={2}
                className="mt-2"
              />
            </div>

            {/* Text Content */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Text
              </label>
              <input
                type="text"
                value={clip.text || ''}
                onChange={(e) =>
                  onUpdate(clip.id, { text: e.target.value })
                }
                className="w-full mt-2 px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter text..."
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={props.color ?? '#ffffff'}
                  onChange={(e) =>
                    handlePropertyChange('color', e.target.value)
                  }
                  className="w-12 h-10 rounded cursor-pointer border border-border"
                />
                <input
                  type="text"
                  value={props.color ?? '#ffffff'}
                  onChange={(e) =>
                    handlePropertyChange('color', e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reset Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          onUpdate(clip.id, {
            properties: {
              opacity: 1,
              scale: 1,
              rotation: 0,
              x: 0,
              y: 0,
              fontSize: 24,
              color: '#ffffff',
            },
          });
        }}
        className="w-full mt-4"
      >
        Reset to Default
      </Button>
    </div>
  );
}
