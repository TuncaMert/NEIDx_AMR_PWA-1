# Changes in the reviewer version

## Code organization

The original classification component is split into UI and camera handling (`src/pages/Classify.js`), model loading (`src/inference/models.js`), crop geometry (`geometry.js`), prediction (`predict.js`) and numerical settings (`settings.js`). Duplicate detection code, unused calculations and abandoned comments were removed.

## Runtime fixes

- Load the classifier and detector separately with their correct model loaders.
- Allow inference when browser model caching is unavailable; use separate reviewer cache keys and an explicit model reload action.
- Dispose temporary tensors, models, camera streams and image URLs appropriately.
- Process images on a detached canvas rather than relying on result elements being mounted.
- Show recoverable errors for missing detections and invalid camera crop boundaries instead of reloading the page.
- Provide the router required by the application smoke test.

## Interface

Camera is the first and default tab, using the original preview layout. Capture remains 640 × 640. Start camera disappears once active. Successful classification closes the photo controls and brings results into view; the controls can be reopened for another image.

## Preserved settings and legacy files

Model artifacts, labels, thresholds and preprocessing formulas are retained. Detailed processing is recorded in [Models and image processing](REPRODUCIBILITY.md). Fixes are not evidence of real-image equivalence to the study version.

The invalid legacy worker is replaced by a generated production service worker. It caches the app and both models, reports offline readiness, and activates updates after existing tabs close. Netlify configuration is included. Legacy timestamp API and manifest.yml files remain but are not used by this Netlify deployment. Model inference calculations are unchanged by the offline update.

`original-to-refactored.patch` contains the source changes relative to the original snapshot.
