# Lifeline showcase design

## Goal

Add a new `/lifeline` route that demonstrates the interaction vocabulary of [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline) with a rich fictional product history tied to the Volvo loader already used by this project.

## Compatibility decision

The upstream registry targets Next.js App Router and Tailwind CSS. This project is a Vite React app with plain CSS. The page will therefore be a Vite-native adaptation rather than installing Next.js-only source. It preserves Lifeline's signature behavior and milestone model without changing the rest of the application stack.

## Page design

The timeline tells the fictional life of "Project Ironwood," a wheel loader program spanning 1954 to 2026. Desktop uses a full-height horizontal rail controlled by the wheel, trackpad, drag gesture, arrow keys, and an on-screen range control. Mobile switches to a vertical document timeline.

Milestones use the full content range: multiple events, event links, hover media, floating draggable photo cards, badges, organization marks, mentors and collaborators, custom age labels, a current-year marker, and a clickable finale effect. A restrained industrial palette, technical labels, warm archival media, and large condensed typography connect the page to construction machinery without copying the existing field-test screen.

## Structure

- `LifelinePage.jsx` owns page state, navigation, progress, lightbox state, and responsive rendering.
- `lifelineData.js` defines and normalizes milestone data into a stable array.
- `lifeline.css` contains the isolated responsive layout, motion, and visual styling.
- `App.jsx` registers the `/lifeline` route and gives its top navigation a matching theme.

## Behavior and accessibility

The desktop stage is focusable and supports left, right, Home, and End keys. Controls have labels, media has alternative text, dialogs close with Escape, and reduced-motion users receive immediate state changes without the intro or finale animation. Mobile keeps content in chronological DOM order. If an image fails, its card retains a readable caption and color field.

## Verification

Run ESLint, a production build, and `git diff --check`. Then inspect desktop and mobile layouts in a browser, exercise scroll, range, keyboard, hover, drag, lightbox, and finale behavior, check the console, push `main`, and verify the deployed route.
