import * as tf from '@tensorflow/tfjs';
import { SETTINGS } from './settings';

// Separate keys avoid models incorrectly saved by the original implementation.
const MODEL_SPECS = [
  { name: 'classifier', path: '/model/model.json', key: 'neidx-review-classifier-v1', load: tf.loadLayersModel },
  { name: 'detector', path: '/yolov8_model/model.json', key: 'neidx-review-detector-v1', load: tf.loadGraphModel },
];

async function loadModel(spec, refresh) {
  const cacheUrl = `indexeddb://${spec.key}`;
  if (!refresh) {
    try {
      return await spec.load(cacheUrl);
    } catch (_) {
      // A missing or inaccessible cache must not prevent loading bundled files.
    }
  }
  const model = await spec.load(spec.path);
  try {
    await model.save(cacheUrl);
  } catch (_) {
    // Caching is optional (for example, private browsing or a full disk).
  }
  return model;
}

export function disposeModels(models) {
  if (models) Object.values(models).forEach(model => model.dispose());
}

export async function loadModels({ refresh = false } = {}) {
  const models = {};
  try {
    await tf.ready();
    for (const spec of MODEL_SPECS) {
      models[spec.name] = await loadModel(spec, refresh);
    }
    tf.tidy(() => {
      models.classifier.predict(tf.zeros([1, SETTINGS.classifierSize, SETTINGS.classifierSize, 3]));
      models.detector.execute(tf.ones(models.detector.inputs[0].shape));
    });
    return models;
  } catch (error) {
    disposeModels(models);
    throw error;
  }
}
