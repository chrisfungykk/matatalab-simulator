# Requirements Document

## Introduction

A web-based simulator that replicates the Matatalab Coding Set (編程套件) experience for primary school students preparing for coding competitions. The simulator provides a virtual grid map, drag-and-drop coding blocks, and competition-style timed challenges. The UI is bilingual (Chinese/English) with Chinese as the primary language, targeting Hong Kong/Chinese-speaking regions.

## Glossary

- **Simulator**: The web application that replicates the Matatalab Coding Set experience in a browser
- **MatataBot**: The virtual robot car displayed on the Grid_Map that executes coded instructions
- **Grid_Map**: A square grid displayed in the Simulator where the MatataBot navigates
- **Cell**: A single square unit on the Grid_Map; the MatataBot occupies one Cell at a time
- **Coding_Block**: A virtual representation of a physical Matatalab coding block that users drag and place on the Control_Board
- **Control_Board**: The virtual panel where users arrange Coding_Blocks to form a program
- **Program**: An ordered sequence of Coding_Blocks placed on the Control_Board that the MatataBot executes
- **Motion_Block**: A Coding_Block that moves or rotates the MatataBot (Forward, Backward, Turn Left, Turn Right)
- **Number_Block**: A Coding_Block (values 2, 3, 4, 5, or Random 1–6) placed after a Forward or Backward Motion_Block to multiply steps
- **Loop_Block**: A pair of Coding_Blocks (Loop Begin + Loop End) that repeat enclosed Coding_Blocks a specified number of times
- **Function_Define_Block**: A Coding_Block that defines a reusable subroutine on a separate line below the main Program
- **Function_Call_Block**: A Coding_Block that invokes the subroutine defined by the Function_Define_Block
- **Fun_Block**: A Coding_Block that triggers a preset animation (Random Movement, Preset Music, Preset Dancing)
- **Challenge**: A competition-style task with a defined Grid_Map layout, start position, goal, and optional obstacles or collectible items
- **Block_Inventory**: The limited pool of available Coding_Blocks for a given Challenge, matching physical set quantities
- **Execution**: The process of the MatataBot carrying out the Program step by step on the Grid_Map

## Requirements

### Requirement 1: Grid Map Display

**User Story:** As a student, I want to see a virtual grid map so that I can visualize the robot's navigation area just like the physical Nature Map.

#### Acceptance Criteria

1. THE Simulator SHALL display a Grid_Map as a square grid of configurable dimensions (minimum 4×4, maximum 10×10)
2. THE Simulator SHALL render each Cell with visible borders and consistent sizing
3. THE Simulator SHALL display the MatataBot on the Grid_Map at the designated start Cell with a directional indicator showing which way the MatataBot faces
4. THE Simulator SHALL display goal Cells, obstacle Cells, and collectible item Cells using distinct visual icons
5. WHEN the Grid_Map dimensions change between Challenges, THE Simulator SHALL resize the Grid_Map to fit within the viewport without scrolling

### Requirement 2: Coding Block Inventory and Drag-and-Drop

**User Story:** As a student, I want to drag and drop virtual coding blocks onto a control board so that I can build programs the same way I arrange physical blocks.

#### Acceptance Criteria

1. THE Simulator SHALL display a Block_Inventory panel containing all available Coding_Blocks for the current Challenge
2. THE Simulator SHALL enforce the physical set block quantity limits (4 Forward, 4 Backward, 4 Turn Left, 4 Turn Right, 2 Loop Begin, 2 Loop End, 1 Function_Define_Block, 3 Function_Call_Blocks, 2 each of Number 2/3/4/5/Random, 3 Fun_Blocks)
3. WHEN a user drags a Coding_Block from the Block_Inventory to the Control_Board, THE Simulator SHALL place the Coding_Block at the drop position and decrement the available count in the Block_Inventory by one
4. WHEN a user drags a Coding_Block from the Control_Board back to the Block_Inventory, THE Simulator SHALL remove the Coding_Block from the Control_Board and increment the available count in the Block_Inventory by one
5. WHEN the available count of a Coding_Block type reaches zero, THE Simulator SHALL visually disable that Coding_Block type in the Block_Inventory
6. THE Simulator SHALL allow users to reorder Coding_Blocks on the Control_Board by dragging them to new positions

### Requirement 3: Control Board Layout

**User Story:** As a student, I want the control board to support multiple lines so that I can place my main program and function definitions on separate lines, just like the physical control board.

#### Acceptance Criteria

1. THE Control_Board SHALL arrange Coding_Blocks from left to right within each line, and lines from top to bottom
2. THE Control_Board SHALL support at least two lines: one for the main Program and one for the Function_Define_Block subroutine
3. WHEN a Function_Define_Block is placed, THE Simulator SHALL require the Function_Define_Block to be on a separate line below the main Program line
4. IF a user attempts to place a Function_Define_Block on the same line as the main Program, THEN THE Simulator SHALL display an error message in the active language and reject the placement

### Requirement 4: Motion Block Execution

**User Story:** As a student, I want the robot to move and turn on the grid when I run my program so that I can see if my code is correct.

