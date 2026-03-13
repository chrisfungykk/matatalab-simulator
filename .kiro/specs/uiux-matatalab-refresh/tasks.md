# Implementation Plan: UI/UX Matatalab Refresh

## Overview

Transform the Matatalab Coding Set Simulator from a plain functional interface into a playful, tactile experience matching the physical product. All changes are presentational — no core logic modifications. Implementation proceeds bottom-up: global theme first, then new shared components, then modifications to existing components, and finally feedback/celebration overlays wired together.

## Tasks

- [x] 1. Set up global theme and CSS custom properties
  - [x] 1.1 Add Nunito font import and define all CSS custom properties in `src/index.css`
    - Import Nunito from Google Fonts
    - Define category color variables (motion, loop, function, number, fun)
    - Define grid map, feedback, button, and block 3D effect variables
    - Set `--font-family` and `--bg-gradient` properties
    - _Requirements: 6.1, 6.6_
  - [x] 1.2 Update `src/App.css` with warm background gradient and safe-area insets
    - Apply `--bg-gradient` to the app shell background
    - Add `env(safe-area-inset-*)` padding for notched devices
    - _Requirements: 6.2, 8.5_
  - [x] 1.3 Add shared animation keyframes file `src/components/animations.css`
    - Define `idle-bob`, `error-shake`, `snap-bounce`, `fade-shrink`, `pulse-glow`, `goal-flag-wave`, `star-glow` keyframes
    - _Requirements: 3.3, 3.5, 5.3, 5.4, 7.2, 4.3, 4.4_

- [x] 2. Create BlockIcon component
  - [x] 2.1 Create `src/components/BlockIcon/BlockIcon.tsx` and `BlockIcon.module.css`
    - Implement `BlockIconProps` interface (`blockType`, `size`, `className`)
    - Map every `BlockType` to an inline SVG icon per the design icon mapping table
    - Render directional arrows for motion blocks, loop/bracket icons, define/play icons, digit/dice for numbers, music/dance/shuffle for fun blocks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 2.2 Write property test: Every block type has an icon (Property 1)
    - **Property 1: Every block type has an icon**
    - **Validates: Requirements 1.1**
  - [x] 2.3 Write property test: Block category color mapping is consistent (Property 3)
    - **Property 3: Block category color mapping is consistent**
    - **Validates: Requirements 1.8**

- [x] 3. Create BotSVG component
  - [x] 3.1 Create `src/components/BotSVG/BotSVG.tsx` and `BotSVG.module.css`
    - Implement `BotSVGProps` interface (`direction`, `isIdle`, `isError`, `animationType`, `className`)
    - Render SVG robot car illustration with eyes and wheels
    - Apply CSS rotation transform based on direction (north→0°, east→90°, south→180°, west→270°) with 300ms transition
    - Apply `.bot-idle` bobbing animation when idle
    - Apply `.bot-error` red flash + shake animation on error
    - Apply `.bot-music` and `.bot-dance` animations for fun-block actions
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  - [x] 3.2 Write property test: Bot rotation matches direction (Property 6)
    - **Property 6: Bot rotation matches direction**
    - **Validates: Requirements 3.2**

- [x] 4. Checkpoint - Verify new shared components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refresh BlockInventory and DraggableBlock
  - [x] 5.1 Update `src/components/BlockInventory/BlockInventory.tsx` and CSS module
    - Render `<BlockIcon>` as primary visual identifier in each block
    - Add localized text label below/beside the icon using `react-i18next`
    - Apply 3D block appearance: `border-radius: 12px`, `box-shadow` for raised edge, inner highlight gradient
    - Render circular count badge overlay in top-right corner of each inventory block
    - Apply `opacity: 0.4` + `filter: grayscale(80%)` for zero-count blocks
    - Group blocks by category (motion, loop, function, number, fun) with visible category headers/dividers
    - Apply drag state: scale to 110% + elevated shadow on active drag
    - Ensure minimum 48×48px touch-target size on blocks
    - _Requirements: 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 8.1, 8.4_
  - [x] 5.2 Write property test: Block renders icon with localized label (Property 2)
    - **Property 2: Block renders icon with localized label**
    - **Validates: Requirements 1.7**
  - [x] 5.3 Write property test: Block 3D appearance invariants (Property 4)
    - **Property 4: Block 3D appearance invariants**
    - **Validates: Requirements 2.1, 2.2, 2.5**
  - [x] 5.4 Write property test: Zero-count blocks are visually disabled (Property 5)
    - **Property 5: Zero-count blocks are visually disabled**
    - **Validates: Requirements 2.4**
  - [x] 5.5 Write property test: Block inventory groups by category (Property 11)
    - **Property 11: Block inventory groups by category**
    - **Validates: Requirements 8.4**

