<!-- /autoplan restore point: /Users/parasana/.gstack/projects/domain_specific_RAG/main-autoplan-restore-20260429-220041.md -->
# Implementation Plan: AWS Assistant Alignment & E2E Finalization

## Goal
Fix remaining alignment issues in the dashboard (Image #23) and ensure the system is fully functional end-to-end.

## Proposed Changes

### 1. Frontend: Top Bar Refinement
- Adjust spacing and alignment of the left-side components (Toggle button, Logo, Title).
- Ensure consistent padding across the header.

### 2. Frontend: Dashboard Grid & Resizing
- Verify the `ResizablePanelGroup` handles viewport changes without layout shifts.
- Refine sidebar header heights to perfectly match the main page header's vertical rhythm.

### 3. Frontend: Empty State Balance
- Fine-tune the vertical centering and typography of the greeting area.
- Ensure suggestion cards are perfectly aligned in the grid.

### 4. E2E Verification
- Confirm that citations correctly link to the sidebar.
- Verify streaming and non-streaming modes with the latest backend scoring logic.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|----------|
| 1 | CEO | Standardize headers into SidebarHeader | Mechanical | DRY | Ensures visual symmetry across sidebars. | - |
| 2 | CEO | Implement panel size persistence | Taste | Pragmatic | Saves user layout preferences across sessions. | - |
| 3 | CEO | Interactive citation hover previews | Taste | Completeness | Bridges the gap between chat and sources. | - |
| 4 | CEO | Flexbox-based vertical centering | Mechanical | Hierarchy | Balances the empty dashboard workspace. | - |
| 5 | Design | Header loading pulse state | Taste | Fight Uncertainty | Provides visual feedback during data retrieval. | - |
| 6 | Design | Standardized h-16/h-14 headers | Mechanical | Specificity | Aligns all components to a consistent vertical grid. | - |
| 7 | Eng | useDashboardLayout custom hook | Taste | Explicit over Clever | Decouples layout persistence from route components. | - |
| 8 | DX | Champion-tier TTHW target | Taste | Speed as Feature | Optimizes onboarding for a < 2 min hello-world. | - |

## DX Plan Review — Scorecard

| Dimension | Score | Principle |
|-----------|-------|-----------|
| Getting Started | 10/10 | Zero Friction |
| API/Interaction | 9/10 | Fight Uncertainty |
| Error Messages | 8/10 | Code in Context |
| Dev Environment | 10/10 | Speed is a Feature |
| **Overall DX** | **9.2/10** | **Champion Tier** |

## Cross-Phase Themes
- **Theme: Transparency** — Flagged in CEO (Trust), Design (Interaction States), and DX (Citations). High-confidence signal that the "Thinking" stepper and HoverCards are critical path items.
- **Theme: Persistence** — Flagged in Design (Continuity) and Eng (Architecture). Decoupled layout state ensures a robust user experience across refreshes.

### Final Verification Result
- Citations: Fully interactive with HoverCards.
- Sidebars: Standardized with SidebarHeader and loading states.
- Persistence: useDashboardLayout hook implemented.
- Alignment: Grid balanced, input widened, greeting centered.

**VERDICT: READY FOR FINAL APPROVAL**

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|----------|
| 1 | CEO | Standardize headers into SidebarHeader | Mechanical | DRY | Ensures visual symmetry across sidebars. | - |
| 2 | CEO | Implement panel size persistence | Taste | Pragmatic | Saves user layout preferences across sessions. | - |
| 3 | CEO | Interactive citation hover previews | Taste | Completeness | Bridges the gap between chat and sources. | - |
| 4 | CEO | Flexbox-based vertical centering | Mechanical | Hierarchy | Balances the empty dashboard workspace. | - |
| 5 | Design | Header loading pulse state | Taste | Fight Uncertainty | Provides visual feedback during data retrieval. | - |
| 6 | Design | Standardized h-16/h-14 headers | Mechanical | Specificity | Aligns all components to a consistent vertical grid. | - |
| 7 | Eng | useDashboardLayout custom hook | Taste | Explicit over Clever | Decouples layout persistence from route components. | - |
