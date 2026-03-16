# Tasks: Canvas Grid & Competition Mode

## Task 1: Core Types and State Extensions
- [x] 1.1 Add new types to `src/core/types.ts`: `RendererType`, `CompetitionTier`, `RoundScore`, `CompetitionRound`, `CompetitionSession`, `CompetitionState`, `CompetitionChallengeSet`, `CompetitionChallengeEntry`, `MazeGeneratorParams`, `MazeGeneratorResult`, `StoredCompetitionHistory`
- [x] 1.2 Extend `SimulatorState` with `renderer: RendererType` and `competition: CompetitionState` fields
- [x] 1.3 Add new `SimulatorAction` variants: `SET_RENDERER`, `ACTIVATE_COMPETITION`, `DEACTIVATE_COMPETITION`, `START_ROUND`, `COMPLETE_ROUND`, `NEXT_ROUND`, `GENERATE_MAZE`, `LOAD_GENERATED_MAZE`
- [x] 1.4 Extend `ChallengeConfig` with optional `generationSeed?: number` field
- [x] 1.5 Update `simulatorReducer` to handle new action types and initialize new state fields in `createInitialState`
- [x] 1.6 Update `challengeParser.ts` to accept and preserve the optional `generationSeed` field

## Task 2: Score Calculation Module
- [x] 2.1 Create `src/core/scoreCalculation.ts` with `calculateRoundScore` function (base + collectible + efficiency + speed bonuses)
- [x] 2.2 Implement `calculateStarRating` function (1 star: completed, 2 stars: ≥60%, 3 stars: ≥85%)
- [x] 2.3 Implement `calculateSessionSummary` function (aggregate per-round scores, total, star rating)
- [x] 2.4 Implement `isPersonalBest` function (compare session score against stored best)
- [x] 2.5 Write property tests in `src/core/__tests__/scoreCalculation.property.test.ts` for Properties 8, 9, 10, 16
- [x] 2.6 Write unit tests in `src/core/__tests__/scoreCalculation.test.ts` for boundary cases (perfect score, zero score, threshold values)

## Task 3: Random Maze Generator
- [x] 3.1 Create `src/core/mazeGenerator.ts` with seeded PRNG (mulberry32) implementation
- [x] 3.2 Implement `generateMaze(params: MazeGeneratorParams): MazeGeneratorResult` — place start at edge/corner, goal at ≥50% Manhattan distance, obstacles by density, collectibles on free cells
- [x] 3.3 Implement BFS solvability validation (path from start through all collectibles to goal)
- [x] 3.4 Implement retry logic (remove obstacles if unsolvable, max 50 iterations)
- [x] 3.5 Ensure output conforms to `ChallengeConfig` interface with `generationSeed` field
- [x] 3.6 Write property tests in `src/core/__tests__/mazeGenerator.property.test.ts` for Properties 17–22, 25
- [x] 3.7 Write unit tests in `src/core/__tests__/mazeGenerator.test.ts` for edge cases (min/max grid, zero collectibles, max collectibles)

## Task 4: Competition State Management
- [x] 4.1 Implement `ACTIVATE_COMPETITION` reducer case — initialize `CompetitionState` from a `CompetitionChallengeSet`
- [x] 4.2 Implement `DEACTIVATE_COMPETITION` reducer case — reset competition state to inactive
- [x] 4.3 Implement `START_ROUND` reducer case — load the current round's challenge (predefined or generate random maze), start timer
- [x] 4.4 Implement `COMPLETE_ROUND` reducer case — record score, mark round complete
- [x] 4.5 Implement `NEXT_ROUND` reducer case — advance round index or trigger session summary
- [x] 4.6 Implement competition timer integration — reuse existing timer actions, enforce default 180s per round
- [x] 4.7 Write property tests in `src/core/__tests__/competitionState.property.test.ts` for Properties 6, 7, 11, 12, 14, 23, 24, 27
- [x] 4.8 Write unit tests in `src/core/__tests__/competitionState.test.ts` for full session lifecycle

## Task 5: Competition Persistence (localStorage)
- [x] 5.1 Create `src/core/competitionPersistence.ts` with `saveSession`, `loadHistory`, `getPersonalBest`, `updatePersonalBest` functions
- [x] 5.2 Implement `StoredCompetitionHistory` schema validation on load (handle corrupted data gracefully)
- [x] 5.3 Implement localStorage unavailability detection with bilingual warning (Req 8.5)
- [x] 5.4 Write property test in `src/core/__tests__/competitionPersistence.property.test.ts` for Property 15
- [x] 5.5 Write unit tests for corrupted data, full storage, and concurrent access edge cases

