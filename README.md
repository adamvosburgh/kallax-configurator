# Kallax Configurator

A web-based tool for designing custom plywood modular shelving units. Generate cut lists, 3D previews, and assembly instructions for IKEA Kallax-style furniture.

## Features

- **Visual Grid Editor**: Design up to 10×10 layouts with drag-to-merge cells for larger openings
- **Real-time 3D Preview**: Interactive 3D view with customizable color schemes and transparency
- **Docked Window Interface**: Organized panels for grid layout, options, controls, export, and part legend
- **Material Configuration**: Select plywood thicknesses (1/4", 1/2", 3/4") with nominal-to-actual conversion
- **Door Hardware**: Configure drill guide or pull hole positions with adjustable inset distances
- **Smart Cut Lists**: Optimized sheet layouts for 4'×8' plywood with rip cut suggestions
- **PDF Assembly Instructions**: Generate IKEA-style booklets with axonometric views and cut diagrams
- **Export Options**: CSV cut lists, JSON design files, and shareable compressed URLs

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Design Specifications

### Default Dimensions
- **Interior clearance**: 13.25" × 13.25" (square modules)
- **Shelf depth**: 15.375" (interior)
- **Frame thickness**: 3/4" nominal (23/32" actual plywood)

### Assembly Methods
The app provides dimensions for **butt joint** construction. If using dados or rabbets, adjust part dimensions accordingly:

**Butt Joints:**
- Use measurements as-is
- Hidden screws, pocket screws, or glued dowels recommended

**Dados** (requires manual adjustment):
- 1/8" dados for shelves into vertical dividers
- 1/4" dados for top/bottom/sides into end pieces

### Material Options
- **Frame**: 3/4" plywood (1/2" also supported)
- **Back**: 1/4" plywood, surface-mounted (1/2", 3/4" also supported)
- **Doors**: 3/4" plywood (1/4", 1/2" also supported)
  - Inset style: 1/16" reveal (default)
  - Overlay style: 1/4" overlay

### Door Hardware
- **Drill guide**: 1/8" diameter marking for pilot holes
- **Pull hole**: 1" diameter for handle installation
- Configurable position (8 locations) and inset distance (default 1")

## Project Structure

```
src/
├── components/
│   ├── Canvas3D.tsx       # 3D preview with Three.js
│   ├── GridEditor.tsx     # Grid design interface
│   ├── ControlsPanel.tsx  # Dimensions and materials
│   ├── OptionsPanel.tsx   # Back panel, doors, hardware
│   ├── KeyPanel.tsx       # Color schemes, transparency, legend
│   ├── ExportPanel.tsx    # Export functionality
│   ├── FloatingWindow.tsx # Dockable/draggable window system
│   └── PartHoverCard.tsx  # 3D part hover tooltips
├── geometry/
│   ├── constants.ts       # Defaults and material specs
│   ├── types.ts           # TypeScript interfaces
│   ├── layout.ts          # Grid layout calculation
│   ├── parts.ts           # Part generation from layout
│   ├── measurements.ts    # Dimension calculations
│   ├── format.ts          # Fraction formatting
│   ├── estimate.ts        # Material estimation
│   ├── pdfBooklet.ts      # PDF assembly instructions
│   ├── cutListSvg.ts      # Sheet layout diagrams
│   └── ripGenerator.ts    # Cut optimization for 4'×8' sheets
├── state/
│   ├── useDesignStore.ts  # Design parameters (Zustand)
│   └── useFloatingWindowStore.ts # Window positions/state
└── pages/
    └── App.tsx            # Main layout with docked panels
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
The app features a docked panel layout (all panels can be undocked, moved, and collapsed):

**Left Sidebar:**
- **Grid Layout**: Design grid with drag-to-merge cells
- **Options**: Back panel, doors, door hardware configuration
- **Key**: 3D color scheme selector, transparency control, and part legend

**Right Sidebar:**
- **Controls**: Dimensions and material thickness settings
- **Export**: Generate CSV, JSON, PDF, or share links

### Workflow
1. Set grid dimensions (rows × columns) in Grid Layout
2. Drag to merge cells for larger openings
3. Configure options: back panel, doors (inset/overlay), hardware position
4. Adjust materials and dimensions in Controls
5. Customize 3D view with color schemes (greys/browns/blues/random) and transparency
6. Export cut lists, assembly instructions, or share designs via URL

### Export Formats
- **Cut List (CSV)**: Part dimensions with quantities for shop use
- **Assembly Instructions (PDF)**: Multi-page booklet with:
  - 3D axonometric view
  - Configuration summary
  - Parts list
  - Assembly method suggestions
  - Sheet layout diagrams (4'×8' plywood with rip cuts)
- **Design File (JSON)**: Complete design for backup/sharing
- **Share Link**: Compressed URL for easy sharing

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

- Dimensions calculated for **butt joints only** (dados/rabbets require manual adjustment)
- No structural analysis (relies on user judgment for large/unsupported spans)
- Cut list optimization is basic (uses simple bin packing with 24" max rip width)
- PDF diagrams show layout but not detailed assembly steps

## Future Enhancements

- More sophisticated cut optimization algorithms
- Detailed exploded view assembly diagrams
- Hardware specifications (screws, hinges, quantities)
- Material cost estimation with regional pricing
- CNC/laser cutter file export (DXF, SVG)

## Contributing

This is an open-source project under the MIT License. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## License

MIT License - see LICENSE file for details.