#### Acceptance Criteria

1. WHEN the Program contains a Forward Motion_Block without a Number_Block, THE MatataBot SHALL move one Cell forward in the direction the MatataBot currently faces
2. WHEN the Program contains a Backward Motion_Block without a Number_Block, THE MatataBot SHALL move one Cell backward opposite to the direction the MatataBot currently faces
3. WHEN the Program contains a Forward or Backward Motion_Block followed by a Number_Block with value N, THE MatataBot SHALL move N Cells in the corresponding direction
4. WHEN the Program contains a Forward or Backward Motion_Block followed by a Random Number_Block, THE MatataBot SHALL move a randomly determined number of Cells between 1 and 6 inclusive
5. WHEN the Program contains a Turn Left Motion_Block, THE MatataBot SHALL rotate 90 degrees counter-clockwise without changing Cells
6. WHEN the Program contains a Turn Right Motion_Block, THE MatataBot SHALL rotate 90 degrees clockwise without changing Cells
7. IF a user attempts to attach a Number_Block to a Turn Left or Turn Right Motion_Block, THEN THE Simulator SHALL display an error message in the active language and reject the placement

### Requirement 5: Loop Block Execution

**User Story:** As a student, I want to use loop blocks to repeat a sequence of instructions so that I can write shorter programs for repetitive patterns.

#### Acceptance Criteria

1. WHEN the Program contains a Loop Begin block followed by a Number_Block with value N, a sequence of Coding_Blocks, and a Loop End block, THE MatataBot SHALL execute the enclosed sequence N times
2. WHEN the Program contains a Loop Begin block followed by a Random Number_Block, THE MatataBot SHALL execute the enclosed sequence a randomly determined number of times between 1 and 6 inclusive
3. IF a user places a Loop Begin block without a matching Loop End block, THEN THE Simulator SHALL display an error message in the active language and prevent Execution
4. IF a user places a Loop End block without a preceding Loop Begin block, THEN THE Simulator SHALL display an error message in the active language and prevent Execution
5. IF a user places a Loop Begin block without a Number_Block, THEN THE Simulator SHALL display an error message in the active language and prevent Execution

### Requirement 6: Function Block Execution

**User Story:** As a student, I want to define and call functions so that I can reuse a sequence of instructions in my program.

#### Acceptance Criteria

1. WHEN the Program contains a Function_Call_Block and a Function_Define_Block subroutine exists on a separate line, THE MatataBot SHALL execute the sequence of Coding_Blocks defined in the Function_Define_Block subroutine at the point of the Function_Call_Block
2. IF a user places a Function_Call_Block without a corresponding Function_Define_Block on the Control_Board, THEN THE Simulator SHALL display an error message in the active language and prevent Execution
3. THE Simulator SHALL allow a Number_Block to be placed after the Function_Define_Block to parameterize the subroutine repeat count
4. WHEN multiple Function_Call_Blocks appear in the Program, THE MatataBot SHALL execute the same Function_Define_Block subroutine for each Function_Call_Block encountered

### Requirement 7: Program Execution and Animation

**User Story:** As a student, I want to see the robot move step by step on the grid so that I can understand how my program executes.

#### Acceptance Criteria

1. WHEN the user presses the Run button, THE Simulator SHALL validate the Program for structural errors before starting Execution
2. WHEN Execution starts, THE MatataBot SHALL animate movement on the Grid_Map one instruction at a time with a visible pause between steps
3. THE Simulator SHALL highlight the currently executing Coding_Block on the Control_Board during Execution
4. WHEN Execution completes, THE Simulator SHALL display whether the Challenge goal was achieved or not
5. THE Simulator SHALL provide a Reset button that returns the MatataBot to the start Cell and clears the Execution state without removing Coding_Blocks from the Control_Board
6. IF the MatataBot attempts to move outside the Grid_Map boundaries during Execution, THEN THE Simulator SHALL stop Execution and display a boundary error message in the active language
7. IF the MatataBot attempts to move into an obstacle Cell during Execution, THEN THE Simulator SHALL stop Execution and display a collision error message in the active language

### Requirement 8: Boundary and Obstacle Collision Handling

**User Story:** As a student, I want clear feedback when my robot hits a wall or obstacle so that I can debug my program.

#### Acceptance Criteria

1. IF the MatataBot attempts to move to a Cell outside the Grid_Map boundaries, THEN THE Simulator SHALL stop Execution immediately and display a visual indicator on the MatataBot showing the boundary violation
2. IF the MatataBot attempts to move to a Cell occupied by an obstacle, THEN THE Simulator SHALL stop Execution immediately and display a visual indicator on the MatataBot showing the collision
3. WHEN Execution stops due to a boundary or obstacle violation, THE Simulator SHALL highlight the Coding_Block on the Control_Board that caused the violation

### Requirement 9: Challenge System

**User Story:** As a student, I want to practice with competition-style challenges so that I can prepare for the actual coding competition.

#### Acceptance Criteria

