# Implementation Plan: Matatalab Coding Set Simulator

## Overview

Build a client-side web simulator for the Matatalab Coding Set using TypeScript, React 18, Vite, @dnd-kit, react-i18next, CSS Modules, and fast-check + Vitest for testing. Implementation proceeds from core data models through logic modules, then UI components, and finally integration/wiring.

## Tasks

- [x] 1. Project scaffolding and core types
  - [x] 1.1 Initialize Vite + React + TypeScript project
    - Run `npm create vite@latest` with React-TS template
    - Install dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `react-i18next`, `i18next`, `uuid`
    - Install dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
    - Configure `vitest.config.ts` with jsdom environment
    - _Requirements: 15.1_

  - [x] 1.2 Define core data model types
    - Create `src/core/types.ts` with `Direction`, `BlockType`, `CodingBlock`, `Position`, `ControlBoardState`, `ProgramLine`, `GridState`, `SimulatorState`, `SpeedSetting`, `SPEED_DELAYS`, `ExecutionState`, `StackFrame`, `ValidationError`, `ValidationResult`, `SerializedProgram`, `SerializedBlock`, `ChallengeConfig`
    - Define `DEFAULT_BLOCK_INVENTORY` constant matching physical set limits
    - Define `SimulatorAction` discriminated union type for all reducer actions
    - _Requirements: 2.2, 4.1–4.6, 5.1, 6.1, 9.3, 13.3, 16.1_

- [x] 2. Block inventory state management
  - [x] 2.1 Implement block inventory reducer logic
    - Create `src/core/inventory.ts` with functions: `placeBlock(inventory, blockType)` returns updated inventory or error when count is 0, `removeBlock(inventory, blockType)` returns updated inventory
    - Enforce count bounds: 0 ≤ count ≤ initial limit for every block type
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Write property test: Block inventory round-trip (Property 1)
    - **Property 1: Block inventory round-trip (place and remove)**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 2.3 Write property test: Block inventory count bounds (Property 2)
    - **Property 2: Block inventory count is non-negative and bounded**
    - **Validates: Requirements 2.2, 2.5**

- [x] 3. Control board state management
  - [x] 3.1 Implement control board reducer logic
    - Create `src/core/controlBoard.ts` with functions: `placeBlockOnBoard`, `removeBlockFromBoard`, `reorderBlock`, `validatePlacement` (reject Function_Define on line 0, reject Number_Block after Turn)
    - Support at least two lines (main program + function definition)
    - _Requirements: 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 4.7_

  - [x] 3.2 Write property test: Reordering preserves block set (Property 3)
    - **Property 3: Reordering preserves block set**
    - **Validates: Requirements 2.6**

  - [x] 3.3 Write property test: Function_Define on main line rejected (Property 12)
    - **Property 12: Function_Define_Block on main line is rejected**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 3.4 Write property test: Number block on turn rejected (Property 7)
    - **Property 7: Number block on turn is rejected**
    - **Validates: Requirements 4.7**

- [x] 4. Program validator
  - [x] 4.1 Implement program validator
    - Create `src/core/validator.ts` implementing `validateProgram(board: ControlBoardState): ValidationResult`
    - Check: unmatched Loop Begin/End, missing loop Number_Block, Function_Call without Function_Define, Number_Block after Turn
    - Return error with `blockIndex`, `line`, and `messageKey` (i18n key) for each violation
    - _Requirements: 5.3, 5.4, 5.5, 6.2, 7.1_

  - [x] 4.2 Write property test: Loop validation rejects malformed loops (Property 9)
    - **Property 9: Loop validation rejects malformed loops**
    - **Validates: Requirements 5.3, 5.4, 5.5**

  - [x] 4.3 Write property test: Function call without definition rejected (Property 11)
    - **Property 11: Function call without definition is rejected**
    - **Validates: Requirements 6.2**

  - [x] 4.4 Write property test: Validation runs before execution (Property 13)
    - **Property 13: Validation runs before execution**
    - **Validates: Requirements 7.1**

