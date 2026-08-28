# Night Shift Field Test

## Goal

Add a dedicated `/field-test` route that presents `public/42081-1.mpd` as a cinematic, interactive Three.js product scene. The experience should feel like a premium night-shift equipment study while remaining legible and responsive.

## Experience

- Full-viewport dark studio stage with warm key light, cool rim light, ground plane, fog, contact shadow, and subtle dust motes.
- Real MPD hierarchy loaded at runtime, centered and framed automatically.
- Drag to orbit, wheel/pinch to zoom, and a reset-view control.
- Compact HUD: model name, live scene status, material/light readouts, and a light toggle.
- Responsive layout with accessible buttons and a reduced-motion fallback for animation.

## Architecture

`FieldTestPage.jsx` owns the page shell and UI state. `FieldTestScene.jsx` owns renderer, camera, controls, lights, ground, particles, and MPD loading lifecycle. `field-test.css` owns the visual system. The route is registered in `App.jsx` without changing existing pages.

## Failure handling

Show a visible loading state while the model is parsed and a concise error state if the MPD or its LDraw dependencies cannot load. Keep the HUD usable even if the model fails.

## Validation

Run lint and production build. Smoke-test the route in the local Vite preview and verify the model loader, reset control, light toggle, and responsive canvas behavior.
