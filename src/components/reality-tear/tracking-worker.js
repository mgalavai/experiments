import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

let detector
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const files = await FilesetResolver.forVisionTasks(data.base)
      detector = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${data.base}/hand_landmarker.task`, delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.55, minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      })
      self.postMessage({ type: 'ready' })
    } else if (data.type === 'frame') {
      try {
        const result = detector.detectForVideo(data.frame, data.time)
        self.postMessage({ type: 'hands', landmarks: result.landmarks })
      } finally { data.frame.close() }
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message })
  }
}
