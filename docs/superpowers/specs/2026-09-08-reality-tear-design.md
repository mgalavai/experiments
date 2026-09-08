# Reality tear

Approved in conversation on September 8, 2026. Build a standalone `/reality-tear` route in the existing Vite/React app. Hide the shared navigation on this immersive route.

The live camera forms a textured, subdivided sheet. Two thumb/index pinches grab the sheet; separating the hands opens an irregular vertical tear. Both halves curl toward the viewer, retain the live video texture, and receive green edge light. Layered animated green glyph rain fills the space behind the sheet. Releasing holds the opening; a new grab can widen it; Reset restores the sheet.

Front camera is the default for a propped-up phone. Provide camera switching, stop/restart, a camera-free interactive preview, and pointer/touch dragging. The preview must be clearly identified. Camera and hand detection stay on-device. Serve the model and WASM locally. A tracking worker prevents inference from blocking rendering. Handle denial, unavailable cameras, model errors, and interrupted streams. Stop tracks and dispose rendering and tracking resources on exit.

Visual direction: full viewport, black and bone-white type, acid green accent, very little UI. Start view shows a procedural photographic-dark sheet and an animated tear; one camera action and a secondary preview action. Live view has compact controls, two grip indicators, and short gesture guidance.

Implementation: independent gesture mapping, Three.js renderer, classic bundled inference worker, React lifecycle/UI, scoped CSS. Lazy-load the route. Validate gesture math and release/reset behavior with Node tests, lint changed source, production build, and browser checks for preview, resize, pointer tearing, denial, and camera lifecycle. Real phone hand tracking still requires device validation. This is a camera-plane illusion, not a reconstructed 3D room.

## Validation

- Targeted ESLint and production Vite build passed.
- Four Node tests passed: grab/pull/release/regrab/reset, two-hand requirement and ordering, crop/mirror alignment, scale-independent pinch ratio.
- Isolated Chrome checks passed at 390×844, 360×640, 844×390, and 1440×900. Inspected screenshots for landing, open tear, and complete reset. Mouse and real two-contact touch input both opened the tear; no page errors.
- Camera-denied path showed retry/settings guidance and preview option.
- A prerecorded reference clip supplied through Chrome's fake camera exercised the real local MediaPipe worker. It detected two pinching hands, opened the live-textured tear, and stopped the video stream on exit. This is fixture validation, not physical-phone verification.
- Existing main bundle size warning remains; the new route is lazy-loaded and the hand model/runtime load only when opening the camera.
