# Requirements Document

## Introduction

This feature set transforms the Matatalab Coding Set Simulator into a competition-ready practice tool for Hong Kong primary school students. It covers four major areas: (1) migrating the grid map and bot animations to an HTML5 Canvas renderer for smoother, more engaging visuals, (2) redesigning block icons and UI elements with a playful, cartoon-style aesthetic suitable for young children, (3) adding a Competition Practice Mode informed by Hong Kong Matatalab coding competitions (such as the annual Matatalab Coding Competition and STEM-related robotics events for primary students in HK, where children use Matatalab kits to navigate robots through grid-based maps with obstacles, collect items, and reach goals under time pressure), and (4) introducing random maze generation so students get varied practice beyond the fixed challenge set.

In Hong Kong, Matatalab competitions for primary students typically involve:
- Grid-based navigation tasks on 4×4 to 8×8 maps
- Timed rounds (commonly 3–5 minutes per challenge)
- Increasing difficulty with obstacles, collectibles, and multi-step goals
- Emphasis on sequential thinking, loops, and function reuse
- Orientation/direction awareness as a core skill

This simulator aims to replicate those competition conditions so students can practice effectively at home or in the classroom.

## Glossary

- **Canvas_Renderer**: The HTML5 Canvas-based rendering engine that draws the grid map, bot, obstacles, goals, collectibles, and animations onto a `<canvas>` element
- **Grid_Map**: The visual grid where the Bot navigates, rendered on the Canvas_Renderer
- **Bot**: The on-screen MatataBot robot car that executes programs on the Grid_Map
- **Block_Icon_System**: The component system responsible for rendering kid-friendly, cartoon-style SVG icons for each coding block type
- **Block_Inventory**: The panel displaying available coding blocks with remaining counts
- **Control_Board**: The area where coding blocks are placed in sequence to form a program
- **Competition_Mode**: A practice mode that simulates Hong Kong Matatalab competition conditions with timed rounds, scoring, and competition-style challenge sets
- **Maze_Generator**: The algorithm that produces random solvable maze layouts for the Grid_Map
- **Challenge_Set**: A collection of challenges grouped by competition round or difficulty tier
- **Score_Tracker**: The subsystem that calculates and displays performance metrics (time, steps, stars) during Competition_Mode
- **Simulator**: The Matatalab Coding Set Simulator web application
- **Feedback_System**: The subsystem responsible for visual animations and celebratory effects
- **Toolbar**: The navigation bar containing Run, Reset, Speed, Timer, Language, and mode controls
- **Cell**: A single square unit on the Grid_Map
- **Sprite**: A 2D image or animation frame drawn on the Canvas_Renderer

## Requirements

### Requirement 1: HTML5 Canvas Grid Renderer

**User Story:** As a young student, I want the grid map to render on an HTML5 Canvas so that bot movements and animations are smooth and visually engaging.

#### Acceptance Criteria

1. THE Canvas_Renderer SHALL render the Grid_Map as a 2D grid on an HTML5 `<canvas>` element with configurable dimensions from 4×4 to 10×10
2. THE Canvas_Renderer SHALL draw each Cell with visible borders, rounded corners, and a soft pastel or nature-themed fill color
3. THE Canvas_Renderer SHALL draw obstacle Cells using illustrated Sprite graphics (rocks, trees, or bushes) instead of DOM-based SVG elements
4. THE Canvas_Renderer SHALL draw goal Cells using an animated flag or trophy Sprite with a subtle waving or glowing animation loop
5. THE Canvas_Renderer SHALL draw collectible Cells using a glowing star or gem Sprite with a pulsing animation
6. THE Canvas_Renderer SHALL draw the Bot starting Cell with a distinct "start zone" indicator (colored border or home-base icon)
7. THE Canvas_Renderer SHALL scale the canvas to fit the available viewport area without scrolling, maintaining a 1:1 cell aspect ratio
8. WHEN the browser window is resized, THE Canvas_Renderer SHALL re-scale the canvas and redraw all elements to fit the new viewport dimensions
9. THE Canvas_Renderer SHALL render at a minimum of 30 frames per second during animations on devices with hardware acceleration enabled

### Requirement 2: Canvas Bot Animation

**User Story:** As a young student, I want to see the robot move smoothly across the grid with fun animations so that I can follow my program's execution and stay engaged.

#### Acceptance Criteria

