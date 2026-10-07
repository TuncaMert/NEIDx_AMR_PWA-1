import * as tf from '@tensorflow/tfjs';
import labels from '../model/labels.json';
import { MODEL_CLASSES } from '../model/classes';
import { SETTINGS } from './settings';
import { getAssayCrop } from './geometry';

/** Return the highest-scoring assay box in detector coordinates, or null. */
export async function detectAssay(detector, source) {
  let boxes, scores, selected;
  try {
    [boxes, scores] = tf.tidy(() => {
      const image = tf.browser.fromPixels(source);
      const [height, width] = image.shape;
      const size = Math.max(width, height);
      const padded = image.pad([[0, size - height], [0, size - width], [0, 0]]);
      const input = tf.image.resizeBilinear(padded, detector.inputs[0].shape.slice(1, 3))
        .div(255).expandDims(0);
      const output = detector.execute(input).transpose([0, 2, 1]);
      const boxWidth = output.slice([0, 0, 2], [-1, -1, 1]);
      const boxHeight = output.slice([0, 0, 3], [-1, -1, 1]);
      const left = output.slice([0, 0, 0], [-1, -1, 1]).sub(boxWidth.div(2));
      const top = output.slice([0, 0, 1], [-1, -1, 1]).sub(boxHeight.div(2));
      return [
        tf.concat([top, left, top.add(boxHeight), left.add(boxWidth)], 2).squeeze([0]),
        output.slice([0, 0, 4], [-1, -1, labels.length]).squeeze([0]).max(1),
      ];
    });
    selected = await tf.image.nonMaxSuppressionAsync(
      boxes, scores, SETTINGS.maxDetections, SETTINGS.iouThreshold, SETTINGS.scoreThreshold
    );
    return tf.tidy(() => {
      const selectedBoxes = boxes.gather(selected).dataSync();
      const selectedScores = scores.gather(selected).dataSync();
      if (!selectedScores.length) return null;
      const score = Math.max(...selectedScores);
      const offset = selectedScores.indexOf(score) * 4;
      return { box: Array.from(selectedBoxes.slice(offset, offset + 4)), score };
    });
  } finally {
    tf.dispose([boxes, scores, selected].filter(Boolean));
  }
}

export function rankPredictions(values) {
  return Array.from(values, (value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(({ value, index }) => ({
      className: MODEL_CLASSES[index],
      probability: (Math.fround(value) * 100).toFixed(2),
    }));
}

export async function classifyCanvas(classifier, canvas) {
  let logits;
  try {
    logits = tf.tidy(() => {
      // Intentionally retain the study implementation's upper-left extraction,
      // rather than resizing the entire preview. See REFACTOR_NOTES.md.
      const size = SETTINGS.classifierSize;
      const pixels = canvas.getContext('2d').getImageData(0, 0, size, size);
      const input = tf.browser.fromPixels(pixels).expandDims(0).toFloat()
        .div(SETTINGS.classifierDivisor).sub(1);
      return classifier.predict(tf.image.resizeBilinear(input, [size, size]));
    });
    return rankPredictions(await logits.data());
  } finally {
    if (logits) logits.dispose();
  }
}

/** The caller owns the source canvas or captured tensor; this function owns its temporaries. */
export async function predictImage(models, source, camera = false) {
  const canvas = document.createElement('canvas');
  let normalizedFrame, resizedCrop;
  try {
    let detectorSource = source;
    if (camera) {
      normalizedFrame = tf.tidy(() => source.toFloat().div(255));
      await tf.browser.toPixels(normalizedFrame, canvas);
      detectorSource = canvas.getContext('2d').getImageData(0, 0, SETTINGS.cameraSize, SETTINGS.cameraSize);
    }
    const detection = await detectAssay(models.detector, detectorSource);
    if (!detection) throw new Error('No assay area was detected. Try a clearer image.');
    const crop = getAssayCrop(detection.box, detectorSource.width, detectorSource.height, camera);
    if (camera) {
      resizedCrop = tf.tidy(() => {
        const region = normalizedFrame.slice([crop.y, crop.x, 0], [crop.height, crop.width, -1]);
        return tf.image.resizeBilinear(region, [SETTINGS.cameraPreview.height, SETTINGS.cameraPreview.width]);
      });
      await tf.browser.toPixels(resizedCrop, canvas);
    } else {
      canvas.width = SETTINGS.uploadPreview.width;
      canvas.height = SETTINGS.uploadPreview.height;
      canvas.getContext('2d').drawImage(source, crop.x, crop.y, crop.width, crop.height,
        0, 0, canvas.width, canvas.height);
    }
    const predictions = await classifyCanvas(models.classifier, canvas);
    return { predictions, preview: canvas.toDataURL(), detectionScore: detection.score };
  } finally {
    tf.dispose([normalizedFrame, resizedCrop].filter(Boolean));
  }
}