- [x] 5. Checkpoint - Core logic validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Program executor
  - [x] 6.1 Implement program executor core
    - Create `src/core/executor.ts` implementing `createExecutor` and the `ProgramExecutor` interface (`step`, `run`, `reset`, `setSpeed`)
    - Implement motion block execution: forward/backward with optional Number_Block multiplier, turn left/right rotation
    - Implement boundary checking (stop execution on out-of-bounds) and obstacle collision checking (stop execution on obstacle cell)
    - Track `currentBlockIndex`, `botPosition`, `botDirection`, `collectedItems`, `stepCount`
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 7.2, 7.6, 7.7, 8.1, 8.2_

  - [x] 6.2 Implement loop execution logic
    - Handle Loop Begin + Number_Block + enclosed blocks + Loop End: execute enclosed sequence N times
    - Handle Random Number_Block on loops: resolve to random integer in [1, 6]
    - Manage `loopCounters` map for nested tracking
    - _Requirements: 5.1, 5.2_

  - [x] 6.3 Implement function call execution logic
    - Handle Function_Call_Block: push current position onto `callStack`, jump to Function_Define line, execute subroutine, pop and return
    - Support Function_Define with optional Number_Block parameter for repeat count
    - Handle multiple Function_Call_Blocks in sequence
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 6.4 Implement fun block execution logic
    - Random Movement: move bot 1 cell in a random valid direction
    - Preset Music: set animation indicator, no position change
    - Preset Dancing: set animation indicator, no position change
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 6.5 Implement goal checking on execution completion
    - On execution complete: check if bot is on a goal cell AND all collectibles collected
    - Dispatch `EXECUTION_COMPLETE` with success/failure
    - _Requirements: 7.4, 9.4_

  - [x] 6.6 Write property test: Motion block distance (Property 4)
    - **Property 4: Motion block moves bot by correct distance**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 6.7 Write property test: Random number in [1, 6] (Property 5)
    - **Property 5: Random number block produces value in [1, 6]**
    - **Validates: Requirements 4.4, 5.2**

  - [x] 6.8 Write property test: Turn blocks rotate without moving (Property 6)
    - **Property 6: Turn blocks rotate direction without moving**
    - **Validates: Requirements 4.5, 4.6**

  - [x] 6.9 Write property test: Loop executes N times (Property 8)
    - **Property 8: Loop executes enclosed sequence exactly N times**
    - **Validates: Requirements 5.1**

  - [x] 6.10 Write property test: Function call executes subroutine (Property 10)
    - **Property 10: Function call executes the defined subroutine**
    - **Validates: Requirements 6.1, 6.4**

  - [x] 6.11 Write property test: Boundary violation stops execution (Property 16)
    - **Property 16: Boundary violation stops execution**
    - **Validates: Requirements 7.6, 8.1**

  - [x] 6.12 Write property test: Obstacle collision stops execution (Property 17)
    - **Property 17: Obstacle collision stops execution**
    - **Validates: Requirements 7.7, 8.2**

  - [x] 6.13 Write property test: Non-movement fun blocks preserve position (Property 24)
    - **Property 24: Non-movement fun blocks preserve position**
    - **Validates: Requirements 12.2, 12.3**

  - [x] 6.14 Write property test: Random movement fun block moves 1 cell (Property 25)
    - **Property 25: Random movement fun block moves exactly 1 cell**
    - **Validates: Requirements 12.1**

  - [x] 6.15 Write property test: Goal checking on completion (Property 14)
    - **Property 14: Goal checking on execution completion**
    - **Validates: Requirements 7.4, 9.4**

- [x] 7. Checkpoint - Executor logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Program serializer and challenge config parser
  - [x] 8.1 Implement program serializer/deserializer
    - Create `src/core/serializer.ts` with `serialize(board)` and `deserialize(json)` functions
    - Serialize captures block types, parameters, line assignments, ordering
    - Deserialize validates JSON structure, throws on invalid input
    - _Requirements: 13.1, 13.2, 13.3, 13.5_

  - [x] 8.2 Implement challenge config parser and pretty-printer
    - Create `src/core/challengeParser.ts` with `parseChallenge(json)` and `prettyPrintChallenge(config)` functions
    - Validate grid dimensions (4–10), positions within bounds, required fields
    - Return descriptive errors for malformed JSON
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 8.3 Write property test: Program serialization round-trip (Property 19)
    - **Property 19: Program serialization round-trip**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  - [x] 8.4 Write property test: Invalid program JSON rejected (Property 20)
    - **Property 20: Invalid program JSON is rejected gracefully**
    - **Validates: Requirements 13.5**

  - [x] 8.5 Write property test: Challenge config round-trip (Property 21)
    - **Property 21: Challenge configuration round-trip**
    - **Validates: Requirements 14.1, 14.3, 14.4**

  - [x] 8.6 Write property test: Invalid challenge JSON rejected (Property 22)
    - **Property 22: Invalid challenge configuration JSON is rejected**
    - **Validates: Requirements 14.2**

