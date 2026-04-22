# Video Timeline Pro

A professional video timeline editor web application built with React, TypeScript, and Tailwind CSS. Features multi-track editing, real-time preview, and comprehensive media management.

## Features

### Core Functionality
- **Multi-track Timeline**: Support for video, audio, and text tracks
- **Real-time Preview**: Canvas-based video preview with live rendering
- **Drag & Drop**: Easily reposition clips on the timeline
- **Clip Resizing**: Adjust clip duration by dragging edges
- **Zoom Controls**: Zoom in/out for detailed editing
- **Playback Controls**: Play, pause, mute, and fullscreen options

### Media Management
- **Multiple Media Types**: Support for images, videos, audio, and text
- **Quick Add**: One-click buttons to add media to timeline
- **Clip Properties**: Edit opacity, scale, rotation, position, and color
- **Context Menu**: Right-click to duplicate or delete clips
- **Keyboard Shortcuts**: Space (play/pause), Delete (remove), Ctrl+D (duplicate)

### User Interface
- **Dark Theme**: Professional dark interface with emerald green accents
- **Responsive Design**: Works on desktop and tablet devices
- **Intuitive Layout**: Familiar timeline paradigm from professional video editors
- **Visual Feedback**: Clear selection states and hover effects

## Design Philosophy: Cinematic Dark Minimalism

The interface follows a minimalist design approach inspired by professional video editing software:

- **Dark Background**: Reduces eye strain during long editing sessions
- **Emerald Green Accents**: Strategic use of color for interactive elements
- **Minimal UI**: Focus on content with clean, uncluttered controls
- **Professional Aesthetic**: Familiar paradigm for video editors

## Technical Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Canvas Rendering**: HTML5 Canvas API for video preview
- **Icons**: Lucide React

## Project Structure

```
client/
  src/
    pages/
      Home.tsx           # Main editor page
    components/
      TimelineEditor.tsx # Timeline with clips and tracks
      VideoPreview.tsx   # Canvas-based video preview
      ClipProperties.tsx # Clip property editor
      KeyboardShortcuts.tsx # Keyboard shortcut handling
    index.css           # Global styles and theme
  public/
    index.html          # HTML entry point
```

## Getting Started

### Installation

```bash
cd video-timeline-editor
pnpm install
```

### Development

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
pnpm build
```

## Usage

### Adding Clips

1. Click "Add Image", "Add Video", "Add Audio", or "Add Text" to add media to the timeline
2. Clips are placed at the current playhead position
3. Right-click on a clip to duplicate or delete it

### Editing Clips

1. Click on a clip to select it
2. The properties panel appears in the bottom-right corner
3. Adjust opacity, scale, rotation, position, and other properties
4. For text clips, edit the text content and color

### Timeline Navigation

1. Use the play/pause button to control playback
2. Click on the timeline to seek to a specific position
3. Use zoom controls to zoom in/out
4. Drag clips to reposition them
5. Drag clip edges to resize them

### Keyboard Shortcuts

- **Space**: Play/Pause
- **Delete**: Delete selected clip
- **Ctrl+D**: Duplicate selected clip
- **Ctrl+Z**: Undo (placeholder)
- **Ctrl+Shift+Z**: Redo (placeholder)

## Data Structure

### Clip
```typescript
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
```

### Track
```typescript
interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  label: string;
  clips: Clip[];
  height: number;
}
```

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Export to video format
- [ ] Audio waveform visualization
- [ ] Keyframe animation support
- [ ] Transition effects between clips
- [ ] Color correction and filters
- [ ] Multi-select and batch operations
- [ ] Project save/load
- [ ] Collaboration features
- [ ] Mobile app version

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

The timeline editor is optimized for smooth performance:

- Efficient canvas rendering with requestAnimationFrame
- Memoized components to prevent unnecessary re-renders
- Lazy loading of media assets
- Smooth animations with GPU acceleration

## Accessibility

The interface includes:

- Keyboard navigation support
- Clear visual focus indicators
- Semantic HTML structure
- ARIA labels for interactive elements
- High contrast colors for readability

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using React and Tailwind CSS
