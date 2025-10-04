# Kallax Configurator

**Live at: [kallax-configurator.app](https://kallax-configurator.app)**

A web-based tool for designing custom plywood modular shelving units inspired by IKEA Kallax furniture. Generate cut lists, 3D previews, and comprehensive assembly instructions.

## Tech Stack

Built with React 19, TypeScript, Three.js (react-three-fiber), Zustand, and pdf-lib. Deployed via GitHub Pages.

## Design Assumptions

This configurator is based on the IKEA Kallax shelving unit dimensions and construction:

### Default Dimensions
- **Interior clearance**: 13.25" × 13.25" (square modules matching Kallax inserts)
- **Shelf depth**: 15.375" (interior)
- **Frame thickness**: 3/4" nominal plywood (23/32" actual)

### Construction Method
- Dimensions calculated for **butt joint** assembly
- Hidden screws, pocket screws, or glued dowels recommended
- If using dados or rabbets, part dimensions must be manually adjusted

### Material Options
- **Frame**: 3/4" or 1/2" plywood
- **Back panel**: 1/4" plywood (optional, surface-mounted)
- **Doors**: 3/4" plywood (optional)
  - Inset style with 1/16" reveal, or
  - Overlay style with 1/4" overlay
  - Euro hinges recommended (3/4" door depth required)

## Features

### Visual Design
- **Grid Editor**: Design up to 10×10 layouts with drag-to-merge cells for larger openings
- **Real-time 3D Preview**: Interactive view with customizable color schemes and transparency
- **Part Legend**: Hover over 3D parts to see dimensions and details
- **Docked Panels**: Organized interface with movable, collapsible windows

### PDF Assembly Booklet

The app generates comprehensive multi-page PDF assembly instructions:

1. **Title Page**: Project overview with 3D axonometric view
2. **Instruction Guys**: Fun illustrated safety/process overview
3. **Configuration & Parts List**: Grid layout diagram and complete parts table with quantities and dimensions
4. **Assembly Methods**: Guidance on butt joints and dados
5. **Cut Sheets**: Optimized 4'×8' plywood layouts using bin packing algorithm
   - Shows rip cut orientations for shop efficiency
   - Considers 24" max rip width constraint
   - Displays material utilization percentage
   - Handles oversized parts (>48" or >96")
6. **Assembly Guide (Beta)**: Technical diagrams showing joint locations for each frame piece
   - Dimensioned drawings with intersection centerlines
   - Part-by-part assembly reference
   - **Note**: May not be accurate for complex merged cell configurations
7. **Notes**: Credits and contact information

### Export Options
- **Cut List (CSV)**: Part dimensions with quantities for shop use
- **Design File (JSON)**: Complete design for backup/sharing
- **Share Link**: Compressed URL for easy sharing
- **Assembly Instructions (PDF)**: Full booklet as described above

## Quick Start

### Using the Live App
Visit [kallax-configurator.app](https://kallax-configurator.app) to start designing immediately.

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Workflow
1. Set grid dimensions (rows × columns) in the Grid Layout panel
2. Drag to merge cells for larger openings
3. Configure options: back panel, doors (inset/overlay), hardware position
4. Adjust materials and dimensions in the Controls panel
5. Customize 3D view with color schemes and transparency
6. Export cut lists, assembly instructions, or share designs via URL

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
- Cut list optimization is basic (simple bin packing with 24" max rip width constraint)
- **Assembly guide (Beta)** may not handle complex merged cell configurations accurately

## Contributing

This is an open-source project under the MIT License. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## License

MIT License - see LICENSE file for details.