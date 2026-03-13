# Requirements Document

## Introduction

The Matatalab Coding Set Simulator is a web application that replicates the physical Matatalab coding set experience for young learners (ages 4–9). The current simulator is functional but visually plain compared to the colorful, tactile physical product. This UI/UX refresh aims to make the simulator feel more faithful to the real Matatalab coding set — with icon-based blocks, a playful visual design, an engaging grid map, a recognizable bot character, and rich interaction feedback that delights young users.

## Glossary

- **Simulator**: The Matatalab Coding Set Simulator web application
- **Block_Renderer**: The component responsible for rendering individual coding blocks in both the Block_Inventory and Control_Board
- **Block_Inventory**: The panel displaying available coding blocks with remaining counts, from which blocks are dragged or tapped onto the Control_Board
- **Control_Board**: The area where coding blocks are placed in sequence to form a program (main line and function definition line)
- **Grid_Map**: The visual grid where the Bot navigates, containing obstacles, goals, and collectibles
- **Bot**: The on-screen representation of the MatataBot robot car that executes the program on the Grid_Map
- **Feedback_System**: The subsystem responsible for visual animations, sound cues, and celebratory effects in response to user actions and program execution events
- **Challenge_Selector**: The panel listing available coding challenges with difficulty badges
- **Toolbar**: The navigation bar containing Run, Reset, Save, Load, Speed, Timer, and Language controls
- **Motion_Block**: A blue-category block for movement commands (Forward, Backward, Turn Left, Turn Right)
- **Loop_Block**: A yellow-category block for loop constructs (Loop Begin, Loop End)
- **Function_Block**: A green-category block for function constructs (Define Function, Call Function)
- **Number_Block**: A purple-category block for numeric parameters (2, 3, 4, 5, Random)
- **Fun_Block**: An orange-category block for special actions (Random Move, Music, Dance)

## Requirements

### Requirement 1: Icon-Based Block Rendering

**User Story:** As a young student, I want coding blocks to display visual symbols and icons instead of text labels, so that I can understand block functions without needing to read.

#### Acceptance Criteria

1. THE Block_Renderer SHALL display an SVG icon or emoji symbol as the primary visual identifier for each block type
2. WHEN a Motion_Block is rendered, THE Block_Renderer SHALL display a directional arrow icon matching the block's direction (up-arrow for Forward, down-arrow for Backward, left-arrow for Turn Left, right-arrow for Turn Right)
3. WHEN a Loop_Block is rendered, THE Block_Renderer SHALL display a loop/repeat icon for Loop Begin and a closing bracket icon for Loop End
4. WHEN a Function_Block is rendered, THE Block_Renderer SHALL display a define icon for Define Function and a call/play icon for Call Function
5. WHEN a Number_Block is rendered, THE Block_Renderer SHALL display the numeric digit prominently with a dice icon for Random Number
6. WHEN a Fun_Block is rendered, THE Block_Renderer SHALL display a music note icon for Music, a dance figure icon for Dance, and a shuffle icon for Random Move
7. THE Block_Renderer SHALL display a localized text label below or beside the icon as a secondary identifier
8. THE Block_Renderer SHALL maintain the existing category color scheme (blue for motion, yellow for loop, green for function, purple for number, orange for fun)

### Requirement 2: Physical Block Appearance

**User Story:** As a young student, I want on-screen blocks to look like the chunky physical Matatalab tiles, so that the simulator feels familiar and tangible.

#### Acceptance Criteria

1. THE Block_Renderer SHALL render each block with rounded corners of at least 12px border-radius
2. THE Block_Renderer SHALL apply a subtle drop shadow and a slight 3D raised-edge effect to each block to simulate physical depth
3. THE Block_Renderer SHALL use a minimum touch-target size of 48×48 CSS pixels on touch devices
4. WHEN a block is in the Block_Inventory and has a count of zero, THE Block_Renderer SHALL display the block with reduced opacity and a grayscale filter
5. THE Block_Renderer SHALL render the count badge as a circular overlay in the top-right corner of each inventory block

### Requirement 3: Bot Visual Redesign

**User Story:** As a young student, I want the on-screen robot to look like a cute MatataBot car, so that I can identify with the character and feel engaged.

#### Acceptance Criteria

1. THE Bot SHALL be rendered as an SVG illustration resembling a simplified, friendly robot car with visible eyes and wheels
2. THE Bot SHALL rotate smoothly to indicate its current facing direction using a CSS transition of 300ms or less
3. WHEN the Bot is idle on the Grid_Map, THE Bot SHALL display a subtle idle animation (gentle bobbing or blinking)
4. WHEN the Bot moves to a new cell, THE Grid_Map SHALL animate the Bot's position transition over a duration matching the current speed setting
5. WHEN the Bot encounters an error (boundary violation or obstacle collision), THE Bot SHALL display a visual distress indicator (red flash and shake animation)
6. WHEN the Bot completes a Fun_Block action, THE Bot SHALL display a contextual animation (musical notes for Music, dance motion for Dance, question mark for Random Move)

### Requirement 4: Themed Grid Map

**User Story:** As a young student, I want the game map to look like a colorful nature adventure board, so that navigating the bot feels like an exciting journey.

#### Acceptance Criteria

