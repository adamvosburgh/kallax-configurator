# PDF Assembly Instructions Implementation

## Current Status: ✅ FULLY IMPLEMENTED

This document describes the PDF assembly instruction system for the Kallax-style modular shelving configurator. All pages are implemented with landscape letter format (792×612px).

**Key Components Implemented:**
- `src/geometry/pdfBooklet.ts` - Main PDF generation with pdf-lib
- `src/geometry/ripGenerator.ts` - Bin packing algorithm for sheet optimization
- `src/geometry/cutListSvg.ts` - Technical SVG generation for cut sheets
- `src/geometry/sceneCapture.ts` - 3D axonometric view capture
- `src/lib/svgToImage.ts` - SVG to PNG conversion for PDF embedding

**PDF Generation Process:**
1. Generate parts list from design parameters
2. Create sheet layouts using bin packing algorithm
3. Generate SVGs for cut sheets and oversized parts
4. Capture 3D axonometric view from scene
5. Convert SVGs to PNGs with proper scaling
6. Assemble multi-page PDF with embedded images

## Current Page Structure

### Page 1: Title Page with Overview and 3D View
**Header:**
- Title: {User-provided title or "Custom Modular Shelving"}
- Subtitle: "{cols} x {rows} with {back/no back} and {inset doors/overlay doors/no doors}"

**Body:**
- Description text: Overview for assembling a plywood modular shelving unit
- 3D Axonometric view: Captured from the 3D scene (centered, 450×350px)

**Implementation Details:**
- Uses `captureAxonometricView()` to render the 3D scene
- Captures at 2x resolution for quality
- Fallback rectangle if capture fails

### Page 2: Instruction Guys Image
**Body:**
- Instruction guys illustration (centered, 80% of page width)
- Source: `/src/assets/InstructionGuys.png`
- Maintains aspect ratio

**Implementation Details:**
- Scales to 80% of page width
- Centers on page
- Fallback text if image fails to load

### Page 3: Configuration & Parts List
**Header:**
- Title: "Configurations + Pieces"
- Subtitle: "Configurations set by user, and tabulated cut list"

**Body - Left Side:**
- Grid visualization drawn with native PDF vectors
- Shows rows, columns, and merged cells
- Cell coordinates displayed for regular cells
- Merge dimensions (e.g., "2×3") shown for merged cells
- Scales automatically for grids up to 6×6

**Body - Right Side (Configuration):**
- Grid layout (rows × columns)
- Module size (interior clearance)
- Depth
- Back panel (yes/no)
- Doors (yes/no)
- Frame thickness
- Back thickness (if applicable)
- Door thickness (if applicable)
- Door style (inset/overlay)
- Door reveal or overlay dimension

**Body - Bottom (Parts List):**
- Table with columns: Part ID, Role, Qty, Dimensions, Notes
- All parts listed with formatted dimensions
- Notes truncated to 27 characters if too long

**Implementation Details:**
- Grid uses dynamic scaling based on size
- Configuration mirrors the controls panel
- Parts table limited to available vertical space

### Page 4: Assembly Methods
**Header:**
- Title: "Connections and Assembly Methods"
- Subtitle: "Suggestions for how to assemble"

**Body:**
- **Butt Joints Section:**
  - Hidden screws (pre-drill, countersink, wood plugs)
  - Pocket screws (pocket hole jig)
  - Glued dowels (doweling jig)
  - Note: Use measurements as provided

