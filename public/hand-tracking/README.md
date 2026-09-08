# Local hand tracking assets

MediaPipe Tasks Vision 0.10.32, Apache-2.0, from `@mediapipe/tasks-vision`.
WASM loader and binary pairs are copied unmodified from the package's `wasm` directory.
`hand_landmarker.task` is Google's float16 hand landmarker, version 1:
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task

`worker.js` is generated from `src/components/reality-tear/tracking-worker.js` by `npm run build:hand-worker`, also run before dev/build. It performs inference locally. No camera images are uploaded.

When upgrading the dependency, copy matching WASM files and rebuild the worker together.
