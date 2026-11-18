# Ghurfa: rules for every Claude on this repo

Ghurfa is our CSC443 Study Room Booking app (Topic 02, team Not_vibeCoding). Four people build it, each with their own Claude. These rules keep the app looking like one product. Follow them on every change, and say so in your PR if you have to break one.

## The design

1. **Match the design pack first.** The pack's 8 screens and `components.html` decide spacing, type scale, component structure and phone layout. 8 team points are for screens "implemented faithfully". If the pack and your idea disagree, the pack wins.
2. **Colours only from the tokens** in `src/index.css`: `paper`, `surface`, `ink`, `muted`, `line`, `brand-50` to `brand-900` (navy), `accent-50` to `accent-900` (ochre). Write `bg-brand-800` or `text-muted`, never a hex code or a Tailwind default colour like `blue-600` in a page.
3. **Fonts:** `font-display` (Fraunces) for headings and room names, `font-body` (IBM Plex Sans) for everything else. No other fonts.
4. **Buttons only from `buttonClass()`** in `src/lib/buttons.js`: `'primary'`, `'secondary'` or `'quiet'`, optionally `'small'`. One primary button per screen.
5. **Shared pieces, never copies.** Loading, empty and error states: `src/components/states/`. A room's day: `DayTimeline` (+ `TimelineLegend`). Status words: `roomStatus()` + `statusChipClass()`. If you need a variant, add a prop to the shared piece and tell the team.
6. **Icons only through `<Icon>`** (`src/components/Icon.jsx`): `import { Clock } from 'lucide-react'`, then `<Icon icon={Clock} />` (20 px) or `<Icon icon={Clock} size="sm" />` (16 px). Outline only, 1.5 stroke, text colour. Never render a lucide icon directly, never add another icon set, never use emoji as icons.
7. **The logo is `<Logo />` or `<LogoMark />`** (`src/components/Logo.jsx`): the doorway with the two-hour clock wedge. Do not redraw it.
8. **Flat and soft.** Do not add shadows, gradients, glows, blur or decorative animations. Motion only answers "where did this come from?" or "did that register?", and only from the named set in `src/index.css`: hover and the button press (`buttonClass`), `pop-in` for menus and popovers (with an `origin-*` toward what opened them), `sheet` for `ConfirmDialog`, `toast-in` for the undo message, `shake()` from `src/lib/motion.js` on the field that stopped a submit, the loading pulse and the undo ring. Curves are `ease-enter`, `ease-exit`, `ease-move`. Nothing animates from the keyboard (arrow keys, tabs), and `prefers-reduced-motion` switches it all off except the pulse and the ring. Reversible actions (cancelling a booking) get Undo, not an "are you sure?". Small controls get a 44px target with `hit-area relative`. Corners are rounded (team choice, softer than the pack): cards and panels `rounded-xl`, buttons and fields `rounded-lg`, chips and timeline bars `rounded-md`, the blocks inside a bar `rounded-sm`. (Sign in's background and History's entrance animation already go beyond the pack; those are their owner's call.)
9. **21st.dev is a source, not a dependency.** You may port a 21st.dev component: rewrite it as plain JSX with our tokens, `buttonClass`, `Icon` and the browser's own elements (`<dialog>`), with no `npx shadcn add`, no Radix, no framer-motion, no TypeScript. Credit it in the file's first comment (`Adapted from 21st.dev/@author/name`). Keep each ported file short enough to explain in the exam. Before porting, check `src/components/` (ConfirmDialog, UndoToast, MobileTabBar, TimeSlotPicker already exist). Other UI kits (Aceternity, Magic UI, React Bits, LottieFiles, shadcn/ui) stay out. Ask the team before adding any npm package.

## The words

Plain, calm, exact. Say what is true now ("Nine rooms are free right now."), name the rule that was broken ("That overlaps a booking from 14:00 to 15:30."), offer the next step ("See the whole day."). No "Oops", no exclamation marks. Times are 24-hour (`14:00`), as in the pack.

## The code

- React 19, React Router (`import { Link } from 'react-router'`), Tailwind 4, Vite. Phase 1 keeps data in React state: no localStorage, no backend.
- Single quotes, semicolons, `const`, arrow callbacks, `export default function Name({ props })`.
- Keep it explainable: each of us must walk through, justify and live-edit our own files in the individual exam (70 points). Small components, no clever tricks, a short comment where the reason is not obvious.
- **Ownership:** edit only your own surfaces (the member-to-files table in `README.md`). Shared files (`App.jsx`, `Layout.jsx`, `index.css`, `src/lib/`, `src/components/` shared pieces) change only after telling the team, and the README's Shared code table says so.
- The page frame is `frame` from `src/lib/frame.js` (full screen up to 1920 px); `Layout` already applies it, so a page only sets its own inner widths.
- Before a PR: `npm test` and `npm run build` pass, and the screen is checked at 1366 px, 1920 px and 390 px wide with nothing scrolling sideways.
- PRs start with `**Notion card:** CSC-n · title`. Never push straight to `main`; `git pull` before you start.
