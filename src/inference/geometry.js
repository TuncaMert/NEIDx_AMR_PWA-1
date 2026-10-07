import { SETTINGS } from './settings';

// Preserve the original padding and coordinate conversion, including fractional
// upload coordinates and integer camera coordinates.
export function getAssayCrop(box, width, height, camera = false) {
  const ratio = Math.min(SETTINGS.detectorSize / width, SETTINGS.detectorSize / height);
  const [top, left, bottom, right] = box;
  const regionWidth = (right - left) / ratio;
  const regionHeight = (bottom - top) / ratio;
  const paddingX = regionWidth * SETTINGS.paddingRatio;
  const paddingY = regionHeight * SETTINGS.paddingRatio;
  const crop = {
    x: Math.max(0, left / ratio - paddingX / 2),
    y: Math.max(0, top / ratio - paddingY / 2),
    width: Math.min(width, regionWidth + paddingX),
    height: Math.min(height, regionHeight + paddingY),
  };
  if (camera) Object.keys(crop).forEach(key => { crop[key] = Math.trunc(crop[key]); });
  if (Object.values(crop).some(value => !Number.isFinite(value)) || crop.width <= 0 || crop.height <= 0) {
    throw new Error('The detected region is invalid. Try another image.');
  }
  // Reject the previously crashing tensor slice rather than silently changing
  // the region supplied to the classifier.
  if (camera && (crop.x + crop.width > width || crop.y + crop.height > height)) {
    throw new Error('The assay is too close to the image edge. Center it and try again.');
  }
  return crop;
}
