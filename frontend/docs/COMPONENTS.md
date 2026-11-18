# Frontend Components Documentation

Guide to the redesigned **"Calm Precision"** UI system, primitives, and feature components in `frontend/src/`.

## Design System & Foundations

- **Tokens:** [src/app/globals.css](../src/app/globals.css) defines semantic CSS variables on `:root` (Light Mode, deep royal blue `#1E40AF`) and `:root[data-theme="dark"]` (Dark Mode, deep cobalt blue `#1D4ED8` solid / `#4886F8` accent text), mapped via `@theme inline`.
- **Theming:** [src/context/ThemeContext.tsx](../src/context/ThemeContext.tsx) (`system` | `light` | `dark`) paired with [src/lib/theme-script.ts](../src/lib/theme-script.ts) for zero-flash hydration.

---

## UI Primitives (`src/components/ui/`)

| Component | Description |
|---|---|
| `Button` | Native `<button>` with `primary`, `secondary`, `ghost`, `danger`, `danger-ghost`, and `link` variants (`sm` / `md` / `lg` / `icon-*`). |
| `Input`, `Textarea`, `Select`, `Field`, `DateField` | Tokenized form controls (`Select` uses native `<select>`; `Textarea` auto-grows via `useAutoGrow`). |
| `Checkbox`, `Switch`, `SegmentedControl` | Native `<input type="checkbox">` and `<fieldset>` radio controls. |
| `Dialog`, `Sheet`, `ConfirmDialog` | Built on native `<dialog>.showModal()` with focus return and backdrop blur scrim. |
| `Menu`, `Popover`, `Tooltip` | Built on native `popover="auto"` and `useAnchorPosition`. |
| `Badge`, `Kbd`, `Avatar`, `Skeleton`, `Spinner`, `Progress`, `Callout`, `EmptyState`, `Logo`, `ThemedToaster` | Display primitives using semantic tokens and native `<progress>`. |

---

## Application Shell (`src/components/shell/`)

- `AppShell` — Responsive shell combining `Sidebar`, `TopBar`, main `<main id="main-content">`, optional `AssistantPanel`, `MobileTabBar`, and `MobileNavDrawer`.
- `Sidebar`, `SidebarNav`, `SidebarTags`, `UserMenu` — Collapsible 248px / 56px navigation with live counts, overdue indicator dot, inline tag creation, and theme/account menu.

---

## Tasks (`src/components/tasks/`)

- `TaskView` — Shared view controller for `/today`, `/upcoming`, `/tasks`, `/completed`, and `/tags/[tagId]` powered by `TasksProvider` and pure selectors in [src/lib/taskViews.ts](../src/lib/taskViews.ts).
- `TaskRow` & `TaskCheckbox` — Dense 40px rows (56px on mobile) with priority-colored circular checkboxes, `TagChip`s, `DueChip`s, and row action `Menu`.
- `QuickAdd` — Inline quick-add card (bottom sheet on mobile) with natural-language token parsing (`tomorrow !high #tag every week`) via [src/lib/quickAddParser.ts](../src/lib/quickAddParser.ts).
- `TaskDrawer` & `TaskProperties` — URL-synced (`?task=id`) detail/edit `Sheet` with dirty-state `Save` / `Discard` bar.
- `DisplayMenu`, `FilterBar`, `TaskGroup`, `TodayProgress`, `DueDateMenu`, `PriorityMenu`, `RecurrenceMenu`, `TagPicker` — Supporting view and property controls.

---

## AI Assistant (`src/components/assistant/`)

- `AssistantPanel` — Docked 384px right panel (`xl+`), floating overlay (`lg`), or modal `Sheet` (`< lg`).
- `AssistantFullPage` — Centered 720px workspace at `/chat`.
- `AssistantConversation`, `AssistantMessage`, `UserMessage`, `ToolActivity`, `ActionResultCard`, `AssistantComposer`, `AssistantEmpty`, `TypingIndicator` — Streaming chat experience wired to `useChat`.

---

## Command Palette, Settings, Marketing & Auth

- `src/components/command/`: `CommandPalette` (`⌘K`), `ShortcutsDialog` (`?`), `WorkspaceHotkeys`.
- `src/components/settings/`: `ProfileSection`, `AppearanceSection`, `ThemeCard`, `TagsSection`, `TagColorPicker`, `AccountSection`.
- `src/components/marketing/`: `LandingNav`, `Hero`, `ProductPreview`, `FeatureGrid`, `AiDemo`, `CtaBand`, `MarketingFooter`, `ThemeToggleButton`.
- `src/components/auth/`: `AuthBrandPanel`, `OAuthButtons`, `PasswordInput`, `PasswordStrength`.
