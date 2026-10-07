import * as tf from '@tensorflow/tfjs';
import { detectAssay, classifyCanvas, rankPredictions } from './predict';
import { getAssayCrop } from './geometry';

beforeAll(async () => { await tf.setBackend('cpu'); await tf.ready(); });
afterEach(() => jest.restoreAllMocks());

function detector(score) {
  return {
    inputs: [{ shape: [1, 640, 640, 3] }],
    execute: () => tf.tensor3d([320, 320, 100, 200, score], [1, 5, 1]),
  };
}

function mockPixels() {
  jest.spyOn(tf.browser, 'fromPixels').mockImplementation(() => tf.zeros([2, 2, 3], 'int32'));
}

test('decodes detector coordinates and releases tensors on success and no detection', async () => {
  mockPixels();
  const before = tf.memory().numTensors;
  for (let i = 0; i < 3; i++) {
    const result = await detectAssay(detector(0.9), {});
    expect(result.box).toEqual([220, 270, 420, 370]);
    expect(result.score).toBeCloseTo(0.9);
    expect(await detectAssay(detector(0.1), {})).toBeNull();
  }
  expect(tf.memory().numTensors).toBe(before);
});

test('releases detector tensors when suppression fails', async () => {
  mockPixels();
  jest.spyOn(tf.image, 'nonMaxSuppressionAsync').mockRejectedValue(new Error('suppression failed'));
  const before = tf.memory().numTensors;
  await expect(detectAssay(detector(0.9), {})).rejects.toThrow('suppression failed');
  expect(tf.memory().numTensors).toBe(before);
});

test('retains original classifier extraction, normalization and class order', async () => {
  const getImageData = jest.fn(() => ({}));
  const canvas = { getContext: () => ({ getImageData }) };
  jest.spyOn(tf.browser, 'fromPixels').mockImplementation(() => tf.fill([224, 224, 3], 255, 'int32'));
  const classifier = {
    predict: input => {
      expect(input.shape).toEqual([1, 224, 224, 3]);
      expect(input.dataSync()[0]).toBeCloseTo(255 / 127 - 1);
      return tf.tensor2d([[0.25, 0.75]]);
    },
  };
  const before = tf.memory().numTensors;
  expect(await classifyCanvas(classifier, canvas)).toEqual([
    { className: 'Positive', probability: '75.00' },
    { className: 'Negative', probability: '25.00' },
  ]);
  expect(getImageData).toHaveBeenCalledWith(0, 0, 224, 224);
  expect(tf.memory().numTensors).toBe(before);
});

test('retains crop geometry and integer camera coordinates', () => {
  expect(getAssayCrop([220, 270, 420, 370], 640, 640)).toEqual({ x: 262.5, y: 205, width: 115, height: 230 });
  expect(getAssayCrop([220, 270, 420, 370], 640, 640, true)).toEqual({ x: 262, y: 205, width: 115, height: 230 });
  expect(() => getAssayCrop([0, 600, 200, 640], 640, 640, true)).toThrow('image edge');
});

test('equal scores retain the original label order', () => {
  expect(rankPredictions([0.5, 0.5]).map(item => item.className)).toEqual(['Negative', 'Positive']);
});
