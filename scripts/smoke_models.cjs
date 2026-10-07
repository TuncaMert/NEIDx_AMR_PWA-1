/* Executes bundled models on synthetic inputs; this is not an accuracy test. */
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

function artifacts(folder) {
  const spec = JSON.parse(fs.readFileSync(path.join(folder, 'model.json'), 'utf8'));
  const buffers = spec.weightsManifest.flatMap(group => group.paths.map(file => fs.readFileSync(path.join(folder, file))));
  const data = Buffer.concat(buffers);
  return {
    modelTopology: spec.modelTopology,
    weightSpecs: spec.weightsManifest.flatMap(group => group.weights),
    weightData: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    format: spec.format,
    signature: spec.signature,
  };
}

async function main() {
  await tf.setBackend('cpu');
  for (const [folder, load, shape] of [
    ['model', tf.loadLayersModel, [1, 224, 224, 3]],
    ['yolov8_model', tf.loadGraphModel, [1, 640, 640, 3]],
  ]) {
    let model, input, output;
    try {
      model = await load(tf.io.fromMemory(artifacts(path.join(__dirname, '..', 'public', folder))));
      input = tf.zeros(shape);
      output = model.predict(input);
      const outputs = Array.isArray(output) ? output : [output];
      for (const tensor of outputs) {
        const values = await tensor.data();
        if (!values.every(Number.isFinite)) throw new Error(`${folder}: nonfinite output`);
        console.log(`${folder}: input ${shape}, output ${tensor.shape}; all values finite`);
      }
    } finally {
      tf.dispose([input, output].filter(Boolean));
      if (model) model.dispose();
    }
  }
  console.log('Synthetic model execution passed. This does not establish prediction accuracy.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