1. WHEN the Bot moves to a new Cell, THE Canvas_Renderer SHALL animate the Bot's position using smooth interpolation (tweening) over a duration matching the current speed setting
2. WHEN the Bot changes direction, THE Canvas_Renderer SHALL animate the Bot's rotation smoothly over 200ms or less
3. WHILE the Bot is idle on the Grid_Map, THE Canvas_Renderer SHALL display a subtle idle animation (gentle bobbing or blinking eyes) using a requestAnimationFrame loop
4. WHEN the Bot encounters a boundary violation or obstacle collision, THE Canvas_Renderer SHALL display a red flash and shake animation on the Bot Sprite lasting 500ms
5. WHEN the Bot executes a Music Fun_Block, THE Canvas_Renderer SHALL draw animated musical note particles floating upward from the Bot for the duration of the step
6. WHEN the Bot executes a Dance Fun_Block, THE Canvas_Renderer SHALL draw an animated wiggle motion on the Bot Sprite for the duration of the step
7. WHEN the Bot collects a collectible item, THE Canvas_Renderer SHALL animate the collectible Sprite shrinking and fading into the Bot over 300ms
8. WHEN program execution completes successfully with the goal reached, THE Canvas_Renderer SHALL trigger a canvas-based confetti particle burst animation lasting between 2 and 4 seconds

### Requirement 3: Canvas Accessibility Layer

**User Story:** As a teacher using assistive technology, I want the canvas-based grid to remain accessible so that screen readers can still convey the grid state to visually impaired users.

#### Acceptance Criteria

1. THE Canvas_Renderer SHALL render a hidden, off-screen DOM structure mirroring the grid layout with appropriate ARIA roles (grid, gridcell) and labels for each Cell
2. THE Canvas_Renderer SHALL update the hidden DOM structure whenever the grid state changes (bot position, collected items, execution status)
3. THE Canvas_Renderer SHALL set an `aria-label` on the `<canvas>` element describing the current grid dimensions and bot position
4. WHEN the Bot moves to a new Cell, THE Canvas_Renderer SHALL update the corresponding ARIA live region to announce the new position

### Requirement 4: Kid-Friendly Cartoon Block Icons

**User Story:** As a young student (ages 4–9), I want the coding block icons to look like colorful cartoon pictures so that I can easily understand what each block does without reading text.

#### Acceptance Criteria

1. THE Block_Icon_System SHALL render each block type with a cartoon-style SVG icon using rounded shapes, thick outlines (minimum 2px stroke), and bright saturated colors
2. THE Block_Icon_System SHALL render Motion_Blocks with playful directional arrow characters: a smiling arrow pointing up for Forward, a smiling arrow pointing down for Backward, a curved arrow with a friendly face for Turn Left, and a curved arrow with a friendly face for Turn Right
3. THE Block_Icon_System SHALL render Loop_Blocks with a circular arrow icon featuring a friendly expression for Loop Begin and a matching bracket icon for Loop End
4. THE Block_Icon_System SHALL render Function_Blocks with a toolbox or magic wand icon for Define Function and a play-button star icon for Call Function
5. THE Block_Icon_System SHALL render Number_Blocks with large, bubbly digit characters in a hand-drawn style, and a colorful bouncing dice icon for Random Number
6. THE Block_Icon_System SHALL render Fun_Blocks with animated-style icons: a musical note with sparkles for Music, a dancing stick figure with motion lines for Dance, and a question-mark arrow for Random Move
7. THE Block_Icon_System SHALL maintain the existing category color scheme (blue for motion, yellow for loop, green for function, purple for number, orange for fun) with increased saturation and softer gradients
8. THE Block_Icon_System SHALL render each icon at a minimum size of 32×32 pixels to maintain visual clarity for young children

### Requirement 5: Kid-Friendly UI Theme Enhancements

**User Story:** As a young student, I want the entire app to feel like a colorful game so that using the simulator is fun and inviting.

#### Acceptance Criteria

1. THE Simulator SHALL use a playful, rounded sans-serif font (Nunito or equivalent) for all UI text with a minimum body font size of 16px
2. THE Simulator SHALL apply a warm, pastel background gradient to the app shell with subtle cloud or nature pattern decorations
3. THE Toolbar SHALL render the Run button as a large green circle with a cartoon play icon and the Reset button as a large orange circle with a cartoon refresh icon, each with a minimum touch-target size of 56×56 CSS pixels
4. THE Block_Inventory SHALL display block category headers with cartoon-style label badges using the category color and a small category mascot icon
5. THE Control_Board SHALL render empty slots with a dashed outline, a subtle pastel tint, and a friendly "place block here" placeholder icon
6. WHEN a block is placed on the Control_Board, THE Control_Board SHALL animate the block with a bouncy scale-up effect (overshoot to 115% then settle to 100%) lasting 200ms or less
7. THE Simulator SHALL use CSS custom properties for all theme colors to enable consistent theming across components

### Requirement 6: Competition Practice Mode

**User Story:** As a primary school student in Hong Kong preparing for a Matatalab coding competition, I want a competition practice mode so that I can simulate real competition conditions and improve my speed and accuracy.

#### Acceptance Criteria