- [x] 9. Simulator state reducer and reset logic
  - [x] 9.1 Implement simulator reducer
    - Create `src/core/simulatorReducer.ts` handling all `SimulatorAction` types
    - Wire inventory, control board, executor, validator, and serializer into reducer cases
    - Implement `RESET` action: restore bot to start position/direction, clear execution state and collected items, preserve Control_Board blocks
    - Implement `LOAD_CHALLENGE` action: set grid, bot start, obstacles, goals, collectibles, block inventory from ChallengeConfig
    - _Requirements: 7.5, 9.2_

  - [x] 9.2 Write property test: Reset preserves program (Property 15)
    - **Property 15: Reset preserves program but restores bot state**
    - **Validates: Requirements 7.5**

  - [x] 9.3 Write property test: Challenge loading initializes state (Property 18)
    - **Property 18: Challenge loading initializes state correctly**
    - **Validates: Requirements 1.1, 1.3, 9.2**

- [x] 10. Checkpoint - All core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. i18n setup
  - [x] 11.1 Configure react-i18next and create translation files
    - Create `src/i18n/index.ts` initializing i18next with `zh` and `en` resources, default language `zh`
    - Create `src/i18n/zh.json` with all UI labels, block names, error messages, challenge descriptions in Traditional Chinese
    - Create `src/i18n/en.json` with matching English translations for every key
    - Block labels: 前進/Forward, 後退/Backward, 左轉/Turn Left, 右轉/Turn Right, 迴圈開始/Loop Begin, 迴圈結束/Loop End, 定義函式/Define Function, 呼叫函式/Call Function, 隨機移動/Random Move, 音樂/Music, 跳舞/Dance
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 11.2 Write property test: i18n completeness (Property 23)
    - **Property 23: i18n completeness**
    - **Validates: Requirements 11.3, 11.4**

- [x] 12. Built-in challenges
  - [x] 12.1 Create built-in challenge JSON configurations
    - Create `src/challenges/` directory with at least 3 challenge JSON files: easy, medium, hard
    - Easy: small grid (4×4), no obstacles, simple straight-line goal
    - Medium: 6×6 grid, some obstacles, requires turns and possibly loops
    - Hard: 8×8 grid, multiple obstacles, collectibles, requires loops and functions
    - Create `src/challenges/index.ts` exporting all built-in challenges
    - _Requirements: 9.1, 9.3, 9.5_

- [ ] 13. UI components - GridMap
  - [x] 13.1 Implement GridMap component
    - Create `src/components/GridMap/GridMap.tsx` and `GridMap.module.css`
    - Render NxN CSS Grid with dynamic cell sizing: `cellSize = min(availableWidth, availableHeight) / gridSize`
    - Render cell borders, obstacle icons, goal icons, collectible icons with distinct visuals
    - Render MatataBot as SVG/icon with CSS rotation transform for direction
    - Show animation indicators for fun blocks (music note, dance icon)
    - Show visual error indicators on bot for boundary/obstacle violations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [ ] 14. UI components - BlockInventory
  - [x] 14.1 Implement BlockInventory component
    - Create `src/components/BlockInventory/BlockInventory.tsx` and `BlockInventory.module.css`
    - Display all block types with remaining count badges
    - Grey out and disable dragging for blocks with count 0
    - Each block is a `Draggable` source using `@dnd-kit/core`
    - Display block labels in active language using `useTranslation()`
    - _Requirements: 2.1, 2.2, 2.5, 11.4_

