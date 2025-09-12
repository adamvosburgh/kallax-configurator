 Revised List:
   1. MEASUREMENT VARIABLES

  | Variable Name           | Description                                | Where Defined                      | Default Value
                       |
  |-------------------------|--------------------------------------------|------------------------------------|-----------------------
  ---------------------|
  | moduleInches ~~interiorClearanceInches~~ | Interior clearance for each module opening | DesignParams interface in types.ts | 13.25 inches
                       |
  | depthInches             | Depth of the entire shelf unit             | DesignParams interface in types.ts | 15.375 inches
                       |
  | insetRevealInches ~~revealInches~~            | Gap around inset doors                     | DoorMode interface in types.ts     | 0.0625 inches (1/16")
                       |
  | overlayInches           | Overlay amount for overlay doors           | DoorMode interface in types.ts     | 0.5 inches
                       |
  | actualInches            | Actual thickness of material (vs nominal)  | ThicknessMap interface in types.ts | '1/4"': 7/32, '1/2"':
  15/32, '3/4"': 23/32 |
  | extWidth                | Calculated exterior width                  | DerivedDimensions in types.ts      | Calculated dynamically
                       |
  | extHeight               | Calculated exterior height                 | DerivedDimensions in types.ts      | Calculated dynamically
                       |
  | extDepth                | Calculated exterior depth                  | DerivedDimensions in types.ts      | Calculated dynamically
                       |

  2. PART TYPES AND PROPERTIES

  | Part Role       | Length (lengthIn) | Width (widthIn) | Thickness (thicknessIn) | What It Represents           |
  |-----------------|-------------------|-----------------|-------------------------|------------------------------|
  | Top             | extWidth          | depthInches     | frameThickness          | Full-width top cap piece     |
  | Bottom          | extWidth          | depthInches     | frameThickness          | Full-width bottom cap piece  |
  | Side            | sideHeight        | depthInches     | frameThickness          | Left/right side panels       |
  | VerticalDivider | sideHeight        | depthInches     | frameThickness          | Interior vertical separators |
  | BayShelf        | bayWidth          | depthInches     | frameThickness          | Horizontal shelf segments    |
  | Back            | extWidth          | extHeight       | backThickness           | Rear panel                   |
  | Door            | varies by mode    | varies by mode  | doorThickness           | Door panels                  |

  3. POSITIONING VARIABLES (3D Canvas)

  | Variable Name              | Calculation                  | Where Used        | Purpose                       |
  |----------------------------|------------------------------|-------------------|-------------------------------|
  | scaleX/Y/Z                 | dimension * 0.1              | PartMesh          | Convert inches to scene units |
  | position (Bottom)          | [0, ((-extHeight * 0.1) / 2) + (frameThickness / 2), 0] | getPartPosition() | Bottom Y-position             |
  | position (Top)             | [0, ((extHeight * 0.1) / 2) - (frameThickness / 2), 0]  | getPartPosition() | Top Y-position                |
  | position (Side-L)          | [((-extWidth * 0.1) / 2) + (frameThickness / 2), 0, 0]  | getPartPosition() | Left X-position               |
  | position (Side-R)          | [((extWidth * 0.1) / 2) - (frameThickness / 2), 0, 0]   | getPartPosition() | Right X-position              |
  | position (Back)            | [0, 0, -extDepth * 0.1 / 2]  | getPartPosition() | Back Z-position               |
  | rotation (Sides/Verticals) | [0, 0, π/2]                  | getRotation()     | 90° Z-rotation                |
  | rotation (Back/Doors)      | [π/2, 0, 0]                  | getRotation()     | 90° X-rotation                |

  Key Formulas:
  - Exterior Width: cols × module ~~interiorClearance~~ + (cols + 1) × frameThickness
  - Exterior Height: rows × module ~~interiorClearance~~ + (rows + 1) × frameThickness
  - Exterior Depth: depthInches + (hasBack ? backThickness : 0)
  - Bay Width: moduleCount × module ~~interiorClearance~~ + (moduleCount - 1) × frameThickness
  - Side Height: extHeight - 2 × frameThickness

