# Tasks: iPad Touch Interaction

## Task 1: Create TapToPlaceContext and Provider

- [x] 1.1 Create `src/contexts/TapToPlaceContext.tsx` with `TapToPlaceContextValue` interface (`selectedBlock: BlockType | null`, `selectBlock`, `deselectBlock`)
- [x] 1.2 Implement `TapToPlaceProvider` component managing `selectedBlock` state with `selectBlock` (sets type) and `deselectBlock` (sets null)
- [x] 1.3 Export `useTapToPlace` hook that reads the context
- [x] 1.4 Wrap app content with `TapToPlaceProvider` inside `DndContext` in `App.tsx`

## Task 2: Add tap-to-select in BlockInventory

- [x] 2.1 Import `useTapToPlace` in `BlockInventory.tsx` and read `selectedBlock`, `selectBlock`, `deselectBlock`
- [x] 2.2 Add `onClick` handler to `DraggableBlock`: if disabled → no-op; if same block → deselect; otherwise → select
- [x] 2.3 Apply `styles.selected` CSS class when `blockType === selectedBlock`
- [x] 2.4 Add `aria-pressed` attribute reflecting selection state on each inventory block
- [x] 2.5 Add `.selected` CSS class in `BlockInventory.module.css` with a visible border/highlight (3:1 contrast minimum)

## Task 3: Add tap-to-place on ControlBoard

- [x] 3.1 Import `useTapToPlace` in `ControlBoard.tsx` and read `selectedBlock`, `deselectBlock`
- [x] 3.2 Add `onClick` handler to `DropZone`: if `selectedBlock` is set → dispatch `PLACE_BLOCK` at this position; if null → no-op
- [x] 3.3 Add `onClick` handler to empty `ProgramLineRow`: if `selectedBlock` is set → dispatch `PLACE_BLOCK` at position 0
- [x] 3.4 Show drop zones with `styles.dropZoneVisible` class when `selectedBlock` is set (larger, highlighted)
- [x] 3.5 Add `tabIndex={0}`, `role="button"`, and keyboard `onKeyDown` (Enter/Space) handler on drop zones when `selectedBlock` is set
- [x] 3.6 After successful placement, check inventory count: if count > 0 keep selection, if count = 0 call `deselectBlock()`

## Task 4: Add tap-to-remove and tap-to-insert on board blocks

- [x] 4.1 Add `onClick` handler to `SortableBlock`: if `selectedBlock` is null → dispatch `REMOVE_BLOCK`; if `selectedBlock` is set → dispatch `PLACE_BLOCK` before this block's position
- [x] 4.2 Prevent `onClick` from firing during drag operations (check `isDragging` state from `useSortable`)
- [x] 4.3 Add keyboard `onKeyDown` (Enter/Space) handler on board blocks for remove/insert actions

## Task 5: Visual feedback — SelectionStatusLabel and drop zone indicators

- [x] 5.1 Create `src/components/SelectionStatusLabel/SelectionStatusLabel.tsx` that displays "Selected: [block name]" when `selectedBlock` is set
- [x] 5.2 Add `aria-live="polite"` to the status label for screen reader announcements
- [x] 5.3 Render `SelectionStatusLabel` near the control board in `App.tsx`
- [x] 5.4 Add `.dropZoneVisible` CSS in `ControlBoard.module.css` with visible placement indicator styling
- [x] 5.5 Add ARIA live region in `TapToPlaceProvider` that announces block placement and removal events

## Task 6: Touch-optimized target sizes

- [x] 6.1 Add `@media (pointer: coarse)` styles in `BlockInventory.module.css` setting minimum 44×44px on inventory blocks
- [x] 6.2 Add `@media (pointer: coarse)` styles in `ControlBoard.module.css` setting minimum 44×44px on board blocks and 44px width on drop zones
- [x] 6.3 Add `@media (pointer: coarse)` styles in `Toolbar.module.css` setting minimum 44×44px on toolbar buttons
- [x] 6.4 Add minimum 8px gap between adjacent tappable elements in touch media queries

## Task 7: Responsive iPad layout adjustments