- **Dados Section:**
  - 1/8" dados for shelves into vertical dividers (~1/2" material remains)
  - 1/4" dados for top/bottom/sides into end pieces (1/2" material remains)
  - Note: Adjust part dimensions for dado depth (e.g., add 1/8" to each side)

**Implementation Details:**
- Text rendered with proper formatting
- Section headers in bold
- Bullet points for each method

### Pages 5-N: Cut Sheets
**Header:**
- Title: "Cut List"
- Subtitle: "Suggestion for organizing cuts on 4' x 8' plywood sheet goods"

**Body - Top:**
- Description text explaining the packing algorithm
- Notes about 24" max rip width consideration
- Warning about 1" spacing (to avoid overpacking, not actual cut spacing)
- **Bold warning:** "Note - these dimensions may change depending on your preferred assembly method!! See previous section"

**Body - Sheets:**
- 3 sheet diagrams per page
- Each sheet shows:
  - Material thickness and utilization percentage
  - Part placement with labels
  - Rip cut lines
  - Dimensions
- SVGs generated at 280×500px, scaled to 50% of available height
- Additional pages created automatically if more than 3 sheets

**Implementation Details:**
- Uses `generateSheetLayouts()` for bin packing
- Uses `generateAllSheetSvgs()` for visualization
- Converts to PNG via `svgToPng()`
- Handles overflow to additional pages

### Page N+1 (if needed): Oversized Parts
**Header:**
- Title: "Cut List"

**Body:**
- Section title: "Parts That Do Not Fit Standard Sheets"
- Explanation text about parts exceeding 4'×8' sheets
- 2 parts per row display
- Each part shows:
  - Simplified SVG visualization
  - Part ID
  - Dimensions (width × length × thickness)
  - Reason (why it doesn't fit)
- Automatically creates additional pages if many oversized parts

**Implementation Details:**
- Uses `generateOversizedPartSvgs()` for visuals
- Maintains aspect ratio for each part
- Centers images and text
- Pagination handles overflow

### Page N+2: Assembly Guide

- Section title: Assembly Guide
- In this section, we essentially just provide diagrams that that show where joints go on the face of pieces. E.g. if you are preparing to fix a butt joint with hidden screws, you need to know where the *centerline* of the vertical dividers edge should intersect with the top and the bottom piece. this will simply look like a rectangle showing the piece, the part ID (e.g. Bottom-0) and it's dimensions, and then a dotted line where the vertical divider should go, with dims marking the distance to the edge, or to the next vertical divider center line, etc. The part ID should be on top of the rectangle of the piece and center. outter dims should be on the side, and dotted lines / inner dims should be inside the piece.
- I would like for you to prepare this by: 
  - generating images that fit the above description for each piece. you will need to make the dimensions of the image fit the aspect ratio of the piece, plus the area of margin required for the added text. Pieces scale should make sense relative to each other (e.g. if there is a 3 wide 2 high modular shelving unit, you would expect that the top is three times longer than the shelf).
  - once you have all of those images group them by their part type: top/bottom, vertical dividers, sides, shelves. Fill the page in a resonable way with them in that order (e.g. top and bottom pieces first as a group, then vertical diviers, etc). The part types need to be listed somewhere and the grouping clear. Use multiple pages if necessary. The scale of the parts should be consistent bewteen pages. I don't really care exactly how they are arrayed as long as it is clear and consistent, but one way I am imagine one group could be like this:

          Top/Bottom
  ------------------------------
  |  Top-0          Bottom-0    |
  |  -----          -------     |
  |  |   |          |     |     |
  |  |   |          |     |     |
  |  |   |          |     |     |
  |  |   |          |     |     |
  |  -----          -------     |
  -------------------------------

  Answers to your qeustions:

    1. Dotted lines for joints - Should I show dotted lines for:
    - Only where vertical dividers intersect with top/bottom/sides?
    - Also where shelves intersect with vertical dividers?
    - Also where sides intersect with top/bottom?
    You should show dotted lines for all intersections, on the piece that is being intersected with. that covers all of those case. you should not show a dotted line on a shelf going into a vertical divider, because in most cases that would mean that the dotted line would need to be on the butt of the shelf.
  2. Dimension labels - For the inner dimensions (distance between dotted lines),
  should these show:
    - Distance from edge to first divider centerline
    - Distance between consecutive divider centerlines
    - Both of the above?
    yes, both
  3. Part grouping - You mentioned grouping by: top/bottom, vertical dividers,
  sides, shelves. Should I:
    - Show top and bottom together (they're identical in most cases)?
    - Show all shelves together even if they're different sizes (due to merges)?
    - Show vertical dividers grouped by their height (since merged cells create
  different height dividers)?
  show all shelves together even if they're different sizes due to merges. it is totally expected that there will be variation within groups. 
  4. Multiple instances - If there are multiple identical parts (e.g., 3 shelves
  that are all the same size), should I:
    - Show just one diagram labeled "Shelf-0, Shelf-1, Shelf-2"?
    - Show each one separately?
    show each one seperately.
  5. Back panel and doors - Should these be included in the assembly guide, or
  only the frame pieces?
  no need, only the frame pieces
  6. SVG generation - Should I create a new function in cutListSvg.ts or a new
  file for these assembly diagrams?
  new file


After checking out your first pass, I have a few notes:
1. looking at the top part in the assembly guide for a 4x4 unit, I notice that the dimensions read like this:
(edge) - 13 31/32" - (vertical divider intersect) - 13 31/32" - (vertical divider intersect) - 13 31/32" - (vertical divider intersect) - 14 11/16" (edge)
I'm not sure how you arrived at these calculations. if the priority is to maintain an even 13.25" inch interior clearance in all modules, it should be these dimensions (where we are marking the distance to the centerlines of the vertical dividers):
(edge) - 14 11/32" - (vertical divider intersect) - 13 31/32" - (vertical divider intersect) - 13 31/32" - (vertical divider intersect) - 14 11/32" (edge)
this logic should be applied everywhere.
2. also, the sides and the vertical dividers do not dim out the distance from the edge to the first connection, and the last connection to the other edge. they say 0, where they should have a dim.

### Page N+2+ N2 (where n2 is the number of pages of the previous section): Notes & Thank You
**Header:**
- Title: "Notes"

**Body:**
- Generated from: adamvosburgh.github.io/kallax-configurator
- Thank you message
- Request for user photos: adamvosburgh@gmail.com
- Invitation to contribute via GitHub pull requests

**Implementation Details:**
- Simple text page
- Site URL sourced from constant

## Technical Implementation Notes

**Bin Packing Algorithm:**
- Groups parts by material thickness
- Uses 24" threshold for rip orientation decisions
- 1" margin between all cuts to avoid overpacking
- First-fit decreasing algorithm
- Calculates utilization percentage per sheet

**Grid Visualization:**
- Native PDF vector drawing (not SVG conversion)
- Dynamic scaling for grids larger than 6×6
- Merged cells shown with proper spanning
- Border and cell strokes with configurable widths

**3D Scene Capture:**
- Uses `captureAxonometricView()` from scene
- Renders at 2x resolution for quality
- Captures current design state with materials and colors

**SVG to PNG Conversion:**
- Custom `svgToPng()` utility
- Configurable width, height, and scale
- Used for cut sheets and oversized part diagrams

## Current Implementation Status

✅ All pages fully implemented
✅ Dynamic page count based on sheet layouts
✅ Oversized parts handling with visual diagrams
✅ 3D view capture integration
✅ Assembly method recommendations
✅ Configuration mirroring from UI
✅ Parts list with full details
✅ Grid visualization with merge support
