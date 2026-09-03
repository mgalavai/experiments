# Lifeline showcase design

## Goal

Add a new `/lifeline` route that demonstrates the interaction vocabulary of [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline) with a rich fictional product history tied to the Volvo loader already used by this project.

## Compatibility decision

The upstream registry targets Next.js App Router and Tailwind CSS. This project is a Vite React app with plain CSS. The page will therefore be a Vite-native adaptation rather than installing Next.js-only source. It preserves Lifeline's signature behavior and milestone model without changing the rest of the application stack.

## Page design

The timeline tells the fictional life of "Project Ironwood," a wheel loader program spanning 1954 to 2026. Desktop uses a full-height horizontal rail controlled by the wheel, trackpad, drag gesture, and arrow keys. Mobile switches to a vertical document timeline.

The visual treatment will faithfully port the upstream Lifeline demo rather than inventing a project-specific theme. It uses a quiet white canvas, Geist-like sans typography, zinc text, a hairline dashed rail, sparse year columns, minimal navigation, blue and pink people markers, and lightly tilted media cards. Dark mode mirrors upstream's black and zinc palette. The generated machine history remains custom.

Every year from 1954 through 2026 receives a marker so the empty time between milestones is visible. Milestone years can carry multiple events, event links, hover media, floating draggable photo cards, badges, organization marks, mentors and collaborators, custom age labels, a current-year marker, and a clickable finale effect.

## Structure

- `LifelinePage.jsx` owns page state, navigation, progress, lightbox state, and responsive rendering.
- `lifelineData.js` defines and normalizes milestone data into a stable array.
- `lifeline.css` ports the upstream demo's responsive layout, spacing, colors, motion, and typography into isolated plain CSS.
- `App.jsx` registers the `/lifeline` route and gives its top navigation a matching theme.

## Behavior and accessibility

The desktop stage is focusable and supports left, right, Home, and End keys. Controls have labels, media has alternative text, dialogs close with Escape, and reduced-motion users receive immediate state changes without the intro or finale animation. Mobile keeps content in chronological DOM order. If an image fails, its card retains a readable caption and color field.

## Verification

Run ESLint, a production build, and `git diff --check`. Then inspect desktop and mobile layouts in a browser, exercise scroll, range, keyboard, hover, drag, lightbox, and finale behavior, check the console, push `main`, and verify the deployed route.