1. THE Simulator SHALL provide a Competition_Mode toggle accessible from the Toolbar that switches between Free Practice mode and Competition Practice mode
2. WHEN Competition_Mode is activated, THE Simulator SHALL display a competition dashboard showing the current round number, time remaining, score, and challenge progress
3. WHEN Competition_Mode is activated, THE Simulator SHALL present challenges in sequential rounds with increasing difficulty, starting from basic navigation (4×4 grid, no obstacles) and progressing to complex multi-obstacle collection tasks (up to 8×8 grid)
4. THE Competition_Mode SHALL enforce a configurable time limit per round, defaulting to 3 minutes per round to match typical Hong Kong Matatalab competition timing
5. WHEN the countdown timer reaches zero during a Competition_Mode round, THE Simulator SHALL stop execution, record the current score, and advance to the next round or display final results
6. THE Competition_Mode SHALL calculate a score for each round based on: goal reached (base points), collectibles gathered (bonus points per item), steps used (efficiency bonus for fewer steps), and time remaining (speed bonus)
7. WHEN all rounds in a Competition_Mode session are completed, THE Score_Tracker SHALL display a summary screen showing per-round scores, total score, star rating (1–3 stars), and areas for improvement
8. THE Competition_Mode SHALL support at least 3 difficulty tiers: Beginner (初級, 4×4 to 5×5 grids, 0–2 obstacles), Intermediate (中級, 5×5 to 6×6 grids, 2–4 obstacles with collectibles), and Advanced (高級, 6×6 to 8×8 grids, 4–6 obstacles with multiple collectibles and multi-step goals)

### Requirement 7: Competition Challenge Sets

**User Story:** As a student preparing for a Hong Kong Matatalab competition, I want challenge sets that reflect real competition task types so that my practice is relevant and effective.

#### Acceptance Criteria

1. THE Simulator SHALL provide built-in Competition Challenge_Sets organized by skill focus: Orientation (方向感, tasks emphasizing turns and direction changes), Navigation (導航, tasks with obstacles requiring path planning), Collection (收集, tasks requiring visiting multiple collectible positions before reaching the goal), and Combined (綜合, tasks combining all skills)
2. WHEN a Competition Challenge_Set is selected, THE Simulator SHALL load the challenges in order and track completion status for each challenge within the set
3. THE Simulator SHALL display each Competition Challenge_Set with a bilingual title (Chinese and English), a description of the skill focus, the number of challenges, and the recommended time per challenge
4. THE Simulator SHALL restrict the Block_Inventory for each competition challenge to match realistic physical Matatalab set limits, encouraging efficient use of limited blocks
5. WHEN a student completes all challenges in a Competition Challenge_Set, THE Score_Tracker SHALL display a completion badge and the overall performance summary

### Requirement 8: Competition Score and Progress Tracking

**User Story:** As a student, I want to see my scores and progress over time so that I can track my improvement and stay motivated to practice.

#### Acceptance Criteria

1. THE Score_Tracker SHALL persist competition session results in browser localStorage, storing the date, Challenge_Set name, per-round scores, total score, and star rating
2. THE Score_Tracker SHALL display a progress history screen listing past competition sessions with date, Challenge_Set name, total score, and star rating
3. WHEN a student achieves a new personal best score for a Challenge_Set, THE Score_Tracker SHALL display a "New Personal Best" celebration indicator
4. THE Score_Tracker SHALL calculate star ratings as follows: 1 star for completing the session, 2 stars for scoring above 60% of the maximum possible score, 3 stars for scoring above 85% of the maximum possible score
5. IF localStorage is unavailable or full, THEN THE Score_Tracker SHALL display a warning message in the active language and continue operating without persistence

### Requirement 9: Random Maze Generation

**User Story:** As a student, I want to practice on randomly generated mazes so that I get varied challenges every time and build stronger problem-solving skills.

#### Acceptance Criteria

1. THE Maze_Generator SHALL produce a random grid layout with a start position, goal position, obstacle positions, and optional collectible positions for a given grid size (4×4 to 8×8)
2. THE Maze_Generator SHALL guarantee that every generated maze has at least one valid path from the start position to the goal position that does not pass through any obstacle Cell
3. THE Maze_Generator SHALL guarantee that every generated maze has at least one valid path from the start position through all collectible positions to the goal position
4. THE Maze_Generator SHALL accept a difficulty parameter (easy, medium, hard) that controls the obstacle density: easy produces 0–15% obstacle coverage, medium produces 15–25% obstacle coverage, and hard produces 25–35% obstacle coverage
5. THE Maze_Generator SHALL place the start position at a corner or edge Cell and the goal position at a Cell that is at least 50% of the maximum Manhattan distance from the start
6. WHEN the user requests a random maze, THE Simulator SHALL generate and display the maze within 500ms
7. THE Maze_Generator SHALL output a ChallengeConfig-compatible JSON object so that generated mazes can be used interchangeably with built-in challenges