## Task 6: Competition Challenge Sets
- [x] 6.1 Create `src/challenges/competitionSets.ts` with built-in challenge sets organized by skill focus (Orientation, Navigation, Collection, Combined)
- [x] 6.2 Define Beginner, Intermediate, and Advanced tier challenge sets with bilingual titles and descriptions
- [x] 6.3 Implement mixed challenge set builder supporting configurable random/predefined ratio
- [x] 6.4 Ensure each challenge set includes `recommendedTimePerChallenge` and block inventory restrictions matching physical Matatalab set limits

## Task 7: Bilingual i18n Extensions
- [x] 7.1 Add competition mode keys to `src/i18n/en.json`: mode toggle, dashboard labels, round/score/timer terms, result summary labels
- [x] 7.2 Add competition mode keys to `src/i18n/zh.json` with Traditional Chinese translations
- [x] 7.3 Add maze generator keys to both language files: generate button, difficulty selector, seed input, grid size, export button
- [x] 7.4 Add challenge set keys to both language files: set titles, descriptions, skill focus categories
- [x] 7.5 Add scoring term keys in bilingual format: 得分/Score, 星級/Stars, 個人最佳/Personal Best, 回合/Round, 完成/Complete
- [x] 7.6 Write property test in `src/core/__tests__/i18nCompleteness.property.test.ts` for Property 26

## Task 8: Canvas Grid Renderer
- [x] 8.1 Create `src/components/CanvasGridMap/CanvasGridMap.tsx` accepting `GridMapProps` interface — set up `<canvas>` element with `requestAnimationFrame` draw loop
- [x] 8.2 Implement canvas scaling logic — fit viewport, maintain 1:1 cell aspect ratio, handle resize with debounced redraw
- [x] 8.3 Implement cell rendering — borders, rounded corners, pastel fills, nature-themed colors
- [x] 8.4 Implement sprite rendering for obstacles (rock/tree/bush), goals (animated flag), collectibles (pulsing star), and start zone indicator
- [x] 8.5 Implement bot rendering on canvas with direction indicator
- [x] 8.6 Write property test in `src/components/__tests__/canvasScaling.property.test.ts` for Property 1

## Task 9: Canvas Bot Animation
- [x] 9.1 Implement smooth position tweening (interpolation) for bot movement matching `SPEED_DELAYS` per speed setting
- [x] 9.2 Implement smooth rotation animation for direction changes (≤200ms)
- [x] 9.3 Implement idle animation (gentle bobbing) using `requestAnimationFrame`
- [x] 9.4 Implement error animation (red flash + shake, 500ms) for boundary/obstacle collisions
- [x] 9.5 Implement music fun block animation (floating musical note particles)
- [x] 9.6 Implement dance fun block animation (wiggle motion)
- [x] 9.7 Implement collectible pickup animation (shrink + fade, 300ms)
- [x] 9.8 Implement canvas-based confetti burst on successful goal completion (2–4 seconds)
- [x] 9.9 Write property test in `src/components/__tests__/canvasAnimation.property.test.ts` for Property 5

## Task 10: Canvas Accessibility Layer
- [x] 10.1 Create `src/components/CanvasGridMap/AccessibilityLayer.tsx` — hidden off-screen DOM with ARIA grid/gridcell roles mirroring canvas grid
- [x] 10.2 Implement state synchronization — update hidden DOM on every grid state change (bot position, collected items, execution status)
- [x] 10.3 Set `aria-label` on `<canvas>` element with grid dimensions and bot position
- [x] 10.4 Implement ARIA live region for bot movement announcements
- [x] 10.5 Write property tests in `src/components/__tests__/accessibilityLayer.property.test.ts` for Properties 2, 3

## Task 11: Kid-Friendly Block Icons
- [x] 11.1 Redesign motion block SVG icons with cartoon-style arrows (smiling faces, thick outlines ≥2px, bright saturated colors)
- [x] 11.2 Redesign loop block SVG icons (circular arrow with friendly expression, matching bracket)
- [x] 11.3 Redesign function block SVG icons (toolbox/magic wand, play-button star)
- [x] 11.4 Redesign number block SVG icons (bubbly digits, bouncing dice for random)
- [x] 11.5 Redesign fun block SVG icons (musical note with sparkles, dancing figure, question-mark arrow)
- [x] 11.6 Apply category color scheme with increased saturation and softer gradients
- [x] 11.7 Ensure all icons render at minimum 32×32 pixels
- [x] 11.8 Write property test in `src/components/__tests__/blockIcon.property.test.ts` for Property 4