1. THE Grid_Map SHALL render cells with a soft pastel or nature-themed background color instead of plain white
2. THE Grid_Map SHALL render obstacle cells with a visually distinct terrain icon (rock, tree, or bush illustration) instead of a plain emoji
3. THE Grid_Map SHALL render goal cells with an animated flag or trophy icon instead of a plain emoji
4. THE Grid_Map SHALL render collectible cells with a glowing star or gem icon instead of a plain emoji
5. THE Grid_Map SHALL display subtle grid lines with rounded cell corners to create a board-game appearance
6. THE Grid_Map SHALL render the Bot's starting cell with a distinct "start zone" visual indicator (colored border or home-base icon)

### Requirement 5: Control Board Slot Design

**User Story:** As a young student, I want the control board to have clear slot areas for placing blocks, so that I understand where to put my coding blocks like on the physical board.

#### Acceptance Criteria

1. THE Control_Board SHALL render each empty block position as a visible rounded slot with a dashed outline and a subtle background tint
2. THE Control_Board SHALL visually distinguish the main program line from the function definition line using distinct background colors and labeled headers with icons
3. WHEN a block is placed into a slot, THE Control_Board SHALL animate the block snapping into position with a brief scale-bounce effect (150ms or less)
4. WHEN a block is removed from the Control_Board, THE Control_Board SHALL animate the removal with a brief fade-and-shrink effect (150ms or less)
5. THE Control_Board SHALL display a left-to-right flow indicator (arrow or connector line) between placed blocks to reinforce sequential reading order
6. WHEN the Control_Board has no blocks placed, THE Control_Board SHALL display a localized placeholder message with an illustrative hand-drag icon

### Requirement 6: Playful Overall Visual Theme

**User Story:** As a young student, I want the entire app to feel colorful and playful, so that using the simulator is fun and inviting.

#### Acceptance Criteria

1. THE Simulator SHALL use a playful, rounded sans-serif font (such as Nunito or Baloo) for all UI text
2. THE Simulator SHALL apply a warm, light background gradient or subtle pattern to the app shell instead of a flat white background
3. THE Toolbar SHALL render action buttons (Run, Reset) with larger sizes, rounded shapes, and category-appropriate colors (green for Run, orange for Reset)
4. THE Toolbar SHALL display button icons alongside text labels for all toolbar actions
5. THE Challenge_Selector SHALL render challenge cards with rounded corners, colored difficulty badges, and a hover/tap lift effect
6. THE Simulator SHALL use CSS custom properties for all theme colors to enable consistent theming across components

### Requirement 7: Interaction Feedback and Animations

**User Story:** As a young student, I want to see fun visual feedback when I place blocks, run my program, and complete challenges, so that I know what is happening and feel rewarded.

#### Acceptance Criteria

1. WHEN a block is dragged from the Block_Inventory, THE Block_Renderer SHALL scale the dragged block to 110% and apply an elevated shadow to indicate active dragging
2. WHEN a block is dragged over a valid drop zone on the Control_Board, THE Control_Board SHALL expand the drop zone width and highlight it with a pulsing color animation
3. WHEN the user taps the Run button, THE Toolbar SHALL animate the Run button with a brief press-down effect and the Bot SHALL display a "ready" animation before execution begins
4. WHEN program execution completes successfully with the goal reached, THE Feedback_System SHALL display a full-screen celebratory overlay with confetti animation and a congratulatory message for at least 2 seconds
5. WHEN program execution completes without reaching the goal, THE Feedback_System SHALL display an encouraging "try again" message with a friendly animation
6. WHEN an execution error occurs, THE Feedback_System SHALL highlight the offending block on the Control_Board with a red glow and shake animation
7. IF the user dismisses a feedback overlay, THEN THE Feedback_System SHALL fade out the overlay within 300ms

### Requirement 8: Responsive and Kid-Friendly Layout

**User Story:** As a teacher using the simulator on various devices, I want the layout to adapt well to phones, tablets, and desktops while remaining easy for young children to use.

#### Acceptance Criteria

1. THE Simulator SHALL maintain a minimum touch-target size of 44×44 CSS pixels for all interactive elements on touch devices
2. WHILE the viewport width is less than 768px, THE Simulator SHALL stack the Grid_Map above the Control_Board and Block_Inventory in a single-column layout
3. WHILE the viewport width is 1024px or greater, THE Simulator SHALL display the Grid_Map and the right panel (Block_Inventory + Control_Board) side by side
4. THE Block_Inventory SHALL group blocks by category (motion, loop, function, number, fun) with visible category headers or dividers
5. THE Simulator SHALL support safe-area insets for notched mobile devices
6. THE Simulator SHALL preserve all existing keyboard navigation and screen-reader accessibility features after the visual refresh

### Requirement 9: Success and Progress Celebration

**User Story:** As a young student, I want to see exciting celebrations when I complete a challenge, so that I feel proud and motivated to try harder challenges.

#### Acceptance Criteria

1. WHEN a challenge is completed successfully, THE Feedback_System SHALL display a star rating or trophy icon based on the challenge difficulty level
2. WHEN a challenge is completed successfully, THE Feedback_System SHALL play a CSS-based confetti or particle burst animation lasting between 2 and 4 seconds
3. WHEN a challenge is completed successfully, THE Feedback_System SHALL display the congratulatory message in the currently selected language
4. THE Feedback_System SHALL auto-dismiss the celebration overlay after 5 seconds if the user does not dismiss it manually