- [x] 6. Refresh ControlBoard with slots and flow indicators
  - [x] 6.1 Update `src/components/ControlBoard/ControlBoard.tsx` and CSS module
    - Render empty block positions as visible rounded slots with dashed outline and subtle background tint
    - Visually distinguish main program line from function definition line using distinct background colors and labeled headers with icons
    - Add flow indicator (small arrow SVG or CSS connector line) between placed blocks
    - Implement snap-bounce animation on block placement (scale 1→1.1→1, 150ms)
    - Implement fade-and-shrink animation on block removal (opacity 1→0, scale 1→0.8, 150ms)
    - Display localized placeholder message with hand-drag icon when no blocks are placed
    - Highlight drop zone with pulsing color animation when block is dragged over valid zone
    - Highlight offending block with red glow and shake animation on execution error
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.2, 7.6_
  - [x] 6.2 Write property test: Flow indicators between placed blocks (Property 8)
    - **Property 8: Flow indicators between placed blocks**
    - **Validates: Requirements 5.5**

- [x] 7. Refresh GridMap with nature theme and BotSVG
  - [x] 7.1 Update `src/components/GridMap/GridMap.tsx` and CSS module
    - Apply soft pastel nature-themed background colors to grid cells
    - Replace obstacle emoji with terrain SVG illustrations (rock/tree/bush)
    - Replace goal emoji with animated flag/trophy SVG
    - Replace collectible emoji with glowing star/gem SVG
    - Add subtle rounded grid lines for board-game appearance
    - Render start cell with distinct colored border or home-base icon indicator
    - Replace existing bot rendering with `<BotSVG>` component
    - Animate bot position transition matching current speed setting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.4_
  - [x] 7.2 Write property test: Special grid cells render SVG illustrations (Property 7)
    - **Property 7: Special grid cells render SVG illustrations**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 8. Checkpoint - Verify core component refreshes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Refresh Toolbar with playful buttons and icons
  - [x] 9.1 Update `src/components/Toolbar/Toolbar.tsx` and CSS module
    - Enlarge Run button with rounded shape, green background, and play icon
    - Enlarge Reset button with rounded shape, orange background, and reset icon
    - Add icons alongside text labels for all toolbar action buttons
    - Apply rounded shapes throughout toolbar
    - Animate Run button with brief press-down effect on tap, trigger bot "ready" animation before execution
    - _Requirements: 6.3, 6.4, 7.3_
  - [x] 9.2 Write property test: Toolbar buttons have icons and text (Property 9)
    - **Property 9: Toolbar buttons have icons and text**
    - **Validates: Requirements 6.4**

- [x] 10. Refresh ChallengeSelector with card design
  - [x] 10.1 Update `src/components/ChallengeSelector/ChallengeSelector.tsx` and CSS module
    - Apply `border-radius: 12px` to challenge cards
    - Add colored difficulty badges (green for easy, orange for medium, red for hard)
    - Add hover/tap lift effect (`translateY(-2px)` + shadow increase)
    - _Requirements: 6.5_
  - [x] 10.2 Write property test: Challenge cards have correct difficulty badge (Property 10)
    - **Property 10: Challenge cards have correct difficulty badge**
    - **Validates: Requirements 6.5**

