# Requirements Document

## Introduction

The Matatalab Simulator is a block-based programming app built with React and @dnd-kit. Currently, the primary interaction model is drag-and-drop, which works well on desktop but creates friction on iPad and other touch devices. Drag-and-drop on touch screens is imprecise, fatiguing, and conflicts with native gestures like scrolling. This feature introduces a tap-to-place interaction mode as an alternative, improves touch target sizing, adds block removal gestures suited to touch, and refines the overall layout for tablet use — making the app comfortable and intuitive on iPad without degrading the desktop experience.

## Glossary

- **Simulator**: The Matatalab Simulator web application
- **Block_Inventory**: The panel displaying available programming blocks with remaining counts
- **Control_Board**: The panel containing program lines where blocks are placed to form programs
- **Program_Line**: A horizontal row on the Control_Board that holds a sequence of coding blocks (line 0 is the main program, line 1 is the function definition)
- **Coding_Block**: An individual programming instruction (e.g., forward, turn_left, loop_begin) that can be placed on a Program_Line
- **Tap_To_Place_Mode**: An interaction mode where the user taps a block in the Block_Inventory to select it, then taps a position on the Control_Board to place it
- **Selected_Block**: A block in the Block_Inventory that has been tapped and is awaiting placement on the Control_Board
- **Touch_Device**: A device with a touch screen as the primary input (iPad, Android tablet, touch-enabled laptop)
- **Drop_Zone**: A visual insertion point between blocks on a Program_Line where a new block can be placed
- **Long_Press**: A touch gesture where the user presses and holds on an element for a defined duration
- **Selection_Indicator**: A visual highlight applied to a block or drop zone to show it is currently selected or targeted

## Requirements

### Requirement 1: Tap-to-Select Block from Inventory

**User Story:** As an iPad user, I want to tap a block in the inventory to select it, so that I can place blocks without dragging.

#### Acceptance Criteria

1. WHEN a user taps an available Coding_Block in the Block_Inventory, THE Simulator SHALL mark that Coding_Block as the Selected_Block and display a Selection_Indicator on it.
2. WHEN a Coding_Block is already the Selected_Block and the user taps the same Coding_Block again, THE Simulator SHALL deselect it and remove the Selection_Indicator.
3. WHEN a Coding_Block is the Selected_Block and the user taps a different available Coding_Block, THE Simulator SHALL change the Selected_Block to the newly tapped block and move the Selection_Indicator accordingly.
4. WHEN a user taps a disabled Coding_Block (count of 0) in the Block_Inventory, THE Simulator SHALL keep the current selection unchanged and not select the disabled block.
5. THE Simulator SHALL continue to support drag-and-drop from the Block_Inventory alongside the tap-to-select interaction.

### Requirement 2: Tap-to-Place Block on Control Board

**User Story:** As an iPad user, I want to tap a position on the control board to place my selected block there, so that I can build programs with simple taps.

#### Acceptance Criteria

1. WHILE a Coding_Block is the Selected_Block, WHEN the user taps a Drop_Zone on a Program_Line, THE Simulator SHALL place a new instance of the Selected_Block type at that Drop_Zone position and decrement the inventory count by one.
2. WHILE a Coding_Block is the Selected_Block, WHEN the user taps an empty Program_Line, THE Simulator SHALL place the Selected_Block at position 0 of that Program_Line.
3. WHILE no Coding_Block is the Selected_Block, WHEN the user taps a Drop_Zone, THE Simulator SHALL not place any block.
4. WHEN a block is successfully placed via tap, THE Simulator SHALL keep the same block type selected if the inventory count for that type remains above 0.
5. WHEN a block is successfully placed via tap and the inventory count for that block type reaches 0, THE Simulator SHALL deselect the Selected_Block and remove the Selection_Indicator.

### Requirement 3: Tap-to-Remove Block from Control Board

**User Story:** As an iPad user, I want to remove blocks from the control board with a simple gesture, so that I can correct my program without precise dragging.

#### Acceptance Criteria

1. WHILE no Coding_Block is the Selected_Block, WHEN the user taps a Coding_Block on the Control_Board, THE Simulator SHALL remove that block from the Program_Line and increment the inventory count for that block type by one.
2. WHILE a Coding_Block is the Selected_Block, WHEN the user taps a Coding_Block on the Control_Board, THE Simulator SHALL place the Selected_Block before the tapped block position rather than removing the tapped block.
3. THE Simulator SHALL continue to support removing blocks by dragging them off the Control_Board.

