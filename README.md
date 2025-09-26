# Kallax Configurator

An open-source web application for designing IKEA Kallax-style modular shelving units with 3D preview and IKEA-style assembly instructions.

## Features

- **Visual Grid Editor**: Design shelving layouts up to 10×10 with drag-to-merge functionality
- **Real-time 3D Preview**: See your design in 3D with hover tooltips for part details
- **Floating Window Interface**: Modular UI with draggable/resizable panels inspired by Hylics aesthetic
- **Material Configuration**: Choose plywood thicknesses with actual vs nominal options
- **Export Options**: Generate cut lists (CSV), design files (JSON), and assembly instructions (PDF)
- **URL Sharing**: Share designs via compressed URLs
- **Responsive Design**: Works on desktop and tablet devices
- **Optional 3D Merge Tools**: Hover-based merge targets in 3D view (disabled by default)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Construction Assumptions

This configurator is based on IKEA Kallax design principles with the following specifications:

### Default Dimensions
- **Interior clearance**: 13.25" × 13.25" (square modules)  
- **Shelf depth**: 15.375" (interior)
- **Frame thickness**: 3/4" nominal (23/32" actual plywood)

### Construction Method (v1)
- **Butt joints only** (no dados or rabbets)
- **Top/bottom pieces**: Run full width, unbroken
- **Vertical pieces**: Run full height, stop inside top/bottom caps
- **Interior shelves**: Segmented between verticals (not continuous)

### Material Options
- **Frame**: 1/2" or 3/4" plywood (3/4" recommended)
- **Back**: 1/4", 1/2", or 3/4" plywood (1/4" recommended, surface-mounted)
- **Doors**: 1/4", 1/2", or 3/4" plywood (3/4" recommended)

### Door Types
- **Inset**: Fits inside opening with 1/16" reveal (default)
- **Overlay**: Covers opening with 1/2" overlay

### Exterior Dimensions Formula
For N modules in a direction:
```
exterior = (N × interior_clearance) + ((N + 1) × frame_thickness_actual)
```

**Example**: 2×2 shelf with 3/4" frame:
- Width: 2×13.25 + 3×(23/32) = 28 21/32"
- Height: 2×13.25 + 3×(23/32) = 28 21/32"  
- Depth: 15 3/8" (no back) or 15 3/8" + back thickness

## Project Structure

```
src/
├── components/         # React components
│   ├── Canvas3D.tsx   # 3D preview with Three.js
│   ├── GridEditor.tsx # Grid design interface
│   ├── ControlsPanel.tsx # Material and option controls
│   ├── ExportPanel.tsx # Export functionality
│   ├── FloatingWindow.tsx # Draggable/resizable window system
│   ├── PartHoverCard.tsx # 3D part detail tooltip
│   └── MergeTargetOverlay.tsx # Optional 3D merge functionality
├── geometry/          # Core calculation logic
│   ├── constants.ts   # Default values and materials
│   ├── types.ts       # TypeScript interfaces
│   ├── layout.ts      # Layout calculation (verticals/horizontals)
│   ├── parts.ts       # Parts generation from layout
│   ├── format.ts      # Inch-to-fraction utilities
│   ├── estimate.ts    # Material estimation and warnings
│   ├── svgDiagrams.ts # Assembly step diagrams
│   └── pdfBooklet.ts  # PDF instruction generation
├── state/             # State management
│   ├── useDesignStore.ts # Main design state (Zustand)
│   └── useFloatingWindowStore.ts # UI window management
└── pages/
    └── App.tsx        # Main application layout with floating windows
```

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **3D Graphics**: Three.js via react-three-fiber + drei
- **State Management**: Zustand with persistence  
- **Styling**: Tailwind CSS
- **PDF Generation**: pdf-lib
- **Testing**: Vitest + Testing Library
- **Export**: PapaParse (CSV), lz-string (URL compression)

## Usage

### Interface
The application uses a floating window interface with draggable, resizable panels:
- **Grid Layout**: Design your shelving grid with drag-to-merge functionality
- **Controls**: Material settings, back panels, doors, and dimensions
- **Export**: Generate cut lists, design files, and assembly instructions
- **Parts Key**: 3D color legend for part identification

### Basic Design
1. Set grid size (rows × columns)
2. Drag to merge cells for larger openings in the 2D grid editor
3. Enable back panel and/or doors as needed
4. Adjust material thicknesses if required
5. View real-time 3D preview with hover details

### Material Overrides
The app uses standard plywood thicknesses by default:
- 1/4" → 7/32" (0.21875")
- 1/2" → 15/32" (0.46875")  
- 3/4" → 23/32" (0.71875")

Override these values in the controls panel for your specific material.

### Exporting
- **Cut List (CSV)**: Formatted for shop use with precise dimensions
- **Design (JSON)**: Complete design data for backup/sharing
- **Instructions (PDF)**: IKEA-style assembly booklet
- **Share Link**: URL with compressed design data

### 3D Merge Functionality (Experimental)
An optional 3D merge system allows creating cell merges directly in the 3D view:
- **Disabled by default** due to performance considerations
- **Toggle via code**: Set `ENABLE_3D_MERGE_TARGETS = true` in `Canvas3D.tsx`
- **Hover-based targets**: Plus icons appear between adjacent cells
- **Animation system**: Icons scale and change opacity on hover
- **Click to merge**: Works with existing merge logic from 2D grid

*Note: Use the 2D grid editor for primary merge functionality - it's more reliable and performant.*

## Development

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run lint         # ESLint
```

### Testing
Key geometry functions have unit tests:
```bash
npm run test src/geometry/
```

Tests cover layout calculation, parts generation, and dimension formatting.

## Known Limitations

- **v1 uses butt joints only** - dados/rabbets not implemented
- **No structural analysis** - relies on user judgment for large spans
- **Simplified 3D positioning** - parts shown relative to overall dimensions
- **PDF diagrams are basic** - more detailed exploded views planned for v2
- **3D merge functionality is experimental** - disabled by default due to performance considerations

## Future Enhancements

- Advanced joinery options (dados, rabbets)
- Hardware specifications (screws, hinges, etc.)
- Cut optimization for sheet goods
- Detailed exploded view diagrams
- Material cost estimation
- CNC/laser cut file export

## Contributing

This is an open-source project under the MIT License. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## License

MIT License - see LICENSE file for details.