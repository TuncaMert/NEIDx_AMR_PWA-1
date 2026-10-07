import * as tf from '@tensorflow/tfjs';
import { loadModels, disposeModels } from './models';

jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(),
  loadLayersModel: jest.fn(),
  loadGraphModel: jest.fn(),
  tidy: callback => callback(),
  zeros: jest.fn(),
  ones: jest.fn(),
}));

const model = () => ({
  save: jest.fn().mockResolvedValue(), dispose: jest.fn(), predict: jest.fn(), execute: jest.fn(),
  inputs: [{ shape: [1, 640, 640, 3] }],
});

beforeEach(() => jest.clearAllMocks());

test('first load keeps classifier and detector separate when cache storage is unavailable', async () => {
  const classifier = model();
  const detector = model();
  classifier.save.mockRejectedValue(new Error('Storage denied'));
  tf.loadLayersModel.mockRejectedValueOnce(new Error('No cache')).mockResolvedValueOnce(classifier);
  tf.loadGraphModel.mockRejectedValueOnce(new Error('No cache')).mockResolvedValueOnce(detector);
  const result = await loadModels();
  expect(result).toEqual({ classifier, detector });
  expect(tf.loadLayersModel).toHaveBeenLastCalledWith('/model/model.json');
  expect(tf.loadGraphModel).toHaveBeenLastCalledWith('/yolov8_model/model.json');
  disposeModels(result);
  expect(classifier.dispose).toHaveBeenCalledTimes(1);
  expect(detector.dispose).toHaveBeenCalledTimes(1);
});

test('refresh bypasses both caches and uses the correct model types', async () => {
  tf.loadLayersModel.mockResolvedValueOnce(model());
  tf.loadGraphModel.mockResolvedValueOnce(model());
  const result = await loadModels({ refresh: true });
  expect(tf.loadLayersModel).toHaveBeenCalledTimes(1);
  expect(tf.loadLayersModel).toHaveBeenCalledWith('/model/model.json');
  expect(tf.loadGraphModel).toHaveBeenCalledWith('/yolov8_model/model.json');
  disposeModels(result);
});

test('failed detector download disposes the already loaded classifier', async () => {
  const classifier = model();
  tf.loadLayersModel.mockResolvedValueOnce(classifier);
  tf.loadGraphModel.mockRejectedValueOnce(new Error('Download failed'));
  await expect(loadModels({ refresh: true })).rejects.toThrow('Download failed');
  expect(classifier.dispose).toHaveBeenCalledTimes(1);
});