- [x] 11. Create FeedbackOverlay, ConfettiCanvas, and StarRating components
  - [x] 11.1 Create `src/components/FeedbackOverlay/FeedbackOverlay.tsx` and `FeedbackOverlay.module.css`
    - Implement `FeedbackOverlayProps` interface (`executionStatus`, `goalReached`, `errorInfo`, `challengeDifficulty`, `language`, `onDismiss`)
    - Render full-screen success overlay with confetti, star rating, and localized congratulatory message when goal reached
    - Render encouraging "try again" message with friendly animation when goal not reached
    - Render error toast highlighting offending block on execution error
    - Auto-dismiss overlay after 5 seconds
    - Fade-out within 300ms on user dismiss or auto-dismiss
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 9.3, 9.4_
  - [x] 11.2 Create `src/components/ConfettiCanvas/ConfettiCanvas.tsx`
    - Implement `ConfettiCanvasProps` interface (`active`, `duration`, `particleCount`)
    - Render canvas-based confetti particle burst using `requestAnimationFrame`
    - Particles are colored rectangles with gravity and random velocity, lasting 2–4 seconds
    - Canvas absolutely positioned over the overlay
    - _Requirements: 9.2_
  - [x] 11.3 Create `src/components/StarRating/StarRating.tsx`
    - Implement `StarRatingProps` interface (`difficulty`)
    - Render 1 star for easy, 2 stars for medium, 3 stars + trophy for hard
    - _Requirements: 9.1_
  - [x] 11.4 Write property test: Star rating matches difficulty (Property 13)
    - **Property 13: Star rating matches difficulty**
    - **Validates: Requirements 9.1**
  - [x] 11.5 Write property test: Success message is localized (Property 14)
    - **Property 14: Success message is localized**
    - **Validates: Requirements 9.3**

- [x] 12. Wire FeedbackOverlay into App and integrate with execution state
  - [x] 12.1 Update `src/App.tsx` to render `<FeedbackOverlay>` and connect to execution state
    - Import and render `FeedbackOverlay` component
    - Pass `executionStatus`, `goalReached`, `errorInfo`, `challengeDifficulty`, `language`, and `onDismiss` from simulator state
    - Remove or evolve existing `ErrorDisplay` usage to use `FeedbackOverlay`
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 9.1, 9.2, 9.3, 9.4_

- [x] 13. Responsive layout and accessibility pass
  - [x] 13.1 Update `src/App.css` and component CSS modules for responsive breakpoints
    - Stack Grid_Map above Control_Board and Block_Inventory in single-column layout when viewport < 768px
    - Display Grid_Map and right panel side by side when viewport ≥ 1024px
    - Ensure minimum 44×44px touch-target size for all interactive elements on touch devices
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 13.2 Verify and preserve keyboard navigation and screen-reader accessibility
    - Ensure all interactive elements retain appropriate ARIA attributes (`role`, `aria-label`, `tabIndex`)
    - Ensure keyboard event handlers are preserved on blocks, buttons, and drop zones
    - _Requirements: 8.6_
  - [x] 13.3 Write property test: Accessibility attributes preserved (Property 12)
    - **Property 12: Accessibility attributes preserved**
    - **Validates: Requirements 8.6**

- [x] 14. Add i18n keys for new UI strings
  - [x] 14.1 Update `src/i18n/en.json` and `src/i18n/zh.json` with new translation keys
    - Add keys for block icon labels, category headers, control board placeholder, feedback overlay messages (success, try-again, error), star rating labels
    - _Requirements: 1.7, 5.6, 9.3_

- [x] 15. Version bump and final checkpoint
  - [x] 15.1 Bump version in `package.json` and `vite.config.ts` (`__APP_VERSION__` define) as a minor version increment
    - _Workspace rule: versioning.md_
  - [x] 15.2 Final checkpoint - Ensure all tests pass and build is clean
    - Run `npm run build` to verify clean build
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- No core logic (reducer, executor, validator, serializer) is modified — all changes are presentational
