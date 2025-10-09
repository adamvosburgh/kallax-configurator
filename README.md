# Kallax Configurator

**Live at: [adamvosburgh.github.io/kallax-configurator](https://adamvosburgh.github.io/kallax-configurator)**

Design your own modular shelving system – inspired by IKEA’s Kallax, but made for DIYers.

## About

I built this tool after moving into a new apartment and needing new furniture – entry cabinets, media consoles, nightstands, a mix of open and closed storage. I wanted to upgrade from my previous IKEA pieces – mainly in material – while keeping their functionality, modularity, and affordability. The IKEA kallax module worked well here, with the added bonus of also being compatible with the cheap accesories sold at IKEA. I built this furniture using an elaborate block system in rhino, and afterwards decided to open-source the schematic part of that for the community via this web app. You can see some pictures of the furniture I built in src/assets/example. It's not perfect, mainly because of my incredibly lean setup and the realities of building 13 pieces in a NYC apartment, but the measurements work well at least.

This tool lets you make plywood furniture that’s compatible with IKEA Kallax accessories, merge or resize modules (taller, wider, deeper, shallower), and customize doors, backs, and proportions. For reference: all my own builds are 16" deep (to match what I planned to place on top) and use 1/2" doors – which work fine structurally, but are too shallow for a standard Euro hinge.

I made this for fun and hope others find it useful. If you make something with it, please share! You can reach me by email with builds, issues, or suggestions – I’ll do my best to reply.

## How to Use

Design your shelving: set the size of your grid, merge cells, add backs or doors, and adjust depth as you like. Watch for warnings: this tool doesn’t prevent bad design. It’s completely possible to make a structurally unstable unit here – so please pay attention to messages and remember: 3/4" plywood is heavy.

Need help with strength? Try the [Sagulator](https://woodbin.com/calcs/sagulator/) to estimate shelf deflection.

Collaborate: use “Share design link” to send a saved configuration to someone else.

Build it: generate a PDF when you’re ready – it’ll create an IKEA-style assembly guide (with caveats and best practices noted inside,) that will give you a rip cut guide and schematics for joint placement. Please note that **the dimensions created are for butt joints**. If you would like to use dados/rabbets (which is what I used,) you will need to add on that additional length to the relevant parts. 

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

## Known Limitations

- Dimensions calculated for **butt joints only** (dados/rabbets require manual adjustment)
- No structural analysis (relies on user judgment for large/unsupported spans)
- Cut list optimization is basic (simple bin packing with 24" max rip width constraint)
- The Assembly Guide on the PDF may not handle complex merged cell configurations accurately

## Info about the app:

### Tech Stack

Built with React 19, TypeScript, Three.js (react-three-fiber), Zustand, and pdf-lib. Deployed via GitHub Pages.

### Quick Start

### Using the Live App
Visit [adamvosburgh.github.io/kallax-configurator](https://adamvosburgh.github.io/kallax-configurator) to start designing immediately.

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

## Contributing

This is an open-source project under the MIT License. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## License

MIT License - see LICENSE file for details.