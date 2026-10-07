# Models and image processing

## Models

| Model | Format and input | Output |
| --- | --- | --- |
| Classifier | TensorFlow.js layers model; 224 × 224 RGB | Two softmax scores: 0 Negative, 1 Positive |
| Assay detector | TensorFlow.js graph model; 640 × 640 RGB | Assay Area detections |

The classifier export identifies Keras 2.13.1. Detector metadata identifies Ultralytics YOLOv8n. Model JSON and weight files are preserved from the supplied implementation.

## Processing sequence

1. Pad the input to a square, resize for the detector and divide pixel values by 255.
2. Apply nonmaximum suppression with IoU threshold 0.45, score threshold 0.2 and a maximum of 500 detections.
3. Select the highest-scoring region and expand its width and height by 15 percent.
4. Render upload regions to 240 × 320 pixels. For camera regions, truncate crop coordinates to integers and resize to 300 × 400 using TensorFlow bilinear interpolation.
5. Extract the upper-left 224 × 224 pixels, normalize with `pixel / 127 - 1`, and run the classifier.
6. Display both class scores in descending order, formatted as percentages.

The upload crop box resets before detection. The different intermediate sizes and upper-left extraction are retained from the original implementation; they were not standardized during refactoring. Camera crops extending beyond the image are rejected with a retry message.

## Environment and provenance

Use the included npm lockfile. It records React 16.8.6, react-scripts 5.0.1, TensorFlow.js 4.10.0, Express 4.21.2 and react-cropper 1.2.0. Dependency versions were not upgraded during the refactor.

`original-file-checksums.json` records the input snapshot, `original-to-refactored.patch` records source changes, and the root `SHA256SUMS` identifies packaged files.

See [Validation](VALIDATION.md) for executed checks. Example images and verified expected outputs are not included, so real-image equivalence and manuscript performance have not been established for this reviewer revision.
