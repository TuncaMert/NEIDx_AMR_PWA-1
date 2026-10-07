// Study parameters: changes here require validation against the manuscript.
export const SETTINGS = Object.freeze({
  classifierSize: 224,
  cameraSize: 640,
  detectorSize: 640,
  maxDetections: 500,
  iouThreshold: 0.45,
  scoreThreshold: 0.2,
  paddingRatio: 0.15,
  classifierDivisor: 127,
  uploadPreview: { width: 240, height: 320 },
  cameraPreview: { width: 300, height: 400 },
});