1. THE Simulator SHALL provide a Challenge selection screen listing available Challenges with a title and difficulty indicator
2. WHEN a user selects a Challenge, THE Simulator SHALL load the corresponding Grid_Map layout, start position, goal position, obstacles, and collectible items
3. THE Simulator SHALL define each Challenge with a JSON-based Challenge configuration specifying grid dimensions, start Cell, start direction, goal Cells, obstacle Cells, collectible Cells, and available Block_Inventory
4. WHEN the MatataBot reaches the goal Cell and has collected all required collectible items, THE Simulator SHALL display a success message in the active language
5. THE Simulator SHALL support at least three built-in Challenges of varying difficulty (easy, medium, hard)

### Requirement 10: Competition Timer

**User Story:** As a student, I want a countdown timer so that I can practice completing challenges within the competition time limit.

#### Acceptance Criteria

1. WHEN a user starts a Challenge in timed mode, THE Simulator SHALL display a visible countdown timer
2. THE Simulator SHALL allow the user to configure the timer duration before starting a timed Challenge
3. WHEN the countdown timer reaches zero, THE Simulator SHALL stop Execution if running and display a time-up message in the active language
4. THE Simulator SHALL allow the user to start a Challenge without a timer for free practice mode

### Requirement 11: Bilingual UI (Chinese/English)

**User Story:** As a student in a Chinese-speaking region, I want the interface in Chinese with an option to switch to English so that I can use the simulator comfortably.

#### Acceptance Criteria

1. THE Simulator SHALL default to Traditional Chinese (繁體中文) as the primary display language
2. THE Simulator SHALL provide a language toggle to switch between Traditional Chinese and English
3. WHEN the user switches the language, THE Simulator SHALL update all UI labels, messages, error texts, and Challenge descriptions to the selected language without reloading the page
4. THE Simulator SHALL display Coding_Block labels in the active language (e.g., "前進" / "Forward", "左轉" / "Turn Left")

### Requirement 12: Fun Block Execution

**User Story:** As a student, I want to use fun blocks so that I can trigger animations on the robot just like the physical set.

#### Acceptance Criteria

1. WHEN the Program contains a Random Movement Fun_Block, THE MatataBot SHALL perform a random movement animation on the Grid_Map (move 1 Cell in a random direction)
2. WHEN the Program contains a Preset Music Fun_Block, THE MatataBot SHALL display a music animation indicator on the Grid_Map without changing position
3. WHEN the Program contains a Preset Dancing Fun_Block, THE MatataBot SHALL display a dancing animation indicator on the Grid_Map without changing position

### Requirement 13: Program Serialization and Deserialization

**User Story:** As a student, I want to save and load my programs so that I can revisit my solutions later.

#### Acceptance Criteria

1. WHEN the user clicks the Save button, THE Simulator SHALL serialize the current Program on the Control_Board into a JSON representation
2. WHEN the user clicks the Load button, THE Simulator SHALL deserialize a JSON representation and reconstruct the Program on the Control_Board
3. THE Serializer SHALL produce a JSON structure that captures block types, positions, parameter values, and line assignments
4. FOR ALL valid Programs, serializing then deserializing SHALL produce an equivalent Program on the Control_Board (round-trip property)
5. IF the user provides an invalid or corrupted JSON file, THEN THE Simulator SHALL display an error message in the active language and leave the Control_Board unchanged

### Requirement 14: Challenge Configuration Parsing

**User Story:** As a parent or teacher, I want to create custom challenges using a simple configuration format so that I can tailor practice to specific competition scenarios.

#### Acceptance Criteria

1. THE Simulator SHALL parse Challenge configurations from a JSON format specifying grid size, start position, start direction, goal positions, obstacle positions, collectible positions, and Block_Inventory limits
2. IF the Challenge configuration JSON is malformed or contains invalid values, THEN THE Simulator SHALL display a descriptive error message in the active language
3. THE Pretty_Printer SHALL format Challenge configuration objects back into valid JSON
4. FOR ALL valid Challenge configurations, parsing then pretty-printing then parsing SHALL produce an equivalent Challenge configuration object (round-trip property)

### Requirement 15: Responsive Web Layout

**User Story:** As a student, I want to use the simulator on different devices so that I can practice on a tablet or desktop computer.

#### Acceptance Criteria

1. THE Simulator SHALL render correctly on screen widths from 768 pixels to 1920 pixels
2. THE Simulator SHALL arrange the Grid_Map, Control_Board, and Block_Inventory panels in a layout that avoids overlapping at all supported screen widths
3. WHEN the viewport width is below 1024 pixels, THE Simulator SHALL stack the Grid_Map above the Control_Board vertically

### Requirement 16: Speed Control

**User Story:** As a student, I want to control the execution speed so that I can watch the robot move slowly to understand the logic or quickly to test solutions.

#### Acceptance Criteria

1. THE Simulator SHALL provide a speed control with at least three settings: slow, normal, and fast
2. WHEN the user changes the speed setting during Execution, THE Simulator SHALL apply the new speed starting from the next instruction step
3. THE Simulator SHALL default to the normal speed setting