### Requirement 4: Visual Feedback for Tap-to-Place Mode

**User Story:** As an iPad user, I want clear visual cues showing what is selected and where I can place blocks, so that I understand the current interaction state.

#### Acceptance Criteria

1. WHILE a Coding_Block is the Selected_Block, THE Simulator SHALL display the Selection_Indicator as a visible border or highlight on the selected inventory block that meets a minimum contrast ratio of 3:1 against the block background.
2. WHILE a Coding_Block is the Selected_Block, THE Simulator SHALL display all valid Drop_Zones on the Control_Board with a visible placement indicator.
3. WHEN the Selected_Block is deselected, THE Simulator SHALL remove all Selection_Indicators and Drop_Zone placement indicators within one animation frame.
4. WHILE a Coding_Block is the Selected_Block, THE Simulator SHALL display a label or tooltip near the Control_Board indicating the currently selected block type.

### Requirement 5: Touch-Optimized Target Sizes

**User Story:** As a touch device user, I want all interactive elements to be large enough to tap accurately, so that I can use the app without frustration.

#### Acceptance Criteria

1. THE Simulator SHALL render all tappable Coding_Blocks in the Block_Inventory with a minimum touch target size of 44×44 CSS pixels on Touch_Devices.
2. THE Simulator SHALL render all Coding_Blocks on the Control_Board with a minimum touch target size of 44×44 CSS pixels on Touch_Devices.
3. THE Simulator SHALL render all Drop_Zones with a minimum tap target width of 44 CSS pixels WHILE a Coding_Block is the Selected_Block.
4. THE Simulator SHALL render all Toolbar buttons with a minimum touch target size of 44×44 CSS pixels on Touch_Devices.
5. THE Simulator SHALL maintain a minimum spacing of 8 CSS pixels between adjacent tappable elements on Touch_Devices.

### Requirement 6: Responsive Layout for iPad

**User Story:** As an iPad user, I want the app layout to use the screen space effectively in both portrait and landscape orientations, so that I can comfortably see the grid and build programs.

#### Acceptance Criteria

1. WHILE the viewport width is between 768px and 1023px (tablet portrait), THE Simulator SHALL display the Grid_Map and the Control_Board in a stacked vertical layout with the Grid_Map on top.
2. WHILE the viewport width is 1024px or greater (tablet landscape and desktop), THE Simulator SHALL display the Grid_Map and the right panel side by side.
3. WHILE the viewport width is between 768px and 1023px, THE Simulator SHALL render the Block_Inventory in a horizontally scrollable row below the Control_Board.
4. THE Simulator SHALL respect safe area insets on devices with notches or rounded corners by applying appropriate padding.

### Requirement 7: Prevent Accidental Browser Gestures on Touch Devices

**User Story:** As an iPad user, I want the app to prevent accidental page navigation and zoom while I interact with blocks, so that my workflow is not interrupted.

#### Acceptance Criteria

1. WHILE the user is interacting with the Block_Inventory or Control_Board, THE Simulator SHALL prevent the default browser pull-to-refresh gesture.
2. WHILE the user is interacting with the Block_Inventory or Control_Board, THE Simulator SHALL prevent accidental pinch-to-zoom on the interactive panels.
3. WHILE the user is dragging a Coding_Block, THE Simulator SHALL prevent the browser back/forward swipe navigation gesture.
4. THE Simulator SHALL allow normal scrolling on non-interactive areas of the page.

### Requirement 8: Keyboard and Accessibility Support for Tap-to-Place

**User Story:** As a user relying on assistive technology, I want the tap-to-place mode to be fully accessible, so that I can use it with a keyboard or screen reader.

#### Acceptance Criteria

1. THE Simulator SHALL make all Coding_Blocks in the Block_Inventory focusable and activatable via keyboard (Enter or Space key) to trigger selection.
2. THE Simulator SHALL make all Drop_Zones focusable and activatable via keyboard (Enter or Space key) to trigger block placement WHILE a Coding_Block is the Selected_Block.
3. WHEN a Coding_Block is selected in the Block_Inventory, THE Simulator SHALL announce the selection to screen readers using an ARIA live region.
4. WHEN a block is placed on the Control_Board via tap-to-place, THE Simulator SHALL announce the placement to screen readers using an ARIA live region.
5. THE Simulator SHALL provide visible focus indicators on all interactive elements that meet a minimum contrast ratio of 3:1.
