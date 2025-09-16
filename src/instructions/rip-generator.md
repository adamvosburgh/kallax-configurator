# Rip Generator Implementation

## Status: ✅ FULLY IMPLEMENTED

The rip generator creates optimized cut layouts for 4'×8' plywood sheets using a bin packing algorithm. This system is fully integrated into the PDF generation pipeline.

**Implementation Files:**
- `src/geometry/ripGenerator.ts` - Core packing algorithm and data structures
- `src/geometry/cutListSvg.ts` - SVG generation for cut sheet diagrams  
- `src/geometry/format.ts` - Fractional dimension formatting

## Sample Parts List

When a user makes a PDF, it will generate a list of all parts and their dimensions. That list looks like this:
Part ID	Role	Quantity	Length (in)	Width (in)	Thickness (in)	Dimensions	Notes
Top-0	Top	1	56.5938	15.375	0.7188	56 19/32" Ã— 15 3/8" Ã— 23/32"	Full-width top cap
Bottom-0	Bottom	1	56.5938	15.375	0.7188	56 19/32" Ã— 15 3/8" Ã— 23/32"	Full-width bottom cap
Side-0-L	Side	1	55.1563	15.375	0.7188	55 5/32" Ã— 15 3/8" Ã— 23/32"	Left side, runs between top/bottom
Side-1-R	Side	1	55.1563	15.375	0.7188	55 5/32" Ã— 15 3/8" Ã— 23/32"	Right side, runs between top/bottom
VDiv-1-R0to4	VerticalDivider	1	55.1563	15.375	0.7188	55 5/32" Ã— 15 3/8" Ã— 23/32"	Vertical segment at column 1, rows 0-4
VDiv-2-R0to4	VerticalDivider	1	55.1563	15.375	0.7188	55 5/32" Ã— 15 3/8" Ã— 23/32"	Vertical segment at column 2, rows 0-4
VDiv-3-R0to4	VerticalDivider	1	55.1563	15.375	0.7188	55 5/32" Ã— 15 3/8" Ã— 23/32"	Vertical segment at column 3, rows 0-4
Bay-1-Col0to1	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 1, runs between verticals
Bay-1-Col1to2	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 1, runs between verticals
Bay-1-Col2to3	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 1, runs between verticals
Bay-1-Col3to4	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 1, runs between verticals
Bay-2-Col0to1	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 2, runs between verticals
Bay-2-Col1to2	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 2, runs between verticals
Bay-2-Col2to3	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 2, runs between verticals
Bay-2-Col3to4	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 2, runs between verticals
Bay-3-Col0to1	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 3, runs between verticals
Bay-3-Col1to2	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 3, runs between verticals
Bay-3-Col2to3	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 3, runs between verticals
Bay-3-Col3to4	BayShelf	1	13.25	15.375	0.7188	13 1/4" Ã— 15 3/8" Ã— 23/32"	Shelf segment at row 3, runs between verticals
Back-0	Back	1	56.5938	56.5938	0.2188	56 19/32" Ã— 56 19/32" Ã— 7/32"	Surface-mounted back panel
Door-0	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-1	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-2	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-3	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-4	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-5	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-6	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-7	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-8	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-9	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-10	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-11	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-12	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-13	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-14	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal
Door-15	Door	1	13.125	13.125	0.7188	13 1/8" Ã— 13 1/8" Ã— 23/32"	Inset door with 0.0625" reveal


## Algorithm Requirements & Implementation

When a user generates a pdf, it should generate a schematic for them on the best way to organize their rip cuts. For the sake of simplicity, we will only do 4' x 8' plywood sheet.

