# Lifeline showcase design

## Goal

Add a new `/lifeline` route that reproduces the original personal starter included with [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline).

## Compatibility decision

The upstream registry targets Next.js App Router and Tailwind CSS. This project is a Vite React app with plain CSS. The page will therefore be a Vite-native adaptation rather than installing Next.js-only source. It preserves Lifeline's signature behavior and milestone model without changing the rest of the application stack.

## Page design

The timeline uses the upstream "Your Name" starter data from 1990 to 2026. Desktop uses a full-height horizontal rail controlled by the wheel, trackpad, drag gesture, and arrow keys. Mobile switches to a vertical document timeline.

The visual treatment faithfully ports the upstream Lifeline demo rather than inventing a project-specific theme. It uses a quiet white canvas, Geist typography, zinc text, a hairline dashed rail, sparse year columns, and minimal navigation.

Every year from 1990 through 2026 receives a marker so the empty time between milestones is visible. Only the content present in the original starter renders: six event years, the Acme company marker, the legend, and the clickable fireworks finale. The page adds no custom badges, people, media, controls, branding, or copy.

## Structure

- `LifelinePage.jsx` owns page state, navigation, progress, lightbox state, and responsive rendering.
- `lifelineData.js` defines and normalizes milestone data into a stable array.
- `lifeline.css` ports the upstream demo's responsive layout, spacing, colors, motion, and typography into isolated plain CSS.
- `App.jsx` registers the `/lifeline` route and gives its top navigation a matching theme.

## Behavior and accessibility

The desktop stage is focusable and supports left, right, Home, and End keys. Controls have labels, media has alternative text, dialogs close with Escape, and reduced-motion users receive immediate state changes without the intro or finale animation. Mobile keeps content in chronological DOM order. If an image fails, its card retains a readable caption and color field.

## Verification

Run ESLint, a production build, and `git diff --check`. Then inspect desktop and mobile layouts in a browser, exercise scroll, range, keyboard, hover, drag, lightbox, and finale behavior, check the console, push `main`, and verify the deployed route.