### Requirement 10: Random Maze Configuration and Seeding

**User Story:** As a teacher, I want to configure random maze parameters and share specific mazes with students so that I can assign consistent practice tasks.

#### Acceptance Criteria

1. THE Maze_Generator SHALL accept an optional numeric seed parameter that produces the same maze layout when the same seed and grid size are provided (deterministic generation)
2. FOR ALL valid seed values, generating a maze with a given seed then generating again with the same seed and parameters SHALL produce an identical ChallengeConfig object (deterministic round-trip property)
3. WHEN a random maze is generated, THE Simulator SHALL display the seed value in the UI so the user can note it for later reuse
4. THE Simulator SHALL provide a seed input field where users can enter a seed value to regenerate a specific maze
5. THE Maze_Generator SHALL accept optional parameters for grid width, grid height, number of collectibles (0–5), and difficulty level

### Requirement 11: Random Maze Integration with Competition Mode

**User Story:** As a student in competition practice mode, I want some rounds to use randomly generated mazes so that I practice adapting to unfamiliar layouts like in a real competition.

#### Acceptance Criteria

1. WHEN Competition_Mode is active, THE Simulator SHALL support mixed Challenge_Sets that include both predefined challenges and randomly generated mazes
2. THE Competition_Mode SHALL allow configuring the ratio of random mazes to predefined challenges within a Challenge_Set (e.g., 50% random, 50% predefined)
3. WHEN a Competition_Mode round uses a random maze, THE Simulator SHALL generate the maze at the start of the round using the difficulty tier appropriate for that round
4. THE Simulator SHALL display a visual indicator on the challenge card distinguishing random mazes from predefined challenges (e.g., a dice icon for random mazes)

### Requirement 12: Maze Generation Serialization

**User Story:** As a teacher, I want to save and share generated mazes so that I can create consistent practice assignments for my class.

#### Acceptance Criteria

1. WHEN a random maze is generated, THE Simulator SHALL provide an Export button that serializes the generated maze into a ChallengeConfig JSON file for download
2. THE Simulator SHALL accept imported ChallengeConfig JSON files (both hand-crafted and generated) via the existing Load mechanism
3. THE Serializer SHALL produce a JSON structure that captures grid dimensions, start position, start direction, goal positions, obstacle positions, collectible positions, block inventory limits, and the generation seed
4. FOR ALL valid generated mazes, serializing to JSON then deserializing SHALL produce an equivalent ChallengeConfig object (round-trip property)
5. IF the user imports an invalid or corrupted maze JSON file, THEN THE Simulator SHALL display a descriptive error message in the active language and leave the current challenge unchanged

### Requirement 13: Bilingual Support for New Features

**User Story:** As a student in Hong Kong, I want all new competition mode features and maze generation UI to be available in both Traditional Chinese and English so that I can use the app comfortably in my preferred language.

#### Acceptance Criteria

1. THE Simulator SHALL provide bilingual labels (Traditional Chinese and English) for all Competition_Mode UI elements including mode toggle, round indicators, score displays, timer labels, and result summaries
2. THE Simulator SHALL provide bilingual labels for all Maze_Generator UI elements including the generate button, difficulty selector, seed input, grid size controls, and export button
3. THE Simulator SHALL provide bilingual labels for all Competition Challenge_Set titles, descriptions, and skill focus categories
4. WHEN the user switches the language, THE Simulator SHALL update all new feature labels to the selected language without reloading the page
5. THE Simulator SHALL display competition scoring terms in bilingual format: "得分" / "Score", "星級" / "Stars", "個人最佳" / "Personal Best", "回合" / "Round", "完成" / "Complete"

### Requirement 14: Canvas Renderer and DOM Renderer Coexistence

**User Story:** As a developer, I want the canvas renderer to be introduced as an alternative to the existing DOM renderer so that the migration can be done incrementally without breaking existing functionality.

#### Acceptance Criteria

1. THE Simulator SHALL support a renderer toggle (accessible via the Toolbar or a settings panel) that switches between the existing DOM-based Grid_Map renderer and the new Canvas_Renderer
2. WHEN the renderer is switched, THE Simulator SHALL preserve the current grid state, bot position, bot direction, and execution state
3. THE Canvas_Renderer SHALL accept the same GridMapProps interface as the existing DOM-based GridMap component to ensure interchangeability
4. THE Simulator SHALL default to the Canvas_Renderer for new users while preserving the DOM renderer as a fallback
5. IF the browser does not support HTML5 Canvas 2D context, THEN THE Simulator SHALL fall back to the DOM-based renderer and display an informational message in the active language
