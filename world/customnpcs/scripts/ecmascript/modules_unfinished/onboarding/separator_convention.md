Separator convention for onboarding messages

Overview

- All separators are exactly 54 visible characters long (color codes like `&f` do not count toward the 54 characters).
- Two helper functions are available in `utils_chat.js`:
  - `tellSeparator(player, color)` — full-width bar. `color` defaults to `&f` (white).
  - `tellSeparatorTitle(player, title, sepColor, titleColor)` — centered title between bars. `sepColor` defaults to `&f`, `titleColor` defaults to `&f`.

Color convention used across onboarding phases (applied to the separator bars by default)

- Phase colors (use for `sepColor`):
  - Phase 0 (Immigrant Office): &6 (gold)
  - Phase 1 (State Hotel): &b (aqua)
  - Phase 2 (Economy Basics): &2 (dark green)

- Stage color hints (optional — use for titleColor if you want to emphasize stage):
  - Stage 1: &e (yellow)
  - Stage 2: &a (green)
  - Stage 3: &9 (blue)
  - Stage 4: &c (red)

- Step color: default to &f (white) unless otherwise specified.

Notes about titles and color codes

- Titles are centered and surrounded by single spaces on each side (e.g. `[===] Title [===]`).
- The title's visible length (characters other than `&` codes) is limited so the whole line never exceeds 54 visible characters. If the title is too long it will be truncated but color codes are preserved where possible.
- Example (menu):
  &f[=====================] &6Menu &f[=======================]

Where separators are used

- Separators are placed between steps of stages across onboarding phases to improve readability. For example:
  - Before the arrival welcome message at Phase 0.
  - Between dialog completion and timer start messages.
  - Before the State Hotel welcome and before each major step (room discovery, furniture grant, setHome prompts, !home tutorial).
  - In Phase 2 before/after currency guide and deposit confirmation steps.

If you want different colors for a specific step, change the `sepColor` / `titleColor` arguments in the code where `tellSeparatorTitle` is called.

Contact

- File: `world/customnpcs/scripts/ecmascript/modules_unfinished/onboarding/separator_convention.md`
- Helpers are implemented in `world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js` (functions `tellSeparator` and `tellSeparatorTitle`).