- [ ] 15. UI components - ControlBoard with drag-and-drop
  - [x] 15.1 Implement ControlBoard component with @dnd-kit
    - Create `src/components/ControlBoard/ControlBoard.tsx` and `ControlBoard.module.css`
    - Set up `DndContext` and `SortableContext` for drag-and-drop between inventory and board, and reordering within board
    - Render program lines (line 0 = main, line 1+ = function definitions) with blocks arranged left-to-right
    - Implement drop zones between blocks for insertion
    - Handle drag from inventory → board (PLACE_BLOCK), board → inventory (REMOVE_BLOCK), board reorder (REORDER_BLOCK)
    - Highlight currently executing block during execution
    - Highlight error-causing block on validation/runtime errors
    - _Requirements: 2.3, 2.4, 2.6, 3.1, 3.2, 7.3, 8.3_

- [ ] 16. UI components - Toolbar and controls
  - [x] 16.1 Implement Toolbar component
    - Create `src/components/Toolbar/Toolbar.tsx` and `Toolbar.module.css`
    - Run button: triggers `RUN_PROGRAM` action (validates then executes)
    - Reset button: triggers `RESET` action
    - Save button: serializes program, saves to localStorage and offers file download
    - Load button: opens file picker, deserializes JSON, dispatches `LOAD_PROGRAM`
    - Speed selector: slow/normal/fast radio or dropdown, dispatches `SET_SPEED`
    - Language toggle: zh/en switch, dispatches `SET_LANGUAGE` and calls `i18next.changeLanguage()`
    - _Requirements: 7.1, 7.5, 13.1, 13.2, 16.1, 16.3, 11.2_

  - [x] 16.2 Implement competition timer
    - Add timer controls to Toolbar: duration input, start/stop timer buttons
    - Display countdown timer during timed mode
    - Dispatch `TIMER_TICK` every second, `TIMER_EXPIRED` when reaching zero
    - Allow starting challenges without timer (free practice mode)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 16.3 Write property test: Timer expiry stops execution (Property 26)
    - **Property 26: Timer expiry stops execution**
    - **Validates: Requirements 10.3**

  - [x] 16.4 Write property test: Speed change applies to next step (Property 27)
    - **Property 27: Speed change applies to next step**
    - **Validates: Requirements 16.2**

- [ ] 17. UI components - ChallengeSelector
  - [x] 17.1 Implement ChallengeSelector component
    - Create `src/components/ChallengeSelector/ChallengeSelector.tsx` and `ChallengeSelector.module.css`
    - List available challenges with title (in active language) and difficulty badge (easy/medium/hard)
    - On click, dispatch `LOAD_CHALLENGE` with the selected challenge config
    - _Requirements: 9.1, 9.2_

- [ ] 18. App shell, layout, and wiring
  - [x] 18.1 Implement App shell and responsive layout
    - Create `src/App.tsx` wiring all components together
    - Provide `SimulatorState` via React context + `useReducer`
    - Provide i18n context via `I18nextProvider`
    - Set up `DndContext` at the App level wrapping ControlBoard and BlockInventory
    - Implement responsive CSS layout: side-by-side on ≥1024px, stacked (GridMap above ControlBoard) on <1024px
    - Ensure Grid_Map, Control_Board, and Block_Inventory panels do not overlap at 768–1920px widths
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 18.2 Wire execution animation loop
    - Implement `useEffect`-based animation loop: on `RUN_PROGRAM`, validate → start stepping with `setTimeout` delay based on `speed`
    - Apply speed changes immediately to next step delay
    - On boundary/obstacle error, stop loop and highlight causing block
    - On completion, check goal conditions
    - _Requirements: 7.2, 7.3, 7.6, 7.7, 16.2_

- [x] 19. Checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Final polish and verification
  - [x] 20.1 Add error message display component
    - Create a toast/notification component for displaying validation errors, runtime errors, and serialization errors in the active language
    - Wire error display to reducer error states
    - _Requirements: 5.3, 5.4, 5.5, 6.2, 7.6, 7.7, 13.5, 14.2_

  - [x] 20.2 Verify all built-in challenges are playable end-to-end
    - Write integration tests that load each built-in challenge, execute a known-correct program, and assert success
    - _Requirements: 9.4, 9.5_

- [x] 21. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with minimum 100 iterations per property
- Checkpoints ensure incremental validation at logical boundaries
- All 27 correctness properties from the design document are covered as property test sub-tasks