This simply means the way to lay out *lengthwise* cuts (meaning 8' long cuts) to minimize material loss. The implemented packing algorithm generates simple schematics that satisfy these guidelines:
- Per every cut, whether rip or cross-cut, leave an inch of margin. E.g. if the parts list means we would have 4 x 12" rips, then the fourth rip would have to go on another sheet. The kerf of the blade eats material so things need some tolerance. Space cuts on the sheet with an inch between each of them (both for rips and cross-cuts)
- If both the pieces length and width is 24" and below, rip using the longest dimension. If above, rip using the shortest dimension. For example, in the included parts list, all of the bay shelves would be stacked so that you rip 15.375, and afterwards you cross cut 13.25. The vertical dividers on the other hand, you would rip 15.375 and cross cut 55.1563. This is so that most rips should work with standard max rip lengths of table saws etc.
- Group cuts by the material thickness. Don't worry about grouping similar parts with each other. Label them like "3/4" Sheet 1", "3/4" Sheet 2", "1/2" Sheet 1" etc
- don't worry about grains.
- there are going to be some wasteful cuts, that is aviodable. this is just to oragnize as many as possible.

## SVG Generation (Implemented)

The system generates technical drawings as SVGs with these features:
- **Sheet label** with thickness (e.g., "3/4\" Sheet 1") positioned at top-left
- **Part rectangles** with gray fill, black stroke, labeled with part ID at center
- **Rip cut lines** as dotted vertical lines spanning full sheet height
- **Dimension labels** showing rip widths at bottom edge
- **Utilization percentage** displayed at top-right
- **Tight margins** (40px) with proper title and dimension spacing

## Technical Implementation Details

### Data Structure & Algorithm
```typescript
interface SheetLayout {
  sheetId: string; // e.g., "3/4\" Sheet 1"
  thickness: number; // in inches
  parts: PlacedPart[];
  ripCuts: RipCut[];
  utilization: number; // percentage of sheet used
}

interface PlacedPart {
  partId: string;
  x: number; // position from left edge
  y: number; // position from bottom edge  
  width: number; // cross-cut dimension
  length: number; // rip dimension
  rotated: boolean; // if part was rotated per rip rules
}

interface RipCut {
  position: number; // distance from left edge
  width: number; // rip width
  label: string; // dimension label for bottom
}
```

### Packing Algorithm Implementation ✅
1. **Group by thickness** first (separate sheets per thickness) - *Implemented*
2. **Determine rip orientation** per part: - *Implemented*
   - If both dims ≤ 24": rip along longest dimension
   - If any dim > 24": rip along shortest dimension
3. **Sort parts by rip width** (primary) then cross-cut length (secondary) - *Implemented*
4. **First-fit decreasing**: Try to place parts in existing rips, create new rip if needed - *Implemented*
5. **Validate fit** with 1" margins between all cuts - *Implemented*
6. **Create new sheet** when current sheet can't accommodate - *Implemented*

### SVG Generation Implementation ✅
- **Sheet dimensions**: 4' × 8' (48" × 96") - *Implemented*
- **Scale**: Auto-calculated based on display height (400px) - *Implemented*
- **Part rectangles**: Stroke: black 1px, Fill: light gray, Text: center-aligned part ID - *Implemented*
- **Rip lines**: Dotted vertical lines (stroke-dasharray="5,5") - *Implemented*
- **Dimensions**: Bottom edge only, showing rip widths - *Implemented*
- **Sheet label**: Top-left corner, bold text - *Implemented*
- **Utilization display**: Top-right corner - *Implemented*

### Constants
```typescript
const SHEET_WIDTH = 48; // inches
const SHEET_HEIGHT = 96; // inches  
const CUT_MARGIN = 1; // inches between cuts
const MAX_RIP_LENGTH = 24; // threshold for rip orientation decision
```

### Integration Implementation ✅
- **Input**: Parts array from existing `generateParts()` function - *Implemented*
- **Output**: Array of `SheetLayout` objects + SVG strings - *Implemented*
- **PDF Integration**: Convert SVGs to PNG using existing `svgToPng()` utility - *Implemented*
- **Error handling**: Graceful fallback when parts don't fit standard sheets - *Implemented*
- **Function Export**: `generateSheetLayouts()` and `generateAllSheetSvgs()` - *Implemented*

### Current SVG Dimensions & Spacing
- **MARGIN**: 40px (increased from 10px for better visibility)
- **TITLE_SPACE**: 20px (for sheet labels)
- **DIMENSION_SPACE**: 20px (for rip dimension labels)
- **SVG_HEIGHT**: 480px (400 + 2×40 + 20 + 20)
- **PDF PNG Height**: 465px (corrected for proper scaling)

The system is fully functional and generates professional cut list diagrams for PDF assembly instructions.