## Task 12: Kid-Friendly UI Theme
- [x] 12.1 Add Nunito font (or equivalent rounded sans-serif) with minimum 16px body size
- [x] 12.2 Apply warm pastel background gradient to app shell with subtle cloud/nature decorations
- [x] 12.3 Restyle Toolbar Run button (large green circle, cartoon play icon, ≥56×56 touch target) and Reset button (large orange circle, cartoon refresh icon)
- [x] 12.4 Add cartoon-style category label badges with mascot icons to `BlockInventory` headers
- [x] 12.5 Restyle `ControlBoard` empty slots with dashed outline, pastel tint, and placeholder icon
- [x] 12.6 Implement bouncy scale-up animation (overshoot 115% → settle 100%, ≤200ms) for block placement on `ControlBoard`
- [x] 12.7 Define all theme colors as CSS custom properties for consistent theming

## Task 13: Competition Mode UI Components
- [x] 13.1 Create `CompetitionDashboard` component — displays current round number, time remaining, score, challenge progress during active competition
- [x] 13.2 Create `CompetitionSummary` component — displays per-round scores, total score, star rating, personal best indicator, areas for improvement
- [x] 13.3 Create `CompetitionHistory` component — lists past sessions from localStorage with date, set name, total score, star rating
- [x] 13.4 Add competition mode toggle button to `Toolbar`
- [x] 13.5 Update `ChallengeSelector` to support competition challenge sets with bilingual titles, skill focus descriptions, and challenge counts
- [x] 13.6 Add visual indicator (dice icon) on challenge cards to distinguish random mazes from predefined challenges
- [x] 13.7 Write unit tests for `CompetitionDashboard`, `CompetitionSummary` components

## Task 14: Maze Generator UI
- [x] 14.1 Create `MazeControls` component — seed input, grid width/height selectors, difficulty dropdown, collectible count, generate button, export button
- [x] 14.2 Implement maze generation trigger — call `generateMaze` and dispatch `LOAD_GENERATED_MAZE`
- [x] 14.3 Display seed value in UI after generation for reuse
- [x] 14.4 Implement maze export — serialize `ChallengeConfig` to JSON file download
- [x] 14.5 Implement maze import validation — use `parseChallenge` with bilingual error messages for invalid files (Req 12.5)
- [x] 14.6 Write unit tests for `MazeControls` component

## Task 15: Renderer Toggle and Coexistence
- [x] 15.1 Add renderer toggle control to Toolbar (or settings panel) switching between DOM and Canvas renderers
- [x] 15.2 Implement conditional rendering in `App.tsx` — render `GridMap` or `CanvasGridMap` based on `state.renderer`
- [x] 15.3 Implement Canvas 2D support detection — fall back to DOM renderer with bilingual message if unsupported (Req 14.5)
- [x] 15.4 Default new users to Canvas renderer
- [x] 15.5 Ensure renderer switch preserves grid state, bot position, direction, and execution state
- [x] 15.6 Write property test for Property 27 (renderer switch preserves state) in `src/core/__tests__/competitionState.property.test.ts`

## Task 16: App Integration and Wiring
- [x] 16.1 Wire competition mode state and actions into `App.tsx` — add callbacks for competition activation, round management, score recording
- [x] 16.2 Integrate `CompetitionDashboard` into main layout (visible when competition active)
- [x] 16.3 Integrate `CompetitionSummary` as overlay/modal after session completion
- [x] 16.4 Integrate `CompetitionHistory` accessible from competition mode UI
- [x] 16.5 Integrate `MazeControls` into challenge panel area
- [x] 16.6 Wire language switching to update all new feature labels without page reload (Req 13.4)

## Task 17: Version Bump and Build Verification
- [x] 17.1 Bump version to `1.3.0` in `package.json` and `vite.config.ts` (`__APP_VERSION__` define)
- [x] 17.2 Run `npm run build` to verify clean build with all new features
- [x] 17.3 Run `npm run test` to verify all new and existing tests pass