- [x] 7.1 Update `App.css` tablet portrait (768–1023px) to stack Grid_Map on top, Control_Board below
- [x] 7.2 Update `App.css` tablet portrait to render Block_Inventory as a horizontally scrollable row below Control_Board
- [x] 7.3 Verify tablet landscape (1024px+) side-by-side layout is correct (already implemented)
- [x] 7.4 Ensure safe area inset padding is applied (already implemented, verify)

## Task 8: Prevent accidental browser gestures

- [x] 8.1 Create `src/hooks/usePreventGestures.ts` hook that applies `touch-action: manipulation` and prevents `gesturestart`/`gesturechange` on a ref element
- [x] 8.2 Apply `usePreventGestures` to Block_Inventory and Control_Board container refs in `App.tsx`
- [x] 8.3 Add `touch-action: manipulation` CSS to `.app-right-panel` and `.app-block-inventory`
- [x] 8.4 Ensure non-interactive areas (challenge selector, grid map) retain normal scroll behavior

## Task 9: Keyboard and accessibility support

- [x] 9.1 Ensure all inventory blocks have `tabIndex={0}` and respond to Enter/Space for selection (verify from Task 2.4)
- [x] 9.2 Ensure all drop zones have `tabIndex={0}` and respond to Enter/Space for placement when active (verify from Task 3.5)
- [x] 9.3 Ensure board blocks respond to Enter/Space for remove/insert (verify from Task 4.3)
- [x] 9.4 Add visible focus indicators with 3:1 contrast on all interactive elements via CSS `:focus-visible` styles
- [x] 9.5 Verify ARIA live region announces selection, placement, and removal events (verify from Task 5.2, 5.5)

## Task 10: Property-based tests

- [x] 10.1 Create `src/core/__tests__/tapToPlace.property.test.ts` with fast-check generators (`arbitraryBlockType`, `arbitraryInventory`, `arbitraryControlBoard`, `arbitraryDropZonePosition`)
- [x] 10.2 [PBT] Property 1: Tapping an available block selects it — *For any* block type with count > 0, tapping it should set it as selected (Validates: 1.1, 1.3)
- [x] 10.3 [PBT] Property 2: Select then re-select deselects — *For any* block type with count > 0, selecting then tapping again should result in null selection (Validates: 1.2)
- [x] 10.4 [PBT] Property 3: Tapping disabled block is no-op — *For any* block type with count = 0 and any selection state, tapping should not change selection (Validates: 1.4)
- [x] 10.5 [PBT] Property 4: Placing selected block at drop zone — *For any* selected block with count > 0 and valid position, placement should add block and decrement count by 1 (Validates: 2.1, 2.2)
- [x] 10.6 [PBT] Property 5: No placement without selection — *For any* board state with null selection, tapping a drop zone should not change the board (Validates: 2.3)
- [x] 10.7 [PBT] Property 6: Post-placement selection reflects count — *For any* placed block, selection persists iff remaining count > 0 (Validates: 2.4, 2.5)
- [x] 10.8 [PBT] Property 7: Tap board block without selection removes it — *For any* board block with null selection, tapping removes it and increments inventory by 1 (Validates: 3.1)
- [x] 10.9 [PBT] Property 8: Tap board block with selection inserts before — *For any* selected block and board block, tapping inserts before without removing (Validates: 3.2)
- [x] 10.10 [PBT] Property 9: ARIA live region updates on state changes — *For any* state-changing action, the ARIA live region text should update (Validates: 8.3, 8.4)

## Task 11: Unit and integration tests

- [x] 11.1 Create `src/core/__tests__/tapToPlace.test.ts` with unit tests for selection logic (select, deselect, toggle, disabled block)
- [x] 11.2 Add unit tests for placement logic (place at drop zone, place on empty line, validation rejection)
- [x] 11.3 Add unit tests for removal logic (tap to remove, tap to insert with selection)
- [x] 11.4 Create `src/components/__tests__/TapToPlace.integration.test.tsx` with component tests for keyboard activation (Enter/Space)
- [x] 11.5 Add integration tests for ARIA live region text updates after selection, placement, and removal
- [x] 11.6 Add integration tests for CSS class application (`selected`, `dropZoneVisible`)
